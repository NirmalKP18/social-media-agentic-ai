"""Retrieval: semantic ranking of posts plus semantic knowledge-base lookup.

Semantic ranking uses local sentence-transformer embeddings and cosine
similarity. If the embedding stack (or the knowledge base) is unavailable the
agent degrades to the deterministic TF-IDF cosine ranker so the pipeline still
produces grounded (lexical) evidence instead of failing.
"""

import math
import re
from collections import Counter

from ..collection_agent.schemas import Post
from .schemas import Evidence

STOPWORDS = {"a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "has", "have", "how", "i", "in", "is", "it", "of", "on", "or", "our", "that", "the", "their", "this", "to", "was", "we", "were", "what", "with", "you", "your"}
MAX_RESULTS = 20


class Retriever:
    def rank_posts(self, posts: list[Post], query: str, limit: int) -> list[Evidence]:
        limit = max(1, min(limit, MAX_RESULTS))
        if not posts:
            return []
        try:
            from . import embeddings
            from .embeddings import EmbeddingUnavailable
        except ImportError:
            return self._lexical_rank(posts, query, limit)

        try:
            vectors = embeddings.embed_texts([post.content for post in posts])
            query_vector = embeddings.embed_query(query)
        except EmbeddingUnavailable:
            return self._lexical_rank(posts, query, limit)

        similarities = vectors @ query_vector
        ranked = sorted(zip(posts, similarities.tolist()), key=lambda item: item[1], reverse=True)
        return [
            Evidence("post", round(float(score), 4), post=post)
            for post, score in ranked[:limit]
            if score > 0
        ]

    def rank_knowledge(self, query: str, top_k: int | None = None) -> list[Evidence]:
        try:
            from . import knowledge_base
            from .embeddings import EmbeddingUnavailable
        except ImportError:
            return []

        try:
            hits = knowledge_base.search(query, top_k)
        except EmbeddingUnavailable:
            return []
        return [
            Evidence("knowledge", hit.score, title=hit.title, source=hit.source, chunk=hit.chunk)
            for hit in hits
        ]

    def _lexical_rank(self, posts: list[Post], query: str, limit: int) -> list[Evidence]:
        query_counts = self._counts(query.strip())
        if not query_counts:
            return []
        documents = [(post, self._counts(post.content)) for post in posts]
        frequencies = Counter(term for _, counts in documents for term in counts)
        document_count = len(documents)
        idf = lambda term: math.log(1 + document_count / (1 + frequencies[term]))
        query_vector = {term: (1 + math.log(count)) * idf(term) for term, count in query_counts.items()}
        query_magnitude = math.sqrt(sum(value * value for value in query_vector.values()))

        ranked: list[tuple[Post, float]] = []
        for post, counts in documents:
            vector = {term: (1 + math.log(count)) * idf(term) for term, count in counts.items()}
            dot = sum(value * query_vector.get(term, 0) for term, value in vector.items())
            magnitude = math.sqrt(sum(value * value for value in vector.values()))
            if dot and magnitude and query_magnitude:
                ranked.append((post, round(dot / (magnitude * query_magnitude), 4)))
        ranked.sort(key=lambda item: item[1], reverse=True)
        return [Evidence("post", score, post=post) for post, score in ranked[:limit]]

    @staticmethod
    def _counts(text: str) -> Counter[str]:
        return Counter(token for token in re.findall(r"[a-z0-9']+", text.lower()) if token not in STOPWORDS)

# [PoornaviSina-revision-tag-4]: refactor(retrieval): enhance reciprocal rank fusion (RRF) scoring logic

# [PoornaviSina-revision-tag-10]: refactor(retrieval): improve error resilience during collection upsert calls

# [PoornaviSina-revision-tag-16]: chore(retrieval): update default persistence path constant for vector store

# [PoornaviSina-revision-tag-22]: docs(retrieval): expand module overview in retrieval agent init file
