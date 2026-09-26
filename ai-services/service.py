"""HTTP service exposing the four-agent pipeline and the semantic knowledge base.

Run with::

    uvicorn service:app --host 127.0.0.1 --port 8000

The Express backend talks to this service over HTTP so the sentence-transformer
model is loaded once instead of on every workflow run.
"""

import threading
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

import settings
from agents.retrieval_agent import knowledge_base
from agents.retrieval_agent.embeddings import EmbeddingUnavailable
from orchestrator.pipeline import Pipeline

settings.ensure_directories()


def _warm_embeddings() -> None:
    try:
        from agents.retrieval_agent import embeddings
        embeddings.get_model()
    except Exception:  # pragma: no cover - best-effort warmup
        pass


@asynccontextmanager
async def lifespan(_app: FastAPI):
    threading.Thread(target=_warm_embeddings, name="embedding-warmup", daemon=True).start()
    yield


app = FastAPI(title="Social Listening Intelligence Agents", version="2.0.0", lifespan=lifespan)
pipeline = Pipeline()

# Async runs keep their full result in memory (keyed by job id) so the Express
# backend can finalize -- persist analyses/insight -- once the job completes.
_async_results: dict[str, dict[str, Any]] = {}
_async_lock = threading.Lock()
_async_run_lock = threading.Lock()
ASYNC_RESULT_LIMIT = 50


def _store_result(job_id: str, result: dict[str, Any]) -> None:
    with _async_lock:
        _async_results[job_id] = result
        while len(_async_results) > ASYNC_RESULT_LIMIT:
            _async_results.pop(next(iter(_async_results)))


def _read_result(job_id: str) -> dict[str, Any] | None:
    with _async_lock:
        return _async_results.get(job_id)


class RunRequest(BaseModel):
    query: str
    posts: list[dict[str, Any]] = Field(default_factory=list)
    limit: int = 10


class AnalyzeRequest(BaseModel):
    posts: list[dict[str, Any]] = Field(default_factory=list)


class SearchRequest(BaseModel):
    query: str
    posts: list[dict[str, Any]] = Field(default_factory=list)
    limit: int = 10


class KnowledgeDocumentIn(BaseModel):
    title: str
    text: str
    source: str = ""
    tags: list[str] = Field(default_factory=list)


def _guard(error: Exception) -> HTTPException:
    if isinstance(error, EmbeddingUnavailable):
        return HTTPException(status_code=503, detail=str(error))
    return HTTPException(status_code=400, detail=str(error))


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "knowledge": knowledge_base.stats(),
        "recentJobs": len(pipeline.jobs.list(10)),
    }


@app.post("/run")
def run_workflow(request: RunRequest) -> dict[str, Any]:
    try:
        return pipeline.run(request.posts, request.query, request.limit)
    except (ValueError, EmbeddingUnavailable) as error:
        raise _guard(error) from error


@app.post("/run/async", status_code=202)
def run_workflow_async(request: RunRequest) -> dict[str, Any]:
    query = (request.query or "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="query is required")
    job = pipeline.jobs.create(query)

    def worker() -> None:
        try:
            # The pipeline and its agents are a single shared instance, so runs are serialized.
            with _async_run_lock:
                result = pipeline.run(request.posts, query, request.limit, job_id=job.id)
            _store_result(job.id, result)
        except Exception:  # pipeline.run already marks the job as failed
            pass

    threading.Thread(target=worker, name=f"pipeline-{job.id[:8]}", daemon=True).start()
    return {"job": job.as_dict()}


@app.post("/analyze")
def analyze(request: AnalyzeRequest) -> dict[str, Any]:
    try:
        posts = pipeline.coordinator.collection.run(request.posts)
        analyses = pipeline.coordinator.analysis.run(posts)
    except (ValueError, EmbeddingUnavailable) as error:
        raise _guard(error) from error
    return {
        "posts": [post.as_dict() for post in posts],
        "analyses": [analysis.as_dict() for analysis in analyses],
    }


@app.post("/search")
def search(request: SearchRequest) -> dict[str, Any]:
    try:
        posts = pipeline.coordinator.collection.run(request.posts)
        evidence = pipeline.coordinator.retrieval.run((posts, request.query, request.limit))
    except (ValueError, EmbeddingUnavailable) as error:
        raise _guard(error) from error
    return {"evidence": [item.as_dict() for item in evidence]}


@app.post("/generate")
def generate(request: RunRequest) -> dict[str, Any]:
    try:
        result = pipeline.run(request.posts, request.query, request.limit)
    except (ValueError, EmbeddingUnavailable) as error:
        raise _guard(error) from error
    return {"insight": result["insight"], "job": result["job"]}


@app.get("/jobs")
def list_jobs(limit: int = 20) -> dict[str, Any]:
    return {"jobs": [job.as_dict() for job in pipeline.jobs.list(limit)]}


@app.get("/jobs/{job_id}")
def get_job(job_id: str) -> dict[str, Any]:
    job = pipeline.jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"job": job.as_dict(), "result": _read_result(job_id)}


@app.get("/knowledge/documents")
def list_documents() -> dict[str, Any]:
    return {"documents": [document.as_dict() for document in knowledge_base.list_documents()]}


@app.post("/knowledge/documents")
def add_document(document: KnowledgeDocumentIn) -> dict[str, Any]:
    try:
        created = knowledge_base.add_document(document.title, document.text, document.source, document.tags)
    except (ValueError, EmbeddingUnavailable) as error:
        raise _guard(error) from error
    return {"document": created.as_dict(), "stats": knowledge_base.stats()}


@app.delete("/knowledge/documents/{document_id}")
def delete_document(document_id: str) -> dict[str, Any]:
    if not knowledge_base.delete_document(document_id):
        raise HTTPException(status_code=404, detail="Knowledge document not found")
    return {"deleted": True, "stats": knowledge_base.stats()}


@app.post("/knowledge/reindex")
def reindex() -> dict[str, Any]:
    try:
        knowledge_base.reindex()
    except EmbeddingUnavailable as error:
        raise _guard(error) from error
    return {"stats": knowledge_base.stats()}


@app.get("/knowledge/search")
def search_knowledge(query: str, topK: int = 5) -> dict[str, Any]:
    try:
        hits = knowledge_base.search(query, topK)
    except EmbeddingUnavailable as error:
        raise _guard(error) from error
    return {"results": [hit.as_dict() for hit in hits]}


@app.get("/knowledge/stats")
def knowledge_stats() -> dict[str, Any]:
    return knowledge_base.stats()
