"""Field-level normalization for raw collection input."""

from datetime import datetime
from typing import Any

from .filters import ALLOWED_PLATFORMS

TEXT_LIMIT = 2000
AUTHOR_LIMIT = 100
ENGAGEMENT_KEYS = ("likes", "shares", "comments")


def clean_text(value: Any) -> str:
    return str(value or "").strip()


def normalize_platform(value: Any) -> str:
    platform = str(value or "other").strip().lower()
    return platform if platform in ALLOWED_PLATFORMS else "other"


def normalize_author(value: Any) -> str:
    return str(value or "unknown").strip()[:AUTHOR_LIMIT]


def normalize_published_at(value: Any) -> Any:
    if value:
        datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    return value


def normalize_engagement(value: Any) -> dict[str, int]:
    engagement = value or {}
    return {key: max(0, int(engagement.get(key, 0))) for key in ENGAGEMENT_KEYS}
