"""Collection agent: validates and normalizes permitted/public post input."""

from collections.abc import Iterable, Mapping
from typing import Any

try:
    from agents.base import Agent
except ImportError:
    from ..base import Agent
from .cleaner import (
    TEXT_LIMIT,
    clean_text,
    normalize_author,
    normalize_engagement,
    normalize_platform,
    normalize_published_at,
)
from .deduplicator import Deduplicator
from .schemas import Post


class CollectionAgent(Agent):
    name = "collection"

    def run(self, payload: Iterable[Mapping[str, Any]]) -> list[Post]:
        posts: list[Post] = []
        deduplicator = Deduplicator()
        for index, raw in enumerate(payload):
            post_id = clean_text(raw.get("id") or raw.get("_id"))
            content = clean_text(raw.get("content"))
            deduplicator.register(post_id, index)
            if not content:
                raise ValueError(f"Post {post_id} has no content")
            posts.append(
                Post(
                    post_id,
                    normalize_platform(raw.get("platform")),
                    normalize_author(raw.get("author")),
                    content[:TEXT_LIMIT],
                    normalize_published_at(raw.get("publishedAt") or raw.get("published_at")),
                    normalize_engagement(raw.get("engagement")),
                )
            )
        return posts
