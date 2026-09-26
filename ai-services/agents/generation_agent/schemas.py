"""Generation-layer data contracts."""

from typing import Literal, TypedDict


class ReviewState(TypedDict):
    status: Literal["pending", "approved", "rejected"]


class GenerationMetadata(TypedDict):
    provider: str
    model: str
    warning: str
    groundedOnKnowledge: bool
    evidenceCount: int
