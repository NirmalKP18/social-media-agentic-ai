"""Advanced lexicon-based sentiment analysis with weighted words, bigrams,
amplifiers, diminishers, negation windows, and emoji support.

The analyser computes a normalised polarity score (−1 … +1), a subjectivity
estimate (0 … 1) and a calibrated confidence value.  It is still fully
deterministic and offline — no ML model or network call required.
"""

from .schemas import Sentiment

# ---------------------------------------------------------------------------
# Weighted lexicon: each word maps to an intensity weight (0.3 – 1.0).
# Positive weights contribute to a positive score; negative to negative.
# ---------------------------------------------------------------------------

POSITIVE_LEXICON: dict[str, float] = {
    # strong positive (0.8–1.0)
    "love": 1.0, "amazing": 1.0, "outstanding": 1.0, "exceptional": 1.0,
    "incredible": 1.0, "phenomenal": 1.0, "superb": 0.95, "excellent": 0.95,
    "brilliant": 0.95, "magnificent": 0.95, "fantastic": 0.9, "wonderful": 0.9,
    "awesome": 0.9, "perfect": 0.9, "flawless": 0.9, "delightful": 0.85,
    "impressive": 0.85, "remarkable": 0.85, "thrilled": 0.85, "ecstatic": 0.85,
    "masterpiece": 0.85, "revolutionary": 0.8, "game-changer": 0.8,
    "world-class": 0.8, "top-notch": 0.8,
    # moderate positive (0.5–0.79)
    "great": 0.75, "good": 0.6, "happy": 0.7, "pleased": 0.65, "glad": 0.6,
    "satisfied": 0.65, "enjoy": 0.65, "enjoyed": 0.65, "helpful": 0.6,
    "reliable": 0.65, "quality": 0.6, "better": 0.55, "thanks": 0.55,
    "thank": 0.5, "works": 0.5, "nice": 0.55, "fast": 0.55, "easy": 0.55,
    "smooth": 0.6, "clean": 0.5, "solid": 0.55, "useful": 0.55,
    "effective": 0.6, "efficient": 0.6, "intuitive": 0.65, "elegant": 0.65,
    "responsive": 0.6, "beautiful": 0.7, "gorgeous": 0.75, "stunning": 0.7,
    "favorite": 0.7, "favourite": 0.7, "recommended": 0.6, "recommend": 0.6,
    "innovative": 0.65, "convenient": 0.55, "seamless": 0.65, "polished": 0.6,
    "refreshing": 0.55, "exciting": 0.65, "promising": 0.55, "upgrade": 0.5,
    "improved": 0.55, "upgraded": 0.5, "premium": 0.6, "delicious": 0.7,
    "comfortable": 0.55, "professional": 0.55, "trustworthy": 0.6,
    # mild positive (0.3–0.49)
    "okay": 0.3, "ok": 0.3, "fine": 0.35, "decent": 0.4, "acceptable": 0.35,
    "reasonable": 0.35, "fair": 0.35, "adequate": 0.3, "alright": 0.35,
    "functional": 0.3, "stable": 0.4, "workable": 0.3, "handy": 0.4,
    "capable": 0.4, "competent": 0.4, "positive": 0.5, "win": 0.55,
    "wins": 0.55, "won": 0.55, "success": 0.6, "successful": 0.6,
}

NEGATIVE_LEXICON: dict[str, float] = {
    # strong negative (0.8–1.0)
    "hate": 1.0, "terrible": 1.0, "horrible": 1.0, "atrocious": 1.0,
    "abysmal": 1.0, "catastrophic": 1.0, "disastrous": 0.95, "worst": 0.95,
    "dreadful": 0.95, "appalling": 0.95, "disgusting": 0.9, "pathetic": 0.9,
    "outrageous": 0.9, "unacceptable": 0.85, "inexcusable": 0.85,
    "nightmare": 0.85, "garbage": 0.85, "trash": 0.85, "scam": 0.9,
    "fraud": 0.9, "ripoff": 0.85, "rip-off": 0.85, "useless": 0.8,
    "worthless": 0.85, "deplorable": 0.85,
    # moderate negative (0.5–0.79)
    "bad": 0.65, "awful": 0.75, "poor": 0.6, "broken": 0.7, "slow": 0.55,
    "annoying": 0.6, "frustrating": 0.65, "frustrated": 0.65, "fail": 0.7,
    "failed": 0.7, "failure": 0.7, "problem": 0.55, "issue": 0.5,
    "bug": 0.55, "crash": 0.7, "crashed": 0.7, "error": 0.55, "spam": 0.6,
    "confusing": 0.55, "complicated": 0.5, "expensive": 0.5,
    "overpriced": 0.6, "unreliable": 0.65, "inconsistent": 0.55,
    "disappointing": 0.65, "disappointed": 0.65, "underwhelming": 0.55,
    "mediocre": 0.5, "subpar": 0.55, "inferior": 0.6, "lacking": 0.5,
    "flawed": 0.55, "defective": 0.7, "malfunction": 0.7, "glitch": 0.55,
    "glitchy": 0.6, "laggy": 0.55, "clunky": 0.5, "cumbersome": 0.5,
    "tedious": 0.5, "painful": 0.6, "unbearable": 0.75, "unresponsive": 0.6,
    "downgrade": 0.6, "regression": 0.6, "worse": 0.6, "sucks": 0.75,
    "rubbish": 0.7, "ridiculous": 0.6, "absurd": 0.55,
    # mild negative (0.3–0.49)
    "meh": 0.35, "bland": 0.4, "boring": 0.45, "dull": 0.4,
    "forgettable": 0.35, "average": 0.3, "ordinary": 0.3,
    "inconvenient": 0.4, "limited": 0.35, "outdated": 0.45,
    "overrated": 0.45, "miss": 0.35, "missed": 0.35, "delay": 0.4,
    "delayed": 0.4, "unclear": 0.4, "vague": 0.35, "weak": 0.45,
}

