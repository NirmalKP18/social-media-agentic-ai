"""Builds the grounded draft response and reviewer recommendations."""

from .prompts import GROUNDED_TEMPLATE, INSUFFICIENT_TEMPLATE


def _condense(guidance: str, limit: int = 320) -> str:
    text = guidance.strip()
    if len(text) <= limit:
        return text
    return text[: limit - 1].rsplit(" ", 1)[0] + "…"


def build_draft(topic: str | None, knowledge_chunks: list[str]) -> str:
    topic = topic or "this topic"
    if not knowledge_chunks:
        return INSUFFICIENT_TEMPLATE.format(topic=topic)
    return GROUNDED_TEMPLATE.format(topic=topic, guidance=_condense(knowledge_chunks[0]))


def build_recommendations(
    dominant: str,
    average: float,
    top_topic: str | None,
    knowledge_count: int,
    urgent_priority_count: int,
) -> list[str]:
    recommendations = [f"Overall sentiment is {dominant} with an average score of {average:.2f}."]
    if top_topic:
        recommendations.append(f'Review the leading theme "{top_topic}" in the cited evidence.')
    if knowledge_count:
        recommendations.append(f"The draft is grounded in {knowledge_count} retrieved knowledge-base source(s).")
    else:
        recommendations.append("No knowledge-base match was found; add or approve reference guidance before sending a reply.")
    if urgent_priority_count:
        recommendations.append(f"Escalate {urgent_priority_count} urgent-priority mention(s) to a human reviewer first.")
    recommendations.append("Require a human reviewer to approve or edit the response before publication.")
    return recommendations
