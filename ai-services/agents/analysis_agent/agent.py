"""NLP analysis agent: sentiment, emotion, topics, entities, priority, and summaries."""

try:
    from agents.base import Agent
    from agents.collection_agent.schemas import Post
except ImportError:
    from ..base import Agent
    from ..collection_agent.schemas import Post
from .classifier import extract_topics, summarize, tokenize
from .emotion import detect_emotions
from .intent import classify_intent
from .ner import extract_named_entities
from .priority import compute_priority
from .schemas import Analysis
from .sentiment import analyze_sentiment


class AnalysisAgent(Agent):
    name = "nlp"

    def _analyze_text(self, text: str):
        tokens = tokenize(text)
        sentiment = analyze_sentiment(tokens)
        entities, named_entities = extract_named_entities(text)
        emotion = detect_emotions(tokens)
        intent = classify_intent(text, tokens)
        topics = extract_topics(tokens)
        summary = summarize(text)
        return {
            "tokens": tokens,
            "sentiment": sentiment,
            "entities": entities,
            "named_entities": named_entities,
            "emotion": emotion,
            "intent": intent,
            "topics": topics,
            "summary": summary,
        }

    def analyze(self, post: Post) -> Analysis:
        main = self._analyze_text(post.content)

        comment_analyses = []
        conversation_counts = {"positive": 0, "negative": 0, "neutral": 0, "questions": 0, "complaints": 0, "score": 0.0}

        for comment in getattr(post, "comments", []) or []:
            c_content = comment.get("content") or ""
            c_author = comment.get("author") or "user"
            c_res = self._analyze_text(c_content)
            
            c_analysis = {
                "author": c_author,
                "content": c_content,
                "sentiment": c_res["sentiment"].as_dict() if hasattr(c_res["sentiment"], "as_dict") else {
                    "label": c_res["sentiment"].label,
                    "score": c_res["sentiment"].score,
                    "confidence": c_res["sentiment"].confidence,
                },
                "topics": c_res["topics"],
                "entities": c_res["entities"],
                "intent": c_res["intent"],
                "emotion": {"label": c_res["emotion"].label, "scores": c_res["emotion"].scores},
                "summary": c_res["summary"],
            }
            comment_analyses.append(c_analysis)

            label = c_res["sentiment"].label
            conversation_counts[label] = conversation_counts.get(label, 0) + 1
            conversation_counts["score"] += c_res["sentiment"].score
            if c_res["intent"] == "question" or "?" in c_content:
                conversation_counts["questions"] += 1
            elif c_res["intent"] == "complaint" or label == "negative":
                conversation_counts["complaints"] += 1

        total_comments = len(comment_analyses)
        avg_score = round(conversation_counts["score"] / total_comments, 3) if total_comments > 0 else 0.0
        backlash_ratio = round(conversation_counts["negative"] / total_comments, 3) if total_comments > 0 else 0.0

        conversation = {
            "totalComments": total_comments,
            "positive": conversation_counts.get("positive", 0),
            "negative": conversation_counts.get("negative", 0),
            "neutral": conversation_counts.get("neutral", 0),
            "questions": conversation_counts.get("questions", 0),
            "complaints": conversation_counts.get("complaints", 0),
            "averageScore": avg_score,
            "backlashRatio": backlash_ratio,
        }

        priority = compute_priority(post, main["sentiment"], main["emotion"])
        if backlash_ratio >= 0.4 or conversation_counts["complaints"] >= 2:
            priority.level = "urgent"
            priority.score = max(priority.score, 85)
            priority.factors.append("High comment backlash and multiple customer complaints detected")

        intent_obj = main["intent"]
        intent_str = intent_obj.primary if hasattr(intent_obj, "primary") else str(intent_obj)

        return Analysis(
            post.id,
            main["sentiment"],
            main["topics"],
            main["entities"],
            main["summary"],
            intent=intent_str,
            intent_detail=intent_obj if hasattr(intent_obj, "primary") else None,
            emotion=main["emotion"],
            priority=priority,
            named_entities=main["named_entities"],
            comment_analyses=comment_analyses,
            conversation=conversation,
        )

    def run(self, payload: list[Post]) -> list[Analysis]:
        return [self.analyze(post) for post in payload]

