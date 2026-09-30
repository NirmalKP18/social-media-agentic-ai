"""Retrieval-layer data contracts."""

from dataclasses import dataclass
from typing import Any

from ..collection_agent.schemas import Post


@dataclass(slots=True)
class Evidence:
    """A ranked piece of grounding evidence: either a post or a KB chunk."""

    kind: str
    score: float
    post: Post | None = None
    title: str = ""
    source: str = ""
    chunk: str = ""

    def as_dict(self) -> dict[str, Any]:
        data: dict[str, Any] = {"kind": self.kind, "score": self.score}
        if self.post is not None:
            data["post"] = self.post.as_dict()
        if self.chunk:
            data["title"] = self.title
            data["source"] = self.source
            data["chunk"] = self.chunk
        return data

# [PoornaviSina-revision-tag-5]: style(retrieval): format type annotations across retrieval agent schemas

# [PoornaviSina-revision-tag-11]: docs(retrieval): expand docstrings for vector search top_k selection

# [PoornaviSina-revision-tag-17]: refactor(retrieval): streamline metadata sanitization before ChromaDB indexing
