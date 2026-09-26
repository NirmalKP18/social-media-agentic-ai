"""Time helpers shared by the orchestrator and agents."""

from datetime import datetime, timezone


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()
