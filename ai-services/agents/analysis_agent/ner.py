"""Named-entity extraction with expanded gazetteers, person-name heuristics,
monetary amount detection, date/time extraction, and confidence scoring.

This is a deterministic, rule-based extractor: it recognises hashtags,
mentions, URLs, e-mail addresses, monetary amounts, dates, and capitalised
proper-noun phrases, then labels phrases against comprehensive gazetteers
of well-known organisations, products, and locations.
"""

import re

from .schemas import NamedEntity

# ---------------------------------------------------------------------------
# Regex patterns
# ---------------------------------------------------------------------------

MENTION_RE = re.compile(r"(?<![\w@])@([A-Za-z0-9_]{1,30})")
HASHTAG_RE = re.compile(r"(?<![\w#])#([A-Za-z0-9_]{1,30})")
URL_RE = re.compile(r"https?://[^\s]+")
EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
PROPER_RE = re.compile(r"\b([A-Z][a-zA-Z0-9]*(?:\s+[A-Z][a-zA-Z0-9]*){0,3})\b")
SENTENCE_SPLIT_RE = re.compile(r"[.!?]\s+|\n+")

# Monetary patterns: $100, $1,000.50, USD 500, €200, £50
MONEY_RE = re.compile(
    r"(?:[\$€£¥₹])\s*[\d,]+(?:\.\d{1,2})?"
    r"|(?:\d[\d,]*(?:\.\d{1,2})?)\s*(?:USD|EUR|GBP|JPY|INR|CAD|AUD|dollars?|euros?|pounds?|rupees?)"
    r"|(?:USD|EUR|GBP|JPY|INR|CAD|AUD)\s*[\d,]+(?:\.\d{1,2})?",
    re.IGNORECASE,
)

# Date patterns: 2024-01-15, Jan 15 2024, 15/01/2024, January 2024
DATE_RE = re.compile(
    r"\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b"
    r"|\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b"
    r"|\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:\s*,?\s*\d{2,4})?\b"
    r"|\b\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*,?\s*\d{2,4}\b",
    re.IGNORECASE,
)

# Percentage patterns
PERCENT_RE = re.compile(r"\b\d+(?:\.\d+)?%\b")

# Version patterns: v1.0, version 2.3.1
VERSION_RE = re.compile(r"\bv(?:ersion)?\s*\d+(?:\.\d+)*\b", re.IGNORECASE)

# ---------------------------------------------------------------------------
# Expanded gazetteers (5× the original)
# ---------------------------------------------------------------------------

ORGANIZATIONS = {
    # tech
    "google", "microsoft", "apple", "amazon", "meta", "facebook", "instagram",
    "youtube", "linkedin", "twitter", "netflix", "samsung", "sony", "adobe",
    "spotify", "uber", "airbnb", "tesla", "nvidia", "intel", "oracle",
    "salesforce", "shopify", "zoom", "slack", "tiktok", "snapchat", "pinterest",
    "reddit", "github", "gitlab", "atlassian", "dropbox", "stripe", "paypal",
    "square", "twilio", "cloudflare", "datadog", "snowflake", "palantir",
    "coinbase", "robinhood", "openai", "anthropic", "databricks", "figma",
    "notion", "canva", "asana", "trello", "hubspot", "zendesk", "intercom",
    "twitch", "discord", "whatsapp", "telegram", "signal", "wechat",
    # enterprise / legacy
    "ibm", "hp", "dell", "cisco", "vmware", "sap", "accenture", "deloitte",
    "pwc", "kpmg", "mckinsey", "bcg", "bain", "capgemini", "infosys",
    "wipro", "tcs", "cognizant", "hcl",
    # finance
    "jpmorgan", "goldman sachs", "morgan stanley", "bank of america",
    "citibank", "hsbc", "barclays", "wells fargo", "visa", "mastercard",
    # consumer
    "nike", "adidas", "coca-cola", "pepsi", "mcdonald's", "starbucks",
    "walmart", "target", "costco", "ikea", "zara", "unilever", "p&g",
}

PRODUCTS = {
    "iphone", "ipad", "macbook", "imac", "airpods", "apple watch", "homepod",
    "android", "windows", "chrome", "safari", "firefox", "edge", "opera",
    "photoshop", "illustrator", "premiere", "after effects", "lightroom",
    "excel", "word", "powerpoint", "outlook", "teams", "office", "office 365",
    "playstation", "xbox", "nintendo switch", "pixel", "galaxy", "surface",
    "chatgpt", "gemini", "copilot", "claude", "midjourney", "dall-e", "sora",
    "aws", "azure", "gcp", "kubernetes", "docker", "terraform", "jenkins",
    "react", "angular", "vue", "next.js", "node.js", "python", "java",
    "typescript", "rust", "go", "swift", "kotlin",
    "mysql", "postgresql", "mongodb", "redis", "elasticsearch",
    "shopify plus", "magento", "woocommerce", "bigcommerce",
    "alexa", "siri", "google assistant", "cortana",
    "tesla model", "model 3", "model y", "model s", "model x", "cybertruck",
}

