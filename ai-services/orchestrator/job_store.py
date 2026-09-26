"""Persistent job-state tracking for the four-agent workflow.

Statuses follow the required lifecycle:
pending -> collecting -> analyzing -> retrieving -> generating -> completed
with ``failed`` recorded on any error.
"""

import json
import threading
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone

import settings

STATUSES = ("pending", "collecting", "analyzing", "retrieving", "generating", "completed", "failed")
MAX_JOBS = 100


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass(slots=True)
class Job:
    id: str
    query: str
    status: str = "pending"
    stage: str = "pending"
    created_at: str = field(default_factory=_now)
    updated_at: str = field(default_factory=_now)
    finished_at: str | None = None
    duration_ms: int | None = None
    error: str | None = None
    summary: dict | None = None
    transitions: list[dict] = field(default_factory=list)

    def as_dict(self) -> dict:
        return asdict(self)


class JobStore:
    def __init__(self, path=None):
        self._path = path or (settings.STATE_DIR / "jobs.json")
        self._lock = threading.Lock()
        self._jobs: dict[str, Job] = {}
        self._load()

    def _load(self) -> None:
        settings.ensure_directories()
        if not self._path.exists():
            return
        try:
            payload = json.loads(self._path.read_text(encoding="utf-8"))
            for item in payload.get("jobs", []):
                job = Job(**item)
                self._jobs[job.id] = job
        except (OSError, TypeError, ValueError, json.JSONDecodeError):
            self._jobs = {}

    def _persist(self) -> None:
        ordered = sorted(self._jobs.values(), key=lambda job: job.created_at, reverse=True)[:MAX_JOBS]
        self._jobs = {job.id: job for job in ordered}
        self._path.write_text(
            json.dumps({"jobs": [job.as_dict() for job in ordered]}, ensure_ascii=False),
            encoding="utf-8",
        )

    def create(self, query: str) -> Job:
        with self._lock:
            job = Job(id=uuid.uuid4().hex, query=query)
            job.transitions.append({"status": "pending", "at": job.created_at})
            self._jobs[job.id] = job
            self._persist()
            return job

    def update(self, job_id: str, status: str) -> Job | None:
        if status not in STATUSES:
            raise ValueError(f"Unknown job status: {status}")
        with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                return None
            job.status = status
            job.stage = status
            job.updated_at = _now()
            job.transitions.append({"status": status, "at": job.updated_at})
            self._persist()
            return job

    def complete(self, job_id: str, summary: dict) -> Job | None:
        with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                return None
            job.status = "completed"
            job.stage = "completed"
            job.summary = summary
            job.finished_at = _now()
            job.updated_at = job.finished_at
            job.transitions.append({"status": "completed", "at": job.finished_at})
            self._persist()
            return job

    def fail(self, job_id: str, error: str) -> Job | None:
        with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                return None
            job.status = "failed"
            job.stage = "failed"
            job.error = error
            job.finished_at = _now()
            job.updated_at = job.finished_at
            job.transitions.append({"status": "failed", "at": job.finished_at, "error": error})
            self._persist()
            return job

    def get(self, job_id: str) -> Job | None:
        return self._jobs.get(job_id)

    def list(self, limit: int = 20) -> list[Job]:
        jobs = sorted(self._jobs.values(), key=lambda job: job.created_at, reverse=True)
        return jobs[: max(1, limit)]
