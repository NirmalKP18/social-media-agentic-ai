import time
import unittest

from fastapi.testclient import TestClient

import service
from agents.retrieval_agent import embeddings

POSTS = [
    {"id": "1", "platform": "x", "author": "Alex", "content": "I need a refund, support is slow and my order is broken", "engagement": {"likes": 120}},
    {"id": "2", "platform": "facebook", "author": "Sam", "content": "Great team, very helpful and fast!", "engagement": {"likes": 8}},
]


@unittest.skipUnless(embeddings.is_available(), "embedding model unavailable")
class ServiceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(service.app)
        cls.created_ids = []

    @classmethod
    def tearDownClass(cls):
        for document_id in cls.created_ids:
            cls.client.delete(f"/knowledge/documents/{document_id}")

    def test_health_reports_knowledge_stats(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertIn("knowledge", response.json())

    def test_pipeline_uses_knowledge_base_for_grounding(self):
        created = self.client.post(
            "/knowledge/documents",
            json={
                "title": "Refund policy",
                "text": "Customers can request a refund within 30 days of purchase by contacting support with their order id.",
                "source": "handbook",
            },
        ).json()["document"]
        self.created_ids.append(created["id"])

        payload = self.client.post("/run", json={"query": "refund policy", "posts": POSTS, "limit": 5}).json()

        self.assertFalse(payload["insight"]["insufficientEvidence"])
        self.assertTrue(payload["insight"]["generation"]["groundedOnKnowledge"])
        self.assertGreater(len(payload["insight"]["knowledgeSources"]), 0)
        self.assertEqual(payload["insight"]["review"]["status"], "pending")

    def test_job_reaches_completed_state(self):
        run = self.client.post("/run", json={"query": "support", "posts": POSTS, "limit": 5}).json()
        job_id = run["job"]["id"]
        statuses = [transition["status"] for transition in run["job"]["transitions"]]
        self.assertEqual(statuses[0], "pending")
        self.assertEqual(statuses[-1], "completed")
        self.assertIn("analyzing", statuses)
        self.assertIn("retrieving", statuses)
        self.assertIn("generating", statuses)

        fetched = self.client.get(f"/jobs/{job_id}").json()
        self.assertEqual(fetched["job"]["status"], "completed")

    def test_async_run_reports_stage_progress_and_result(self):
        started = self.client.post(
            "/run/async", json={"query": "async support", "posts": POSTS, "limit": 5}
        )
        self.assertEqual(started.status_code, 202)
        job_id = started.json()["job"]["id"]
        self.assertEqual(started.json()["job"]["transitions"][0]["status"], "pending")

        deadline = time.time() + 30
        payload = None
        while time.time() < deadline:
            payload = self.client.get(f"/jobs/{job_id}").json()
            if payload["job"]["status"] in ("completed", "failed") and payload.get("result") is not None:
                break
            time.sleep(0.2)

        self.assertEqual(payload["job"]["status"], "completed")
        self.assertIsNotNone(payload["result"])
        self.assertEqual(payload["job"]["summary"]["analyses"], 2)

    def test_duplicate_post_ids_are_rejected(self):
        response = self.client.post("/run", json={"query": "x", "posts": [POSTS[0], POSTS[0]]})
        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()