LOCATIONS = {
    "usa", "uk", "india", "canada", "australia", "germany", "france", "japan",
    "china", "brazil", "america", "europe", "asia", "africa",
    "london", "new york", "san francisco", "los angeles", "chicago", "seattle",
    "boston", "austin", "denver", "atlanta", "miami", "dallas", "houston",
    "california", "texas", "florida", "washington", "new jersey", "massachusetts",
    "mumbai", "delhi", "bengaluru", "bangalore", "hyderabad", "chennai", "pune",
    "kolkata", "ahmedabad", "jaipur", "lucknow",
    "paris", "berlin", "munich", "amsterdam", "dublin", "zurich", "stockholm",
    "tokyo", "osaka", "seoul", "singapore", "hong kong", "shanghai", "beijing",
    "sydney", "melbourne", "toronto", "vancouver", "montreal",
    "dubai", "abu dhabi", "riyadh", "tel aviv", "istanbul",
    "são paulo", "rio de janeiro", "mexico city", "buenos aires",
    "lagos", "nairobi", "cape town", "cairo",
    "silicon valley", "wall street", "bay area",
}

COMMON_SENTENCE_STARTERS = {
    "the", "this", "that", "these", "those", "i", "we", "they", "he", "she",
    "it", "my", "our", "your", "their", "a", "an", "and", "but", "so", "if",
    "when", "after", "before", "great", "love", "thanks", "thank", "please",
    "why", "how", "what", "very", "just", "also", "here", "there", "now",
    "some", "all", "any", "new", "really", "been", "would", "could", "should",
    "well", "even", "still", "then", "more", "first", "last", "next", "sure",
}

# Name prefixes that hint at person names
NAME_PREFIXES = {"mr", "mrs", "ms", "dr", "prof", "sir", "ceo", "cto", "cfo", "vp"}


def extract_entities(text: str) -> list[str]:
    """Backwards-compatible shorthand: hashtags and mentions, lowercased."""
    found = [f"@{name}" for name in MENTION_RE.findall(text)]
    found += [f"#{name}" for name in HASHTAG_RE.findall(text)]
    return list(dict.fromkeys(item.lower() for item in found))[:10]


def _classify(phrase: str) -> tuple[str, float]:
    """Classify a phrase and return (type, confidence)."""
    lowered = phrase.lower()
    if lowered in ORGANIZATIONS:
        return "organization", 0.95
    if lowered in PRODUCTS:
        return "product", 0.9
    if lowered in LOCATIONS:
        return "location", 0.9
    return "proper_noun", 0.5


def _detect_person_name(text: str) -> list[NamedEntity]:
    """Heuristic person-name detection from title prefixes."""
    entities: list[NamedEntity] = []
    # Match "Mr. John Smith", "CEO Jane Doe", etc.
    pattern = re.compile(
        r"\b(?:" + "|".join(re.escape(p) for p in NAME_PREFIXES) +
        r")\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b",
        re.IGNORECASE,
    )
    for match in pattern.finditer(text):
        name = match.group(1).strip()
        if len(name) > 2:
            entities.append(NamedEntity(name, "person", confidence=0.7))
    return entities


def _extract_proper_nouns(text: str) -> list[NamedEntity]:
    """Extract and classify capitalised proper-noun phrases."""
    entities: list[NamedEntity] = []
    known = ORGANIZATIONS | PRODUCTS | LOCATIONS
    for sentence in SENTENCE_SPLIT_RE.split(text):
        sentence = sentence.strip()
        if not sentence:
            continue
        for match in PROPER_RE.finditer(sentence):
            phrase = match.group(1).strip()
            if phrase.lower() in known:
                entity_type, conf = _classify(phrase)
                entities.append(NamedEntity(phrase, entity_type, confidence=conf))
                continue
            words = phrase.split()
            for word in words:
                if len(word) < 2 or word.lower() in COMMON_SENTENCE_STARTERS:
                    continue
                entity_type, conf = _classify(word)
                entities.append(NamedEntity(word, entity_type, confidence=conf))
    return entities


def extract_named_entities(text: str) -> tuple[list[str], list[NamedEntity]]:
    """Return (legacy entity strings, typed named entities)."""

    typed: list[NamedEntity] = []

    # Social references
    typed.extend(NamedEntity(f"@{name}", "mention", 1.0) for name in MENTION_RE.findall(text))
    typed.extend(NamedEntity(f"#{name}", "hashtag", 1.0) for name in HASHTAG_RE.findall(text))
    typed.extend(NamedEntity(url, "url", 1.0) for url in URL_RE.findall(text))
    typed.extend(NamedEntity(email, "email", 0.95) for email in EMAIL_RE.findall(text))

    # Monetary amounts
    typed.extend(NamedEntity(m.group(), "monetary", 0.9) for m in MONEY_RE.finditer(text))

    # Dates
    typed.extend(NamedEntity(m.group(), "date", 0.85) for m in DATE_RE.finditer(text))

    # Percentages
    typed.extend(NamedEntity(m.group(), "percentage", 0.9) for m in PERCENT_RE.finditer(text))

    # Versions
    typed.extend(NamedEntity(m.group(), "version", 0.85) for m in VERSION_RE.finditer(text))

    # Person names (title-prefix heuristic)
    typed.extend(_detect_person_name(text))

    # Proper nouns + gazetteer
    typed.extend(_extract_proper_nouns(text))

    # Deduplicate
    deduplicated: dict[tuple[str, str], NamedEntity] = {}
    for entity in typed:
        key = (entity.text.lower(), entity.type)
        existing = deduplicated.get(key)
        if existing is None or entity.confidence > existing.confidence:
            deduplicated[key] = entity

    ordered = list(deduplicated.values())[:30]
    legacy = list(dict.fromkeys(
        entity.text.lower()
        for entity in ordered
        if entity.type in {"mention", "hashtag"}
    ))[:10]
    return legacy, ordered

# [theuni03-revision-tag-5]: style(analysis): format type hints across sentiment analysis schemas

# [theuni03-revision-tag-13]: feat(analysis): add emotion score normalization helper for multi-label outputs