# ---------------------------------------------------------------------------
# Bigram / trigram phrases that override individual word scores
# ---------------------------------------------------------------------------

POSITIVE_PHRASES: dict[str, float] = {
    "not bad": 0.4, "well done": 0.7, "love it": 0.9, "highly recommend": 0.85,
    "must have": 0.7, "works great": 0.75, "very good": 0.7, "so good": 0.75,
    "top tier": 0.8, "best ever": 0.9, "works perfectly": 0.85,
    "really good": 0.7, "pretty good": 0.6, "exceeded expectations": 0.85,
    "blown away": 0.85, "pleasantly surprised": 0.7, "does the job": 0.5,
    "no complaints": 0.55, "no issues": 0.5, "five stars": 0.9, "5 stars": 0.9,
    "can not complain": 0.5, "worth it": 0.65, "worth every penny": 0.8,
    "game changer": 0.8, "life saver": 0.75, "well made": 0.6,
    "customer for life": 0.85, "best in class": 0.8,
}

NEGATIVE_PHRASES: dict[str, float] = {
    "not good": 0.6, "not great": 0.5, "waste of money": 0.85,
    "waste of time": 0.8, "ripped off": 0.85, "let down": 0.6,
    "fell apart": 0.75, "does not work": 0.75, "stopped working": 0.7,
    "never again": 0.8, "total disaster": 0.9, "complete waste": 0.85,
    "poorly made": 0.65, "cheaply made": 0.6, "false advertising": 0.8,
    "dead on arrival": 0.9, "out of date": 0.5, "customer service": 0.0,
    "no support": 0.6, "poor quality": 0.65, "low quality": 0.6,
    "not worth": 0.6, "stay away": 0.8, "do not buy": 0.85,
    "buyer beware": 0.7, "worst ever": 0.9, "very bad": 0.7,
    "really bad": 0.7, "so bad": 0.75, "terrible experience": 0.85,
    "horrible experience": 0.85, "would not recommend": 0.75,
    "not recommended": 0.65,
}

# ---------------------------------------------------------------------------
# Negation, amplifiers, diminishers
# ---------------------------------------------------------------------------

NEGATIONS = {
    "not", "no", "never", "cannot", "cant", "can't", "dont", "don't",
    "doesnt", "doesn't", "isnt", "isn't", "wont", "won't", "neither",
    "nor", "hardly", "barely", "scarcely", "without", "ain't", "aint",
    "shouldn't", "shouldnt", "wouldn't", "wouldnt", "couldn't", "couldnt",
    "wasn't", "wasnt", "weren't", "werent", "hasn't", "hasnt",
    "haven't", "havent", "hadn't", "hadnt",
}

AMPLIFIERS: dict[str, float] = {
    "very": 1.5, "extremely": 1.8, "incredibly": 1.7, "absolutely": 1.7,
    "totally": 1.5, "completely": 1.6, "utterly": 1.6, "really": 1.4,
    "truly": 1.4, "highly": 1.4, "super": 1.5, "so": 1.3, "insanely": 1.7,
    "ridiculously": 1.5, "remarkably": 1.4, "exceptionally": 1.6,
    "particularly": 1.3, "especially": 1.3, "enormously": 1.5,
    "tremendously": 1.5, "immensely": 1.5, "wildly": 1.4,
}

DIMINISHERS: dict[str, float] = {
    "slightly": 0.5, "somewhat": 0.6, "a bit": 0.6, "a little": 0.55,
    "kind of": 0.6, "sort of": 0.6, "fairly": 0.7, "rather": 0.7,
    "mildly": 0.5, "marginally": 0.5, "partly": 0.6, "partially": 0.6,
    "almost": 0.7, "nearly": 0.7, "hardly": 0.3, "barely": 0.3,
}

# ---------------------------------------------------------------------------
# Emoji sentiment map (common social-media emoji)
# ---------------------------------------------------------------------------

