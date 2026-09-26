"""Advanced priority scoring with virality detection, influencer heuristics,
temporal decay, competitor escalation, and fine-grained 0–100 scoring.

The scorer integrates signals from sentiment, emotion, engagement metrics,
urgency keywords, competitor mentions, and content recency to produce a
calibrated priority score and human-readable factor explanations.
"""

import math
from datetime import datetime, timezone

from ..collection_agent.schemas import Post
from .schemas import Emotion, Priority, Sentiment

# ---------------------------------------------------------------------------
# Keyword sets
# ---------------------------------------------------------------------------

URGENCY_TERMS = {
    "urgent", "asap", "immediately", "refund", "legal", "lawsuit", "sue",
    "cancel", "escalate", "outage", "downtime", "breach", "hacked", "fraud",
    "data loss", "chargeback", "unacceptable", "emergency", "critical",
    "security breach", "data breach", "unauthorized", "compromised",
    "class action", "regulatory", "compliance", "violation", "expose",
    "whistleblow", "deadline", "time-sensitive", "p0", "p1", "sev1", "sev0",
}

COMPETITOR_TERMS = {
    "competitor", "vs", "versus", "alternative", "switch", "switched",
    "switched to", "moved to", "migrating", "better than", "worse than",
    "compared to", "comparing", "rivalry", "losing to", "beating",
}

NEGATIVE_EMOTIONS = {"anger", "disgust", "fear", "sadness"}
VIRAL_EMOTIONS = {"anger", "disgust", "surprise"}


def _engagement_total(post: Post) -> int:
    """Sum all engagement metrics."""
    return sum(int(v) for v in post.engagement.values())


def _engagement_velocity(post: Post) -> float:
    """Approximate engagement velocity: high engagement on recent content."""
    total = _engagement_total(post)
    if total == 0:
        return 0.0
    shares = int(post.engagement.get("shares", 0))
    comments = int(post.engagement.get("comments", 0))
    # Share-to-like ratio and comment density signal virality
    likes = max(int(post.engagement.get("likes", 0)), 1)
    share_ratio = shares / likes
    comment_ratio = comments / likes
    return round(share_ratio + comment_ratio * 0.5, 3)


def _recency_boost(post: Post) -> float:
    """Posts from the last 24h get a boost; older posts get exponential decay."""
    if not post.published_at:
        return 0.5  # unknown age → moderate
    try:
        ts = post.published_at
        published = datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        hours_old = max(0, (now - published).total_seconds() / 3600)
    except (ValueError, TypeError):
        return 0.5

    if hours_old <= 1:
        return 1.0
    elif hours_old <= 6:
        return 0.85
    elif hours_old <= 24:
        return 0.7
    elif hours_old <= 72:
        return 0.5
    else:
        return max(0.1, round(math.exp(-hours_old / 168), 2))  # ~1-week half-life


def compute_priority(post: Post, sentiment: Sentiment, emotion: Emotion) -> Priority:
    """Compute a 0–100 priority score with detailed factor explanations."""

    score = 0
    factors: list[str] = []

    # ------ 1. Sentiment scoring (0–40 points) ------
    if sentiment.score <= -0.7:
        score += 40
        factors.append(f"very strong negative sentiment ({sentiment.score})")
    elif sentiment.score <= -0.4:
        score += 30
        factors.append(f"strong negative sentiment ({sentiment.score})")
    elif sentiment.score < -0.1:
        pts = max(10, int(abs(sentiment.score) * 35))
        score += pts
        factors.append(f"negative sentiment ({sentiment.score})")
    elif sentiment.score >= 0.6:
        score += 5
        factors.append("strong positive sentiment (opportunity for amplification)")

    # Confidence multiplier: high-confidence negative is worse
    if sentiment.score < 0 and sentiment.confidence >= 0.8:
        bonus = 5
        score += bonus
        factors.append(f"high-confidence negative ({sentiment.confidence})")

    # ------ 2. Emotion scoring (0–20 points) ------
    if emotion.label in NEGATIVE_EMOTIONS:
        intensity_pts = int(emotion.intensity * 15) if emotion.intensity else 10
        score += intensity_pts
        factors.append(f"{emotion.label} emotion (intensity {emotion.intensity})")

        if emotion.secondary and emotion.secondary in NEGATIVE_EMOTIONS:
            score += 5
            factors.append(f"secondary {emotion.secondary} emotion compounds negativity")

    if emotion.label in VIRAL_EMOTIONS and emotion.intensity >= 0.5:
        score += 5
        factors.append(f"viral-prone {emotion.label} emotion detected")

    # ------ 3. Urgency keywords (0–25 points) ------
    text = post.content.lower()
    urgency = sorted(term for term in URGENCY_TERMS if term in text)
    if urgency:
        pts = min(25, 8 * len(urgency))
        score += pts
        factors.append(f"urgency signals: {', '.join(urgency[:5])}")

    # ------ 4. Competitor mentions (0–10 points) ------
    competitors = sorted(term for term in COMPETITOR_TERMS if term in text)
    if competitors:
        pts = min(10, 5 * len(competitors))
        score += pts
        factors.append(f"competitor references: {', '.join(competitors[:3])}")

    # ------ 5. Engagement scoring (0–25 points) ------
    engagement = _engagement_total(post)
    if engagement >= 500:
        score += 25
        factors.append(f"very high engagement ({engagement})")
    elif engagement >= 100:
        score += 20
        factors.append(f"high engagement ({engagement})")
    elif engagement >= 50:
        score += 15
        factors.append(f"notable engagement ({engagement})")
    elif engagement >= 25:
        score += 10
        factors.append(f"moderate engagement ({engagement})")
    elif engagement > 5:
        score += 5

    # Virality velocity bonus
    velocity = _engagement_velocity(post)
    if velocity >= 0.3:
        bonus = min(10, int(velocity * 20))
        score += bonus
        factors.append(f"high virality velocity ({velocity})")

    # ------ 6. Recency boost (0–8 points) ------
    recency = _recency_boost(post)
    if recency >= 0.7:
        bonus = int(recency * 8)
        score += bonus
        if recency >= 0.85:
            factors.append("very recent post (< 6h)")

    # ------ Normalise and classify ------
    score = max(0, min(100, score))

    if score >= 80:
        level = "urgent"
    elif score >= 55:
        level = "high"
    elif score >= 30:
        level = "medium"
    else:
        level = "low"

    return Priority(level, score, factors)
