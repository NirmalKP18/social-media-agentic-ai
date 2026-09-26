"""Specialized agents used by the social-media intelligence workflow."""

try:
    from .collection_agent import CollectionAgent
except ImportError:
    CollectionAgent = None

try:
    from .analysis_agent import AnalysisAgent
except ImportError:
    AnalysisAgent = None

try:
    from .retrieval_agent import RetrievalAgent
except ImportError:
    RetrievalAgent = None

try:
    from .generation_agent import GenerationAgent
except ImportError:
    GenerationAgent = None

__all__ = ["CollectionAgent", "AnalysisAgent", "RetrievalAgent", "GenerationAgent"]
