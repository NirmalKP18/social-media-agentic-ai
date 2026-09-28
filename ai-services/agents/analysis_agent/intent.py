"""Advanced intent classification with multi-label support and confidence scoring.

Classifies social media text into 8+ intent categories.  A single post can
carry multiple intents (e.g. a complaint that is also a question).  Each
intent gets a confidence score based on how many markers matched.
"""

from .schemas import IntentResult

QUESTION_WORDS = {
    "how", "why", "when", "where", "what", "which", "who", "whom",
    "can", "could", "does", "is", "are", "will", "would", "should",
    "has", "have", "do", "did", "shall", "may", "might",
}

COMPLAINT_MARKERS = {
    "broken", "bug", "issue", "problem", "error", "crash", "crashed",
    "slow", "refund", "terrible", "awful", "worst", "fail", "failed",
    "not working", "disappointed", "unacceptable", "defective",
    "malfunction", "glitch", "outage", "downtime", "unusable",
    "regression", "freezing", "frozen", "stuck", "corrupted", "lost data",
    "poor service", "no response", "ignored", "ruined", "disaster",
    "horrible experience", "terrible experience", "waste of money",
    "rip off", "scam", "fraud", "misleading", "false advertising",
    "charged twice", "overcharged", "billing issue", "unauthorized",
}

SUGGESTION_MARKERS = {
    "should", "please add", "would be nice", "feature request", "suggest",
    "idea", "improve", "wish", "consider adding", "it would help",
    "would love to see", "proposal", "enhancement", "better if",
    "my recommendation", "how about", "what if", "could you add",
    "needs improvement", "room for improvement", "missing feature",
    "can you add", "you should add", "it'd be great", "would benefit",
}

PRAISE_MARKERS = {
    "love", "amazing", "great", "excellent", "awesome", "best", "fantastic",
    "thank", "thanks", "perfect", "brilliant", "outstanding", "superb",
    "wonderful", "impressed", "incredible", "phenomenal", "top-notch",
    "well done", "kudos", "bravo", "hats off", "shout out", "shoutout",
    "keep it up", "exceeded expectations", "above and beyond",
    "five stars", "5 stars", "highly recommend", "game changer",
    "life saver", "love it", "so good", "hands down",
}

SPAM_MARKERS = {
    "subscribe", "promo", "giveaway", "click here", "follow back",
    "dm me", "free followers", "buy now", "limited offer", "act now",
    "free trial", "earn money", "make money", "work from home",
    "check my bio", "link in bio", "100% free", "no risk",
    "double your", "exclusive deal", "order now", "sign up free",
    "congratulations you", "you've been selected", "claim your",
}

COMPARISON_MARKERS = {
    "vs", "versus", "compared to", "better than", "worse than",
    "switch from", "switched to", "moved to", "migrated from",
    "alternative to", "competitor", "rivals", "prefer", "preferred",
    "unlike", "in comparison", "beats", "loses to", "outperforms",
    "falls short", "superior to", "inferior to", "over", "instead of",
}

PURCHASE_INTENT_MARKERS = {
    "buy", "buying", "purchase", "purchased", "order", "ordered",
    "looking to buy", "worth buying", "should i get", "planning to get",
    "thinking about getting", "pricing", "price", "cost", "how much",
    "discount", "deal", "sale", "coupon", "promo code", "subscription",
    "plan", "free trial", "upgrade", "downgrade", "cancel subscription",
    "worth the price", "worth it", "affordable", "budget",
}

CHURN_RISK_MARKERS = {
    "cancel", "cancelling", "canceling", "unsubscribe", "leaving",
    "switching away", "moving away", "done with", "over it",
    "last straw", "final warning", "giving up", "fed up",
    "had enough", "never again", "bye", "goodbye", "farewell",
    "looking for alternatives", "exploring options", "dealbreaker",
    "deal breaker", "not renewing", "won't renew", "dropping",
}

ADVOCACY_MARKERS = {
    "recommend", "recommended", "telling everyone", "told my friends",
    "everyone should", "you need to try", "must try", "must have",
    "can't live without", "changed my life", "best decision",
    "convert", "converted", "evangelist", "ambassador", "advocate",
    "spreading the word", "sharing this", "preach", "loyal customer",
    "customer for life", "die hard fan", "biggest fan",
}

# Marker sets paired with their intent label and a base confidence
_INTENT_SPECS: list[tuple[str, set[str], float]] = [
    ("spam",            SPAM_MARKERS,            0.85),
    ("complaint",       COMPLAINT_MARKERS,       0.75),
    ("churn_risk",      CHURN_RISK_MARKERS,      0.70),
    ("comparison",      COMPARISON_MARKERS,      0.65),
    ("suggestion",      SUGGESTION_MARKERS,      0.65),
    ("purchase_intent", PURCHASE_INTENT_MARKERS,  0.60),
    ("advocacy",        ADVOCACY_MARKERS,        0.70),
    ("praise",          PRAISE_MARKERS,          0.60),
]


def classify_intent(text: str, tokens: list[str]) -> IntentResult:
    """Multi-label intent classification with confidence scoring."""

    lowered = text.lower()
    token_set = set(tokens)
    results: dict[str, float] = {}

    for intent_label, markers, base_conf in _INTENT_SPECS:
        match_count = 0
        for marker in markers:
            if " " in marker:
                if marker in lowered:
                    match_count += 1
            else:
                if marker in token_set:
                    match_count += 1

        if match_count > 0:
            # Confidence increases with more matches, capped at 0.98
            confidence = min(0.98, base_conf + (match_count - 1) * 0.06)
            results[intent_label] = round(confidence, 3)

    # Question detection (structural — separate from keyword intents)
    is_question = False
    if "?" in text:
        is_question = True
    elif token_set & QUESTION_WORDS and lowered.rstrip().endswith("?"):
        is_question = True
    elif tokens and tokens[0] in QUESTION_WORDS and len(tokens) > 2:
        is_question = True

    if is_question:
        results["question"] = results.get("question", 0.0)
        results["question"] = max(results["question"], 0.75)

    if not results:
        return IntentResult(primary="other", labels=["other"], confidences={"other": 0.5})

    sorted_intents = sorted(results.items(), key=lambda x: x[1], reverse=True)
    primary = sorted_intents[0][0]
    # Only include labels with confidence above threshold
    labels = [label for label, conf in sorted_intents if conf >= 0.3]

    return IntentResult(primary=primary, labels=labels, confidences=results)

# [theuni03-revision-tag-4]: refactor(analysis): improve named entity recognition regex fallback logic

# [theuni03-revision-tag-12]: style(analysis): align docstring formatting across intent analysis methods
