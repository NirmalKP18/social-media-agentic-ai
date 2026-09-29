"""Persistent FAISS vector store with string-id metadata."""

import json
from pathlib import Path
from typing import Any

import faiss
import numpy as np


class VectorStore:
    """Cosine-similarity index (inner product on normalized vectors)."""

    def __init__(self, dimension: int):
        self.dimension = int(dimension)
        self._index = faiss.IndexIDMap2(faiss.IndexFlatIP(self.dimension))
        self._ids: dict[int, str] = {}
        self._metadata: dict[str, dict[str, Any]] = {}
        self._next_id = 0

    @property
    def size(self) -> int:
        return len(self._ids)

    def _allocate(self) -> int:
        value = self._next_id
        self._next_id += 1
        return value

    def add(self, item_ids: list[str], vectors: np.ndarray, metadata: list[dict[str, Any]]) -> int:
        if len(item_ids) != len(metadata):
            raise ValueError("item_ids and metadata must be the same length")
        if len(item_ids) == 0:
            return 0

        vectors = np.asarray(vectors, dtype="float32")
        if vectors.ndim != 2 or vectors.shape[1] != self.dimension:
            raise ValueError(f"vectors must have shape (n, {self.dimension})")

        self.remove(item_ids)

        integer_ids = np.array([self._allocate() for _ in item_ids], dtype="int64")
        for integer_id, item_id, meta in zip(integer_ids.tolist(), item_ids, metadata):
            self._ids[integer_id] = item_id
            self._metadata[item_id] = meta
        self._index.add_with_ids(vectors, integer_ids)
        return len(item_ids)

    def remove(self, item_ids: list[str]) -> int:
        integer_ids = [i for i, value in self._ids.items() if value in set(item_ids)]
        if not integer_ids:
            return 0
        self._index.remove_ids(np.array(integer_ids, dtype="int64"))
        for integer_id in integer_ids:
            item_id = self._ids.pop(integer_id)
            self._metadata.pop(item_id, None)
        return len(integer_ids)

    def search(self, vector: np.ndarray, k: int) -> list[tuple[str, float, dict[str, Any]]]:
        if self.size == 0:
            return []
        query = np.asarray(vector, dtype="float32").reshape(1, -1)
        distances, indices = self._index.search(query, min(k, self.size))
        results: list[tuple[str, float, dict[str, Any]]] = []
        for score, integer_id in zip(distances[0].tolist(), indices[0].tolist()):
            item_id = self._ids.get(integer_id)
            if item_id is None:
                continue
            results.append((item_id, round(float(score), 4), self._metadata.get(item_id, {})))
        return results

    def save(self, index_path: Path, metadata_path: Path) -> None:
        index_path.parent.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self._index, str(index_path))
        metadata_path.write_text(
            json.dumps(
                {
                    "dimension": self.dimension,
                    "next_id": self._next_id,
                    "ids": {str(key): value for key, value in self._ids.items()},
                    "metadata": self._metadata,
                },
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )

    @classmethod
    def load(cls, index_path: Path, metadata_path: Path) -> "VectorStore":
        payload = json.loads(metadata_path.read_text(encoding="utf-8"))
        store = cls(payload["dimension"])
        store._index = faiss.read_index(str(index_path))
        store._next_id = payload.get("next_id", 0)
        store._ids = {int(key): value for key, value in payload.get("ids", {}).items()}
        store._metadata = payload.get("metadata", {})
        return store

# [PoornaviSina-revision-tag-6]: chore(retrieval): add debug logging for vector store search latency
