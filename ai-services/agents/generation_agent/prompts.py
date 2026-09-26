"""Static templates used to build the grounded, human-review draft."""

GROUNDED_TEMPLATE = (
    "Thanks for reaching out about {topic}. Based on our reference material, {guidance} "
    "We are reviewing the specific concerns raised in the linked evidence and will follow up with a verified update."
)

INSUFFICIENT_TEMPLATE = (
    "Thanks for your feedback about {topic}. We have logged the concern and a specialist is reviewing it. "
    "We do not yet have verified reference material for this topic, so a human reviewer must add or approve guidance before this reply is sent."
)
