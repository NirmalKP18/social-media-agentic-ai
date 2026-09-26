"""Public entry point that runs the four-agent workflow end to end."""

from typing import Any

from shared.contracts import utc_now

from .coordinator import AgentCoordinator
from .job_store import JobStore
from .workflow_state import WorkflowState


class Pipeline:
    def __init__(self, job_store: JobStore | None = None) -> None:
        self.coordinator = AgentCoordinator()
        self.jobs = job_store or JobStore()

    def run(
        self,
        posts: list[dict[str, Any]],
        query: str,
        limit: int = 10,
        job_id: str | None = None,
    ) -> dict[str, Any]:
        if not query or not query.strip():
            raise ValueError("query is required")

        job = self.jobs.get(job_id) if job_id else None
        if job is None:
            job = self.jobs.create(query)

        try:
            self.jobs.update(job.id, "collecting")
            normalized = self.coordinator.collection.run(posts)
            if not normalized:
                raise ValueError("at least one post is required")

            self.jobs.update(job.id, "analyzing")
            analyses = self.coordinator.analysis.run(normalized)

            self.jobs.update(job.id, "retrieving")
            evidence = self.coordinator.retrieval.run((normalized, query.strip(), limit))

            self.jobs.update(job.id, "generating")
            insight = self.coordinator.generation.run((normalized, analyses, evidence, query.strip()))
        except Exception as error:
            self.jobs.fail(job.id, str(error))
            raise

        state = WorkflowState()
        state.record("collection", self.coordinator.collection.status(normalizedPosts=len(normalized)))
        state.record("nlp", self.coordinator.analysis.status(analyses=len(analyses)))
        state.record("retrieval", self.coordinator.retrieval.status(evidence=len(evidence)))
        state.record("insight", self.coordinator.generation.status(reviewStatus="pending"))

        completed = self.jobs.complete(
            job.id,
            {
                "posts": len(normalized),
                "analyses": len(analyses),
                "evidence": len(evidence),
                "knowledgeSources": len(insight.get("knowledgeSources", [])),
                "insufficientEvidence": insight.get("insufficientEvidence", False),
            },
        )

        return {
            "runAt": utc_now(),
            "job": completed.as_dict() if completed else job.as_dict(),
            "agents": state.agents,
            "posts": [post.as_dict() for post in normalized],
            "analyses": [analysis.as_dict() for analysis in analyses],
            "evidence": [item.as_dict() for item in evidence],
            "insight": insight,
        }
