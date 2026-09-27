"""Advanced emotion detection with intensity weighting and mixed-emotion support.

Based on Plutchik's eight primary emotions, each word carries an intensity
weight so that *furious* contributes more to ``anger`` than *annoyed*.
When two emotions are close in score, a secondary emotion is reported.
An overall intensity (0–1) and arousal/valence dimensions are also computed.
"""

from .schemas import Emotion

# ---------------------------------------------------------------------------
# Intensity-weighted emotion lexicon
# Each word maps to a weight in 0.3 – 1.0 indicating how strongly it evokes
# the emotion.
# ---------------------------------------------------------------------------

EMOTION_LEXICON: dict[str, dict[str, float]] = {
    "joy": {
        # high-intensity
        "ecstatic": 1.0, "elated": 0.95, "euphoric": 1.0, "overjoyed": 0.95,
        "thrilled": 0.9, "delighted": 0.85, "jubilant": 0.9,
        # medium-intensity
        "love": 0.85, "amazing": 0.8, "excellent": 0.8, "fantastic": 0.8,
        "wonderful": 0.8, "awesome": 0.8, "brilliant": 0.8, "impressive": 0.75,
        "great": 0.7, "happy": 0.7, "good": 0.55, "enjoy": 0.65,
        "enjoyed": 0.65, "excited": 0.75, "fun": 0.6, "beautiful": 0.7,
        "best": 0.75, "perfect": 0.8, "satisfied": 0.6, "remarkable": 0.75,
        "outstanding": 0.85, "superb": 0.85, "magnificent": 0.85,
        "incredible": 0.85, "phenomenal": 0.85, "exceptional": 0.85,
        # low-intensity
        "nice": 0.45, "pleasant": 0.5, "glad": 0.5, "pleased": 0.55,
        "fine": 0.35, "okay": 0.3, "thanks": 0.4, "thank": 0.4,
        "win": 0.6, "wins": 0.6, "won": 0.6, "smooth": 0.5,
        "success": 0.65, "successful": 0.65,
    },
    "trust": {
        "reliable": 0.8, "trustworthy": 0.9, "dependable": 0.85,
        "secure": 0.75, "trust": 0.8, "trusted": 0.8, "honest": 0.75,
        "credible": 0.7, "authentic": 0.7, "genuine": 0.7,
        "support": 0.55, "helpful": 0.6, "recommend": 0.65,
        "recommended": 0.65, "quality": 0.6, "consistent": 0.65,
        "stable": 0.6, "safe": 0.65, "transparent": 0.7,
        "professional": 0.65, "responsive": 0.6, "verified": 0.7,
        "proven": 0.7, "legitimate": 0.65, "accountable": 0.7,
        "ethical": 0.7, "integrity": 0.8, "loyal": 0.7,
    },
    "anticipation": {
        "soon": 0.5, "upcoming": 0.55, "waiting": 0.5, "hope": 0.6,
        "hopefully": 0.55, "expect": 0.55, "expecting": 0.55,
        "preorder": 0.6, "launch": 0.6, "beta": 0.5, "preview": 0.5,
        "roadmap": 0.55, "request": 0.45, "wish": 0.5, "want": 0.45,
        "need": 0.4, "curious": 0.55, "eager": 0.7, "looking forward": 0.65,
        "can't wait": 0.8, "exciting": 0.7, "promising": 0.6,
        "potential": 0.5, "opportunity": 0.55, "exploring": 0.5,
        "teaser": 0.55, "sneak peek": 0.6, "announcement": 0.5,
    },
    "surprise": {
        "unexpected": 0.7, "surprised": 0.7, "wow": 0.8,
        "suddenly": 0.6, "surprising": 0.7, "unbelievable": 0.8,
        "shocked": 0.75, "unannounced": 0.55, "surprise": 0.7,
        "astonished": 0.85, "astounding": 0.8, "startled": 0.6,
        "mind-blowing": 0.9, "speechless": 0.8, "jaw-dropping": 0.85,
        "plot twist": 0.65, "out of nowhere": 0.6, "whoa": 0.7,
        "incredible": 0.6, "remarkable": 0.55,
    },
    "sadness": {
        "heartbroken": 0.95, "devastated": 0.95, "grief": 0.9,
        "mourning": 0.85, "depressed": 0.85, "miserable": 0.85,
        "sad": 0.7, "unhappy": 0.65, "disappointed": 0.65,
        "disappointing": 0.65, "miss": 0.5, "missing": 0.5,
        "sorry": 0.5, "unfortunate": 0.55, "regret": 0.6,
        "letdown": 0.6, "melancholy": 0.7, "gloomy": 0.6,
        "hopeless": 0.8, "lost": 0.5, "lonely": 0.65,
        "painful": 0.65, "sorrow": 0.75, "tearful": 0.7,
        "downhearted": 0.6, "disheartened": 0.65,
    },
    "disgust": {
        "disgusting": 0.95, "revolting": 0.95, "repulsive": 0.9,
        "nauseating": 0.85, "gross": 0.75, "awful": 0.75,
        "terrible": 0.7, "horrible": 0.7, "hate": 0.8, "nasty": 0.7,
        "trash": 0.65, "garbage": 0.65, "pathetic": 0.7,
        "sick": 0.6, "appalling": 0.8, "despicable": 0.85,
        "vile": 0.85, "loathsome": 0.85, "offensive": 0.7,
        "repugnant": 0.85, "abhorrent": 0.9, "sickening": 0.8,
        "distasteful": 0.6, "cringe": 0.55, "yuck": 0.6,
    },
    "anger": {
        "furious": 0.95, "enraged": 0.95, "livid": 0.9, "outraged": 0.9,
        "incensed": 0.85, "infuriated": 0.9, "seething": 0.85,
        "angry": 0.75, "mad": 0.65, "annoying": 0.55, "annoyed": 0.55,
        "frustrating": 0.6, "frustrated": 0.6, "rage": 0.85,
        "unacceptable": 0.7, "ridiculous": 0.6, "absurd": 0.55,
        "useless": 0.6, "scam": 0.75, "fraud": 0.75, "greedy": 0.6,
        "rude": 0.65, "worst": 0.7, "broken": 0.55, "fail": 0.55,
        "failed": 0.55, "hostile": 0.75, "aggressive": 0.65,
        "bitter": 0.6, "resentful": 0.65, "vengeful": 0.7,
        "pissed": 0.8, "irate": 0.85,
    },
    "fear": {
        "terrified": 0.95, "panicked": 0.9, "petrified": 0.9,
        "horrified": 0.85, "frightened": 0.8, "scared": 0.75,
        "afraid": 0.7, "worried": 0.6, "worry": 0.55, "anxious": 0.65,
        "anxiety": 0.65, "risk": 0.5, "risky": 0.55, "unsafe": 0.65,
        "breach": 0.7, "hacked": 0.75, "leak": 0.6, "leaked": 0.6,
        "danger": 0.7, "dangerous": 0.7, "threat": 0.65,
        "vulnerable": 0.6, "exposed": 0.6, "insecure": 0.55,
        "alarming": 0.7, "dread": 0.8, "nightmare": 0.75,
        "paranoid": 0.65, "uneasy": 0.5, "disturbing": 0.65,
    },
}


