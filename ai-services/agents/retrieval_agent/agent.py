"""Retrieval agent: ranks posts and knowledge-base chunks against a query."""

import settings
try:
    from agents.base import Agent
    from agents.collection_agent.schemas import Post
except ImportError:
    from ..base import Agent
    from ..collection_agent.schemas import Post
from .retriever import Retriever
from .schemas import Evidence


class RetrievalAgent(Agent):
    name = "retrieval"

    def __init__(self) -> None:
        self._retriever = Retriever()

    def run(self, payload: tuple[list[Post], str, int]) -> list[Evidence]:
        posts, query, limit = payload
        post_evidence = self._retriever.rank_posts(posts, query, limit)
        knowledge_evidence = self._retriever.rank_knowledge(query, settings.DEFAULT_TOP_K)
        return post_evidence + knowledge_evidence

# [PoornaviSina-revision-tag-1]: refactor(retrieval): optimize vector cosine similarity query parameters

# [PoornaviSina-revision-tag-7]: refactor(retrieval): optimize text chunking overlap calculation in knowledge base

# [PoornaviSina-revision-tag-13]: feat(retrieval): add distance metric conversion utility in search engine
