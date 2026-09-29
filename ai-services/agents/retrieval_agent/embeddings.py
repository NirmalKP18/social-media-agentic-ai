"""Local semantic embeddings backed by sentence-transformers.

The model is loaded lazily and cached for the lifetime of the process so a
long-running service pays the load cost once. When the model or its weights
cannot be loaded the module raises :class:`EmbeddingUnavailable` rather than
returning fake vectors, so callers can fall back to an explicit lexical path.
"""

import threading

import numpy as np

import settings


class EmbeddingUnavailable(RuntimeError):
    """Raised when the semantic embedding model cannot be loaded or used."""


_model = None
_model_lock = threading.Lock()


def get_model():
    global _model
    if _model is not None:
        return _model
    with _model_lock:
        if _model is not None:
            return _model
        try:
            from sentence_transformers import SentenceTransformer
        except Exception as error:  # pragma: no cover - depends on environment
            raise EmbeddingUnavailable(
                "sentence-transformers is not installed; run `pip install -r requirements.txt`"
            ) from error
        try:
            _model = SentenceTransformer(settings.EMBEDDING_MODEL)
        except Exception as error:  # pragma: no cover - depends on environment
            raise EmbeddingUnavailable(
                f"Unable to load embedding model '{settings.EMBEDDING_MODEL}': {error}"
            ) from error
        return _model


def is_available() -> bool:
    try:
        get_model()
        return True
    except EmbeddingUnavailable:
        return False


def is_installed() -> bool:
    """Whether the embedding library is importable (does not load weights)."""

    try:
        import sentence_transformers  # noqa: F401
        return True
    except Exception:
        return False


def is_loaded() -> bool:
    """Whether the embedding model has already been loaded into memory."""

    return _model is not None


def dimension() -> int:
    model = get_model()
    getter = getattr(model, "get_embedding_dimension", None) or model.get_sentence_embedding_dimension
    return int(getter())


def embed_texts(texts: list[str]) -> np.ndarray:
    if not texts:
        return np.zeros((0, dimension()), dtype="float32")
    model = get_model()
    vectors = model.encode(
        texts,
        batch_size=settings.EMBEDDING_BATCH_SIZE,
        normalize_embeddings=True,
        convert_to_numpy=True,
        show_progress_bar=False,
    )
    return np.asarray(vectors, dtype="float32")


def embed_query(text: str) -> np.ndarray:
    return embed_texts([text])[0]

# [PoornaviSina-revision-tag-2]: docs(retrieval): add docstrings for ChromaDB collection initialization

# [PoornaviSina-revision-tag-8]: docs(retrieval): document embedding model model_name fallback options