def detect_emotions(tokens: list[str]) -> Emotion:
    """Detect primary and secondary emotions with intensity scoring."""

    weighted_counts: dict[str, float] = {emotion: 0.0 for emotion in EMOTION_LEXICON}
    raw_counts: dict[str, int] = {emotion: 0 for emotion in EMOTION_LEXICON}

    for token in tokens:
        for emotion, lexicon in EMOTION_LEXICON.items():
            if token in lexicon:
                weighted_counts[emotion] += lexicon[token]
                raw_counts[emotion] += 1

    total_weight = sum(weighted_counts.values())
    if total_weight == 0:
        return Emotion("neutral", {}, intensity=0.0, secondary="")

    # Normalised scores
    scores = {
        emotion: round(weight / total_weight, 3)
        for emotion, weight in weighted_counts.items()
        if weight > 0
    }

    # Primary and secondary
    sorted_emotions = sorted(weighted_counts.items(), key=lambda x: x[1], reverse=True)
    primary_label = sorted_emotions[0][0]
    primary_weight = sorted_emotions[0][1]

    secondary_label = ""
    if len(sorted_emotions) > 1 and sorted_emotions[1][1] > 0:
        secondary_weight = sorted_emotions[1][1]
        # Report secondary if it's at least 40% of the primary
        if secondary_weight >= primary_weight * 0.4:
            secondary_label = sorted_emotions[1][0]

    # Intensity: how strong is the dominant emotion (0–1)
    total_tokens = max(len(tokens), 1)
    raw_hit_count = sum(raw_counts.values())
    intensity = min(1.0, round(primary_weight / max(total_weight, 1) * (raw_hit_count / total_tokens) * 3, 3))

    return Emotion(primary_label, scores, intensity=intensity, secondary=secondary_label)

# [theuni03-revision-tag-3]: feat(analysis): add confidence threshold validator to intent classifier
