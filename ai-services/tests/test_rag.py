import pathlib
import shutil
import tempfile
import unittest

import numpy as np

import settings
from agents.retrieval_agent import embeddings, knowledge_base
from agents.retrieval_agent.vector_store import VectorStore


class ChunkTextTests(unittest.TestCase):
    def test_short_text_is_single_chunk(self):
        text = "Reference guidance about refunds and support procedures."
        self.assertEqual(knowledge_base.chunk_text(text), [text])

    def test_long_text_is_split_with_overlap(self):
        text = " ".join(f"Paragraph {index} about support policy and refund handling." for index in range(60))
        chunks = knowledge_base.chunk_text(text)
        self.assertGreater(len(chunks), 1)
        self.assertTrue(all(len(chunk) >= settings.MIN_CHUNK_SIZE for chunk in chunks))

    def test_blank_text_has_no_chunks(self):
        self.assertEqual(knowledge_base.chunk_text("   "), [])


class VectorStoreTests(unittest.TestCase):
    def test_add_search_remove_roundtrip(self):
        vectors = np.array([[1.0, 0.0, 0.0], [0.0, 1.0, 0.0]], dtype="float32")
        store = VectorStore(3)
        store.add(["a", "b"], vectors, [{"label": "a"}, {"label": "b"}])
        self.assertEqual(store.size, 2)

        results = store.search(np.array([1.0, 0.0, 0.0], dtype="float32"), 1)
        self.assertEqual(results[0][0], "a")
        self.assertAlmostEqual(results[0][1], 1.0, places=5)

        store.remove(["a"])
        self.assertEqual(store.size, 1)
        self.assertEqual(store.search(np.array([1.0, 0.0, 0.0], dtype="float32"), 1)[0][0], "b")

    def test_persistence_roundtrip(self):
        directory = pathlib.Path(tempfile.mkdtemp())
        try:
            store = VectorStore(3)
            store.add(["a"], np.array([[1.0, 0.0, 0.0]], dtype="float32"), [{"label": "a"}])
            store.save(directory / "index.faiss", directory / "meta.json")
            restored = VectorStore.load(directory / "index.faiss", directory / "meta.json")
            self.assertEqual(restored.size, 1)
            self.assertEqual(restored.search(np.array([1.0, 0.0, 0.0], dtype="float32"), 1)[0][0], "a")
        finally:
            shutil.rmtree(directory, ignore_errors=True)


@unittest.skipUnless(embeddings.is_available(), "embedding model unavailable")
class KnowledgeBaseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.directory = pathlib.Path(tempfile.mkdtemp())
        cls._original = (settings.DOCUMENTS_DIR, knowledge_base.INDEX_FILE, knowledge_base.METADATA_FILE, knowledge_base._store)
        settings.DOCUMENTS_DIR = cls.directory / "documents"
        settings.DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)
        knowledge_base.INDEX_FILE = cls.directory / "kb.faiss"
        knowledge_base.METADATA_FILE = cls.directory / "kb_meta.json"
        knowledge_base._store = None

    @classmethod
    def tearDownClass(cls):
        settings.DOCUMENTS_DIR, knowledge_base.INDEX_FILE, knowledge_base.METADATA_FILE, knowledge_base._store = cls._original
        shutil.rmtree(cls.directory, ignore_errors=True)

    def test_add_search_delete_document(self):
        document = knowledge_base.add_document(
            "Refund policy",
            "Customers may request a refund within 30 days of purchase. Contact support to start a refund.",
            source="handbook",
            tags=["refund", "policy"],
        )
        self.assertTrue(knowledge_base.INDEX_FILE.exists())

        hits = knowledge_base.search("how do I get my money back", top_k=3)
        self.assertGreater(len(hits), 0)
        self.assertEqual(hits[0].title, "Refund policy")

        self.assertTrue(knowledge_base.delete_document(document.id))
        self.assertEqual(knowledge_base.search("refund", top_k=3), [])

    def test_stats_report_indexed_chunks(self):
        knowledge_base.add_document("Warranty", "The warranty covers manufacturing defects for twelve months.")
        stats = knowledge_base.stats()
        self.assertTrue(stats["embeddingsInstalled"])
        self.assertGreaterEqual(stats["chunks"], 1)


if __name__ == "__main__":
    unittest.main()
