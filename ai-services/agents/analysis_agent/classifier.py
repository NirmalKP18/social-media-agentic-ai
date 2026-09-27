"""Advanced topic classification with semantic clusters, n-gram extraction,
and TF-IDF-inspired weighting.

Replaces simple raw word frequency with a richer approach:
- Predefined semantic topic categories match posts to business-relevant themes
- Bigram extraction captures compound concepts ("customer service", "data privacy")
- IDF-like weighting penalises ubiquitous words and boosts discriminative ones
- Better stopword list for social media text
"""

import math
import re
from collections import Counter

from .sentiment import NEGATIONS

# ---------------------------------------------------------------------------
# Expanded social-media-aware stopwords
# ---------------------------------------------------------------------------

STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "is", "are", "was", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "shall", "can", "to", "of",
    "in", "for", "on", "with", "at", "by", "from", "as", "into", "through",
    "about", "after", "before", "between", "under", "above", "up", "down",
    "out", "off", "over", "then", "than", "so", "if", "when", "where",
    "which", "what", "who", "whom", "how", "that", "this", "these", "those",
    "it", "its", "we", "they", "he", "she", "me", "him", "her", "us",
    "them", "my", "our", "your", "his", "their", "mine", "ours", "yours",
    "just", "also", "very", "really", "even", "still", "only", "more",
    "most", "some", "any", "all", "each", "every", "both", "such",
    "too", "much", "many", "few", "own", "other", "another", "same",
    "well", "back", "here", "there", "now", "already", "always", "never",
    "get", "got", "getting", "make", "made", "let", "say", "said", "know",
    "think", "see", "come", "take", "want", "give", "use", "find", "tell",
    "go", "going", "gone", "went", "try", "need", "like", "look", "keep",
    "put", "seem", "help", "show", "turn", "call", "ask", "feel", "run",
    "new", "old", "big", "small", "long", "little", "great", "good",
    "right", "first", "last", "next", "sure", "thing", "way", "lot",
    "day", "time", "year", "people", "don", "doesn", "didn", "isn",
    "aren", "wasn", "weren", "won", "not", "been",
    # social media filler
    "lol", "lmao", "omg", "tbh", "imo", "imho", "btw", "smh", "fwiw",
    "idk", "ikr", "ngl", "brb", "aka", "etc", "via",
}

# ---------------------------------------------------------------------------
# Semantic topic categories: business-relevant clusters
# ---------------------------------------------------------------------------

TOPIC_CATEGORIES: dict[str, set[str]] = {
    "customer_service": {
        "support", "service", "help", "response", "ticket", "agent",
        "representative", "chat", "email", "phone", "callback", "hold",
        "waiting", "resolution", "resolved", "complaint", "escalate",
    },
    "product_quality": {
        "quality", "durable", "durability", "build", "material", "design",
        "defective", "broken", "sturdy", "flimsy", "premium", "craftsmanship",
        "finish", "manufacturing", "well-made", "cheap",
    },
    "pricing_value": {
        "price", "pricing", "cost", "expensive", "cheap", "affordable",
        "overpriced", "value", "worth", "discount", "deal", "sale",
        "subscription", "plan", "billing", "charge", "refund", "money",
    },
    "performance": {
        "fast", "slow", "speed", "performance", "latency", "lag", "laggy",
        "responsive", "efficient", "optimization", "bandwidth", "uptime",
        "downtime", "crash", "crashes", "freeze", "freezing", "hang",
    },
    "user_experience": {
        "interface", "design", "intuitive", "confusing", "ui", "ux",
        "navigation", "layout", "usability", "accessibility", "workflow",
        "onboarding", "tutorial", "dashboard", "settings", "customization",
    },
    "security_privacy": {
        "security", "privacy", "breach", "hack", "hacked", "leak", "leaked",
        "data", "encryption", "password", "authentication", "authorization",
        "vulnerability", "phishing", "malware", "gdpr", "compliance",
    },
    "innovation_features": {
        "feature", "features", "update", "updates", "release", "version",
        "integration", "api", "plugin", "extension", "capability",
        "functionality", "improvement", "enhancement", "roadmap",
    },
    "brand_reputation": {
        "brand", "reputation", "image", "trust", "credibility", "reliable",
        "trustworthy", "ethical", "sustainable", "responsibility",
        "transparency", "values", "culture", "leadership",
    },
    "competitor_comparison": {
        "competitor", "alternative", "versus", "compared", "comparison",
        "switch", "switched", "migrate", "migrated", "better", "worse",
        "prefer", "preferred", "rivalry",
    },
    "delivery_logistics": {
        "delivery", "shipping", "shipped", "package", "tracking", "courier",
        "arrived", "late", "delayed", "delay", "warehouse", "stock",
        "inventory", "fulfillment", "return", "returns", "exchange",
    },
}


