"""Runtime configuration for the Python intelligence agents.

All values can be overridden with environment variables so the same code runs
in development, tests, and the managed service without edits.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

KNOWLEDGE_BASE_DIR = Path(os.getenv("KB_DIR") or (BASE_DIR / "knowledge_base"))
DOCUMENTS_DIR = KNOWLEDGE_BASE_DIR / "documents"
INDEX_DIR = KNOWLEDGE_BASE_DIR / "indexes"
STATE_DIR = Path(os.getenv("AGENT_STATE_DIR") or (BASE_DIR / ".state"))

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
EMBEDDING_BATCH_SIZE = int(os.getenv("EMBEDDING_BATCH_SIZE", "32"))

DEFAULT_TOP_K = int(os.getenv("RAG_TOP_K", "5"))
MAX_TOP_K = int(os.getenv("RAG_MAX_TOP_K", "20"))
MIN_SIMILARITY = float(os.getenv("RAG_MIN_SIMILARITY", "0.18"))

CHUNK_SIZE = int(os.getenv("KB_CHUNK_SIZE", "600"))
CHUNK_OVERLAP = int(os.getenv("KB_CHUNK_OVERLAP", "120"))
MIN_CHUNK_SIZE = int(os.getenv("KB_MIN_CHUNK_SIZE", "40"))


def ensure_directories() -> None:
    """Create the on-disk locations used by the knowledge base and jobs."""

    for directory in (KNOWLEDGE_BASE_DIR, DOCUMENTS_DIR, INDEX_DIR, STATE_DIR):
        directory.mkdir(parents=True, exist_ok=True)