EMOJI_SENTIMENT: dict[str, float] = {
    "😍": 1.0, "❤️": 0.9, "🥰": 0.9, "💯": 0.85, "🔥": 0.7, "👏": 0.7,
    "😊": 0.7, "🎉": 0.75, "✨": 0.6, "💪": 0.6, "👍": 0.6, "😎": 0.55,
    "🙌": 0.7, "💖": 0.85, "💕": 0.8, "😄": 0.65, "😃": 0.6, "🤩": 0.85,
    "😁": 0.6, "🥳": 0.75, "💙": 0.7, "🤗": 0.7, "🏆": 0.7, "⭐": 0.65,
    "🌟": 0.65, "✅": 0.5, "👌": 0.5,
    "😡": -0.9, "🤬": -1.0, "💀": -0.5, "😤": -0.7, "😠": -0.8,
    "👎": -0.65, "😢": -0.6, "😭": -0.7, "💔": -0.7, "🤮": -0.85,
    "😒": -0.5, "🙄": -0.5, "😩": -0.55, "😫": -0.55, "😑": -0.4,
    "😰": -0.5, "😨": -0.55, "🤢": -0.7, "👿": -0.8, "😱": -0.6,
    "❌": -0.5, "⚠️": -0.3, "😞": -0.55, "😔": -0.5, "🚫": -0.4,
}


def _extract_emoji_score(text: str) -> tuple[float, int]:
    """Sum emoji contributions from the raw text."""
    score = 0.0
    count = 0
    for char in text:
        if char in EMOJI_SENTIMENT:
            score += EMOJI_SENTIMENT[char]
            count += 1
    # Also check multi-char emoji
    for emoji, value in EMOJI_SENTIMENT.items():
        if len(emoji) > 1 and emoji in text:
            score += value
            count += 1
    return score, count


def _check_phrases(text_lower: str) -> tuple[float, float, int]:
    """Check for bigram/trigram phrases.  Returns (pos_score, neg_score, match_count)."""
    pos = neg = 0.0
    count = 0
    for phrase, weight in POSITIVE_PHRASES.items():
        if phrase in text_lower:
            pos += weight
            count += 1
    for phrase, weight in NEGATIVE_PHRASES.items():
        if phrase in text_lower and weight > 0:
            neg += weight
            count += 1
    return pos, neg, count


def analyze_sentiment(tokens: list[str], raw_text: str = "") -> Sentiment:
    """Compute sentiment with weighted lexicon, negation, amplifiers, emoji, and phrases.

    Parameters
    ----------
    tokens : list[str]
        Lower-cased word tokens (produced by ``classifier.tokenize``).
    raw_text : str, optional
        The original un-tokenized text, used for emoji and phrase extraction.
    """

    pos_score = 0.0
    neg_score = 0.0
    magnitude = 0
    negation_window = 0
    amplifier = 1.0

    for token in tokens:
        # Track negation window
        if token in NEGATIONS:
            negation_window = 3
            continue

        # Track amplifiers / diminishers
        if token in AMPLIFIERS:
            amplifier = AMPLIFIERS[token]
            continue
        if token in DIMINISHERS:
            amplifier = DIMINISHERS[token]
            continue

        flip = negation_window > 0
        negation_window = max(0, negation_window - 1)

        if token in POSITIVE_LEXICON:
            weight = POSITIVE_LEXICON[token] * amplifier
            if flip:
                neg_score += weight * 0.75  # negated positive is slightly weaker negative
            else:
                pos_score += weight
            magnitude += 1
        elif token in NEGATIVE_LEXICON:
            weight = NEGATIVE_LEXICON[token] * amplifier
            if flip:
                pos_score += weight * 0.5  # negated negative is weaker positive
            else:
                neg_score += weight
            magnitude += 1

        amplifier = 1.0  # reset after consuming a sentiment word

    # Phrase-level adjustments
    text_lower = raw_text.lower() if raw_text else " ".join(tokens)
    phrase_pos, phrase_neg, phrase_count = _check_phrases(text_lower)
    pos_score += phrase_pos
    neg_score += phrase_neg
    magnitude += phrase_count

    # Emoji adjustments
    if raw_text:
        emoji_score, emoji_count = _extract_emoji_score(raw_text)
        if emoji_score > 0:
            pos_score += emoji_score * 0.4
        else:
            neg_score += abs(emoji_score) * 0.4
        magnitude += emoji_count

    # Normalise
    total = pos_score + neg_score
    if total == 0:
        return Sentiment("neutral", 0.0, 0.5, 0.0)

    polarity = (pos_score - neg_score) / (total + 1)
    polarity = max(-1.0, min(1.0, polarity))

    subjectivity = min(1.0, magnitude / max(len(tokens), 1))

    # Confidence: higher when magnitude is large relative to text length and polarity is decisive
    raw_confidence = 0.5 + abs(polarity) * 0.35 + min(0.15, magnitude * 0.02)
    confidence = round(min(1.0, raw_confidence), 3)

    label = "positive" if polarity > 0.1 else "negative" if polarity < -0.1 else "neutral"

    return Sentiment(label, round(polarity, 3), confidence, round(subjectivity, 3))
