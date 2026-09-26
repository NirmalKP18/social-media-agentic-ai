# Python agents

Each workflow stage is implemented as an independent agent package:

- `agents/collection_agent/` validates and normalizes posts (`agent.py`, `cleaner.py`, `deduplicator.py`, `filters.py`, `schemas.py`).
- `agents/analysis_agent/` performs sentiment, topic, entity, and summary analysis (`sentiment.py`, `ner.py`, `classifier.py`).
- `agents/retrieval_agent/` ranks evidence with TF-IDF cosine similarity (`retriever.py`).
- `agents/generation_agent/` produces a grounded report and a draft kept in `pending` review (`generator.py`, `prompts.py`, `response_builder.py`).
- `agents/base.py` defines the shared `Agent` contract.
- `shared/contracts.py` holds cross-cutting helpers such as `utc_now`.
- `orchestrator/` owns agent ordering and typed handoffs (`coordinator.py`, `workflow_state.py`, `pipeline.py`).
- `main.py` exposes the pipeline as a dependency-free JSON CLI.

Run from this directory:

```powershell
python main.py sample.json
python -m unittest discover -s tests -v
```

Input schema:

```json
{
  "query": "customer support",
  "limit": 10,
  "posts": [
    {"id": "1", "platform": "facebook", "author": "Sam", "content": "Great support"}
  ]
}
```

The agents are intentionally database-agnostic. The Express application remains responsible for authentication, ownership, MongoDB persistence, audit logs, and human review.
