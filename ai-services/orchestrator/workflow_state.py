"""Mutable accumulator for per-stage agent status."""

from typing import Any


class WorkflowState:
    def __init__(self) -> None:
        self._stages: dict[str, dict[str, Any]] = {}

    def record(self, stage: str, status: dict[str, Any]) -> None:
        self._stages[stage] = status

    @property
    def agents(self) -> dict[str, dict[str, Any]]:
        return dict(self._stages)