def tokenize(text: str) -> list[str]:
    """Tokenize text to lowercase words, preserving apostrophe contractions."""
    return re.findall(r"[a-zA-Z']+", text.lower())


def extract_bigrams(tokens: list[str]) -> list[str]:
    """Extract meaningful bigrams, filtering out stopword-only pairs."""
    bigrams = []
    for i in range(len(tokens) - 1):
        a, b = tokens[i], tokens[i + 1]
        if a in STOPWORDS and b in STOPWORDS:
            continue
        if len(a) < 2 or len(b) < 2:
            continue
        bigrams.append(f"{a} {b}")
    return bigrams


def extract_topics(tokens: list[str], raw_text: str = "") -> list[str]:
    """Extract topics using semantic categories, TF-IDF weighting, and n-grams.

    Returns up to 8 topics, mixing category matches with weighted keywords.
    """

    # --- Semantic category matching ---
    token_set = set(tokens)
    lowered = raw_text.lower() if raw_text else " ".join(tokens)
    category_scores: dict[str, int] = {}

    for category, keywords in TOPIC_CATEGORIES.items():
        score = 0
        for keyword in keywords:
            if " " in keyword:
                if keyword in lowered:
                    score += 1
            elif keyword in token_set:
                score += 1
        if score >= 2:
            category_scores[category] = score

    sorted_categories = sorted(category_scores.items(), key=lambda x: x[1], reverse=True)
    category_topics = [cat for cat, _ in sorted_categories[:3]]

    # --- TF-IDF-weighted keyword extraction ---
    filtered = [
        t for t in tokens
        if len(t) >= 3 and t not in STOPWORDS and t not in NEGATIONS
    ]
    tf = Counter(filtered)
    total = len(filtered) or 1
    # Simulate IDF: words that appear in a large fraction of the text are penalised
    doc_freq = {word: count for word, count in tf.items()}
    max_freq = max(doc_freq.values()) if doc_freq else 1

    weighted: dict[str, float] = {}
    for word, count in tf.items():
        tf_score = count / total
        # IDF approximation: rarer words in the document get higher weight
        idf = math.log(1 + max_freq / count)
        weighted[word] = tf_score * idf

    keyword_topics = [w for w, _ in sorted(weighted.items(), key=lambda x: x[1], reverse=True)]

    # --- Bigram extraction ---
    bigrams = extract_bigrams(filtered)
    bigram_counts = Counter(bigrams)
    top_bigrams = [bg for bg, cnt in bigram_counts.most_common(3) if cnt >= 1]

    # --- Merge: categories first, then top keywords, then bigrams ---
    seen = set()
    result: list[str] = []
    for topic in category_topics + keyword_topics + top_bigrams:
        if topic not in seen:
            seen.add(topic)
            result.append(topic)
        if len(result) >= 8:
            break

    return result


def summarize(content: str) -> str:
    """Generate a concise summary: first 2 sentences or up to 300 chars."""
    sentences = [
        part.strip()
        for part in re.split(r"(?<=[.!?])\s+", content)
        if part.strip()
    ]
    if not sentences:
        return content[:300]

    summary = sentences[0]
    if len(sentences) > 1 and len(summary) + len(sentences[1]) + 2 <= 300:
        summary += " " + sentences[1]

    return summary[:300]

# [theuni03-revision-tag-2]: docs(analysis): add docstrings for emotion probability score calculation
