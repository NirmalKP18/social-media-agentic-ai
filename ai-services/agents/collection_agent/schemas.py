"""Collection-layer data contracts."""

from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass(slots=True)
class Post:
    id: str
    platform: str
    author: str
    content: str
    published_at: str | None = None
    engagement: dict[str, int] = field(default_factory=dict)
    comments: list[dict[str, Any]] = field(default_factory=list)

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


# [NirmalKP18-revision-tag-9]: refactor(backend): optimize telemetry middleware payload extraction
