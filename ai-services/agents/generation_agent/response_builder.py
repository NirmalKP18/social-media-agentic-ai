"""Assembles the grounded insight report returned to the orchestrator."""

from collections import Counter
from typing import Any

from ..analysis_agent.schemas import Analysis
from ..collection_agent.schemas import Post
from ..retrieval_agent.schemas import Evidence
from .generator import build_draft, build_recommendations
from .schemas import GenerationMetadata, ReviewState

ENGAGEMENT_KEYS = ("likes", "shares", "comments")
SENTIMENT_LABELS = ("positive", "negative", "neutral")
PRIORITY_LEVELS = ("low", "medium", "high", "urgent")


def build_response(
    posts: list[Post],
    analyses: list[Analysis],
    evidence: list[Evidence],
    query: str,
) -> dict[str, Any]:
    sentiment_distribution = Counter(item.sentiment.label for item in analyses)
    priority_distribution = Counter(item.priority.level for item in analyses)
    emotion_distribution = Counter(item.emotion.label for item in analyses)
    intent_distribution = Counter(item.intent for item in analyses)

    average = round(sum(item.sentiment.score for item in analyses) / len(analyses), 3) if analyses else 0
    topics = Counter(topic for item in analyses for topic in item.topics)
    entities = Counter(entity for item in analyses for entity in item.entities)
    dominant = max(SENTIMENT_LABELS, key=lambda label: sentiment_distribution[label]) if analyses else "neutral"

    post_evidence = [item for item in evidence if item.kind == "post" and item.post is not None]
    knowledge_evidence = [item for item in evidence if item.kind == "knowledge"]
    knowledge_chunks = [item.chunk for item in knowledge_evidence if item.chunk]

    total_engagement = {key: sum(post.engagement.get(key, 0) for post in posts) for key in ENGAGEMENT_KEYS}
    top_topic = topics.most_common(1)[0][0] if topics else None

    review: ReviewState = {"status": "pending"}
    generation: GenerationMetadata = {
        "provider": "local-python-agent",
        "model": "grounded-rag-template-v2",
        "warning": "Draft requires human review.",
        "groundedOnKnowledge": bool(knowledge_chunks),
        "evidenceCount": len(evidence),
    }

    all_comments = [c for item in analyses for c in getattr(item, "comment_analyses", []) or []]
    comment_intent_distribution = Counter(c.get("intent", "other") for c in all_comments)
    comment_sentiment_distribution = Counter(
        c.get("sentiment", {}).get("label", "neutral") if isinstance(c.get("sentiment"), dict) else "neutral"
        for c in all_comments
    )
    comment_discourse = {
        "totalCommentsRead": len(all_comments),
        "intentCounts": dict(comment_intent_distribution),
        "sentimentCounts": dict(comment_sentiment_distribution),
        "comments": all_comments[:30],
        "questions": [c for c in all_comments if c.get("intent") == "question" or "?" in str(c.get("content", ""))][:10],
        "complaints": [c for c in all_comments if c.get("intent") == "complaint"][:10],
    }

    return {
        "summary": f"Analyzed {len(analyses)} posts for '{query}'. Overall sentiment is {dominant}.",
        "statistics": {
            "totalPosts": len(posts),
            "analyzedPosts": len(analyses),
            "sentimentDistribution": dict(sentiment_distribution),
            "priorityDistribution": {level: priority_distribution.get(level, 0) for level in PRIORITY_LEVELS},
            "emotionDistribution": dict(emotion_distribution),
            "intentDistribution": dict(intent_distribution),
            "averageSentimentScore": average,
            "totalEngagement": total_engagement,
            "commentDiscourse": comment_discourse,
        },
        "commentDiscourse": comment_discourse,
        "topTopics": [{"topic": key, "count": count} for key, count in topics.most_common(5)],
        "topEntities": [{"entity": key, "count": count} for key, count in entities.most_common(5)],
        "evidencePostIds": [item.post.id for item in post_evidence],
        "knowledgeSources": [
            {
                "title": item.title,
                "source": item.source,
                "chunk": item.chunk,
                "score": item.score,
            }
            for item in knowledge_evidence
        ],
        "insufficientEvidence": not knowledge_chunks,
        "recommendations": build_recommendations(
            dominant,
            average,
            top_topic,
            len(knowledge_chunks),
            priority_distribution.get("urgent", 0),
        ),
        "draftResponse": build_draft(top_topic, knowledge_chunks),
        "review": review,
        "generation": generation,
    }

