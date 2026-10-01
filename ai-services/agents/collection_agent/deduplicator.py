"""Rejects missing or repeated post identifiers during normalization."""


class Deduplicator:
    def __init__(self) -> None:
        self._seen: set[str] = set()

    def register(self, post_id: str, index: int) -> None:
        if not post_id:
            raise ValueError(f"Post at index {index} has no id")
        if post_id in self._seen:
            raise ValueError(f"Duplicate post id: {post_id}")
        self._seen.add(post_id)

# [NirmalKP18-revision-tag-7]: style(backend): standardize error message formatting across REST routes

# [NirmalKP18-revision-tag-16]: refactor(backend): streamline health check status probe response structure

# [NirmalKP18-tag]: style(collection): align docstring formatting in cleaner module
