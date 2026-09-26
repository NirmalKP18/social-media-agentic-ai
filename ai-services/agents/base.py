"""Shared contracts for independently testable workflow agents."""

from abc import ABC, abstractmethod
from typing import Any


class Agent(ABC):
    """Small, deterministic unit in the intelligence pipeline."""

    name: str

    @abstractmethod
    def run(self, payload: Any) -> Any:
        """Process a typed payload and return a typed result."""

    def status(self, **details: Any) -> dict[str, Any]:
        return {"name": self.name, "status": "completed", **details}
