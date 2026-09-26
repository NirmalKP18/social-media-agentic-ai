import unittest

from orchestrator.pipeline import Pipeline


class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.posts = [
            {"id": "p1", "platform": "facebook", "author": "A", "content": "Great support and fast service #launch", "engagement": {"likes": 5}},
            {"id": "p2", "platform": "x", "author": "B", "content": "Support is slow and frustrating @brand", "engagement": {"shares": 2}},
        ]

    def test_agents_are_separate_and_handoff_typed_results(self):
        result = Pipeline().run(self.posts, "support service")
        self.assertEqual(set(result["agents"]), {"collection", "nlp", "retrieval", "insight"})
        self.assertEqual(result["agents"]["nlp"]["analyses"], 2)
        self.assertGreater(len(result["evidence"]), 0)
        self.assertEqual(result["insight"]["review"]["status"], "pending")

    def test_rejects_empty_query(self):
        with self.assertRaisesRegex(ValueError, "query is required"):
            Pipeline().run(self.posts, " ")

    def test_rejects_duplicate_post_ids(self):
        with self.assertRaisesRegex(ValueError, "Duplicate post id"):
            Pipeline().run([self.posts[0], self.posts[0]], "support")


if __name__ == "__main__":
    unittest.main()
