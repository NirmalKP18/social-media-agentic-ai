"""Analysis-layer data contracts."""

from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass(slots=True)
class Sentiment:
    label: str
    score: float
    confidence: float
    subjectivity: float = 0.0


@dataclass(slots=True)
class Emotion:
    label: str
    scores: dict[str, float] = field(default_factory=dict)
    intensity: float = 0.0
    secondary: str = ""


@dataclass(slots=True)
class NamedEntity:
    text: str
    type: str
    confidence: float = 1.0


@dataclass(slots=True)
class IntentResult:
    """Multi-label intent classification result."""
    primary: str
    labels: list[str] = field(default_factory=list)
    confidences: dict[str, float] = field(default_factory=dict)


@dataclass(slots=True)
class Priority:
    level: str
    score: int
    factors: list[str] = field(default_factory=list)


@dataclass(slots=True)
class Analysis:
    post_id: str
    sentiment: Sentiment
    topics: list[str]
    entities: list[str]
    summary: str
    intent: str = "other"
    intent_detail: IntentResult | None = None
    emotion: Emotion = field(default_factory=lambda: Emotion("neutral"))
    priority: Priority = field(default_factory=lambda: Priority("low", 0))
    named_entities: list[NamedEntity] = field(default_factory=list)
    comment_analyses: list[dict[str, Any]] = field(default_factory=list)
    conversation: dict[str, Any] = field(default_factory=dict)
    language_quality: dict[str, Any] = field(default_factory=dict)

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)

# [theuni03-revision-tag-7]: refactor(analysis): optimize priority score calculation weight parameters
