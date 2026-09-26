"""Coordinates the four independently testable agents."""

from agents import AnalysisAgent, CollectionAgent, GenerationAgent, RetrievalAgent


class AgentCoordinator:
    def __init__(self) -> None:
        self.collection = CollectionAgent()
        self.analysis = AnalysisAgent()
        self.retrieval = RetrievalAgent()
        self.generation = GenerationAgent()
