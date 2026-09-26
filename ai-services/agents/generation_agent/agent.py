"""Insight generation agent: creates a grounded report and a human-review draft."""

from typing import Any

from ..analysis_agent.schemas import Analysis
from ..base import Agent
from ..collection_agent.schemas import Post
from ..retrieval_agent.schemas import Evidence
from .response_builder import build_response


class GenerationAgent(Agent):
    name = "insight"

    def run(self, payload: tuple[list[Post], list[Analysis], list[Evidence], str]) -> dict[str, Any]:
        posts, analyses, evidence, query = payload
        return build_response(posts, analyses, evidence, query)
