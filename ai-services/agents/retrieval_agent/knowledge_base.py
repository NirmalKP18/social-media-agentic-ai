"""Knowledge base: document storage, chunking, embedding, and semantic search."""

import json
import re
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np

import settings
from . import embeddings
from .vector_store import VectorStore

INDEX_FILE = settings.INDEX_DIR / "kb.faiss"
METADATA_FILE = settings.INDEX_DIR / "kb_meta.json"

_WHITESPACE_RE = re.compile(r"\s+")


@dataclass(slots=True)
class Document:
    id: str
    title: str
    source: str
    tags: list[str]
    text: str
    created_at: str

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class KnowledgeHit:
    doc_id: str
    title: str
    source: str
    chunk: str
    chunk_index: int
    score: float

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def chunk_text(text: str) -> list[str]:
    """Split text into overlapping, sentence-aware chunks."""

    normalized = _WHITESPACE_RE.sub(" ", text or "").strip()
    if not normalized:
        return []
    if len(normalized) <= settings.CHUNK_SIZE:
        return [normalized] if len(normalized) >= settings.MIN_CHUNK_SIZE else []

    chunks: list[str] = []
    start = 0
    length = len(normalized)
    while start < length:
        end = min(length, start + settings.CHUNK_SIZE)
        if end < length:
            window = normalized[start:end]
            for separator in (". ", "! ", "? ", "; ", ", "):
                index = window.rfind(separator)
                if index > settings.CHUNK_SIZE * 0.5:
                    end = start + index + len(separator)
                    break
        chunk = normalized[start:end].strip()
        if len(chunk) >= settings.MIN_CHUNK_SIZE:
            chunks.append(chunk)
        if end >= length:
            break
        start = max(end - settings.CHUNK_OVERLAP, start + 1)
    return chunks


def _document_path(document_id: str) -> Path:
    return settings.DOCUMENTS_DIR / f"{document_id}.json"


def list_documents() -> list[Document]:
    settings.ensure_directories()
    documents: list[Document] = []
    for path in sorted(settings.DOCUMENTS_DIR.glob("*.json")):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            documents.append(Document(**payload))
        except (OSError, TypeError, ValueError, json.JSONDecodeError):
            continue
    documents.sort(key=lambda document: document.created_at, reverse=True)
    return documents


def get_document(document_id: str) -> Document | None:
    path = _document_path(document_id)
    if not path.exists():
        return None
    try:
        return Document(**json.loads(path.read_text(encoding="utf-8")))
    except (OSError, TypeError, ValueError, json.JSONDecodeError):
        return None


def add_document(title: str, text: str, source: str = "", tags: list[str] | None = None) -> Document:
    if not (text or "").strip():
        raise ValueError("document text is required")
    settings.ensure_directories()
    document = Document(
        id=uuid.uuid4().hex,
        title=(title or "Untitled document").strip()[:200],
        source=(source or "").strip()[:500],
        tags=[str(tag).strip()[:50] for tag in (tags or []) if str(tag).strip()][:20],
        text=str(text).strip(),
        created_at=_now(),
    )
    _document_path(document.id).write_text(json.dumps(document.as_dict(), ensure_ascii=False), encoding="utf-8")
    reindex()
    return document


def delete_document(document_id: str) -> bool:
    path = _document_path(document_id)
    if not path.exists():
        return False
    path.unlink()
    reindex()
    return True


def _load_store() -> VectorStore | None:
    if INDEX_FILE.exists() and METADATA_FILE.exists():
        try:
            return VectorStore.load(INDEX_FILE, METADATA_FILE)
        except (OSError, ValueError, KeyError, json.JSONDecodeError):
            return None
    return None


def _build_store() -> VectorStore:
    documents = list_documents()
    items: list[tuple[str, str, str, str, int]] = []
    for document in documents:
        for index, chunk in enumerate(chunk_text(document.text)):
            items.append((document.id, document.title, document.source, chunk, index))

    if not items:
        store = VectorStore(embeddings.dimension())
        store.save(INDEX_FILE, METADATA_FILE)
        return store

    vectors = embeddings.embed_texts([item[3] for item in items])
    store = VectorStore(vectors.shape[1])
    store.add(
        [f"{doc_id}:{chunk_index}" for doc_id, _, _, _, chunk_index in items],
        vectors,
        [
            {"doc_id": doc_id, "title": title, "source": source, "chunk": chunk, "chunk_index": chunk_index}
            for doc_id, title, source, chunk, chunk_index in items
        ],
    )
    store.save(INDEX_FILE, METADATA_FILE)
    return store


_store: VectorStore | None = None


def reindex() -> VectorStore:
    global _store
    _store = _build_store()
    return _store


def _current_store() -> VectorStore | None:
    global _store
    if _store is None:
        _store = _load_store()
    return _store


def search(query: str, top_k: int | None = None) -> list[KnowledgeHit]:
    top_k = max(1, min(top_k or settings.DEFAULT_TOP_K, settings.MAX_TOP_K))
    store = _current_store()
    if store is None or store.size == 0:
        return []
    vector = embeddings.embed_query(query)
    hits: list[KnowledgeHit] = []
    for _, score, meta in store.search(vector, top_k):
        if score < settings.MIN_SIMILARITY:
            continue
        hits.append(
            KnowledgeHit(
                doc_id=meta.get("doc_id", ""),
                title=meta.get("title", ""),
                source=meta.get("source", ""),
                chunk=meta.get("chunk", ""),
                chunk_index=int(meta.get("chunk_index", 0)),
                score=score,
            )
        )
    return hits


def stats() -> dict[str, Any]:
    store = _current_store()
    return {
        "documents": len(list_documents()),
        "chunks": store.size if store else 0,
        "embeddingModel": settings.EMBEDDING_MODEL,
        "embeddingsInstalled": embeddings.is_installed(),
        "embeddingsLoaded": embeddings.is_loaded(),
        "indexed": bool(store and store.size > 0),
    }

# [PoornaviSina-revision-tag-3]: feat(retrieval): add embedding model dimension validation check

# [PoornaviSina-revision-tag-9]: feat(retrieval): add metadata filter helper for temporal vector queries

# [PoornaviSina-revision-tag-15]: docs(retrieval): clarify RRF rank constant k parameters in docstrings

# [PoornaviSina-revision-tag-21]: refactor(retrieval): optimize vector store query result parsing efficiency
