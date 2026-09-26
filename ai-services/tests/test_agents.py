import unittest

from agents.analysis_agent.agent import AnalysisAgent
from agents.collection_agent.agent import CollectionAgent
from agents.collection_agent.schemas import Post


class CollectionAgentTests(unittest.TestCase):
    def test_normalizes_fields(self):
        posts = CollectionAgent().run([
            {"id": "1", "platform": "FACEBOOK", "author": " Sam ", "content": "Hello #launch", "engagement": {"likes": "5"}},
        ])
        self.assertEqual(posts[0].platform, "facebook")
        self.assertEqual(posts[0].author, "Sam")
        self.assertEqual(posts[0].engagement["likes"], 5)

    def test_rejects_duplicate_ids(self):
        with self.assertRaisesRegex(ValueError, "Duplicate post id"):
            CollectionAgent().run([
                {"id": "1", "content": "a"},
                {"id": "1", "content": "b"},
            ])

    def test_rejects_missing_content(self):
        with self.assertRaisesRegex(ValueError, "has no content"):
            CollectionAgent().run([{"id": "1", "content": ""}])


class AnalysisAgentTests(unittest.TestCase):
    def analyze(self, content, engagement=None):
        post = CollectionAgent().run([{"id": "1", "platform": "x", "author": "A", "content": content, "engagement": engagement or {}}])[0]
        return AnalysisAgent().analyze(post)

    def test_detects_negative_complaint(self):
        analysis = self.analyze("This is broken and I want a refund now", {"likes": 200})
        self.assertEqual(analysis.sentiment.label, "negative")
        self.assertEqual(analysis.intent, "complaint")
        self.assertIn(analysis.priority.level, {"high", "urgent"})
        self.assertTrue(analysis.priority.factors)

    def test_detects_positive_praise(self):
        analysis = self.analyze("I love this, amazing work team!")
        self.assertEqual(analysis.sentiment.label, "positive")
        self.assertEqual(analysis.intent, "praise")
        self.assertEqual(analysis.emotion.label, "joy")

    def test_extracts_typed_named_entities(self):
        analysis = self.analyze("Thanks Google and @support for fixing #outage, see https://example.com/status")
        types = {entity.type for entity in analysis.named_entities}
        self.assertIn("mention", types)
        self.assertIn("hashtag", types)
        self.assertIn("url", types)
        self.assertIn("organization", types)

    def test_classifies_questions_and_spam(self):
        self.assertEqual(self.analyze("How do I reset my password?").intent, "question")
        self.assertEqual(self.analyze("Click here for free followers, limited offer promo").intent, "spam")


if __name__ == "__main__":
    unittest.main()
