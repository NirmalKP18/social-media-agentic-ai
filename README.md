# Social Media Agentic AI System

An end-to-end intelligence application that collects permitted/public social posts, analyzes text, retrieves evidence, generates grounded reports and response drafts, and keeps every response behind human approval.

## Features

- Registration/login with bcrypt passwords, JWTs, protected APIs, ownership checks, and production secret validation.
- Normalized social-post collection with platform, source ID, timestamp, and engagement metadata.
- Sentiment score/confidence, entity/topic extraction, intent, Plutchik emotion, priority scoring (low/medium/high/urgent), and named-entity recognition.
- Local semantic retrieval with Sentence-Transformers embeddings and a FAISS vector index, with knowledge-base evidence and a lexical fallback.
- Four-stage workflow: collection -> NLP analysis -> semantic retrieval -> grounded insight generation, tracked as a persistent job with visible states.
- Optional Gemini generation with structured output, timeout handling, prompt-injection boundary, and a labelled local fallback.
- Admin-only knowledge base (add/delete/reindex/upload documents) that grounds agent evidence; regular users see the cited sources on insights but no management controls.
- Per-mention pipeline runs: the four agents process a single mention end-to-end (clean → analyze → rank evidence + knowledge → generated draft) with per-agent execution logs and a render-ready detail view.
- Dashboard metrics, negative-sentiment alerts, reports, draft approve/edit/reject controls, audit logs, an agent-log trace screen (admin), and a live runtime Settings screen.

`user` is the normal workspace role and records are owner-isolated. `reviewer` shares the workspace and reviews generated drafts. `admin` additionally manages the shared knowledge base and sees the cross-user agent-execution log; both are enforced by the API (`requireAdmin`) and driven by the UI.

## Team Responsibilities

### Member 1 — Frontend + Insight Generation
GitHub: @sahilhaq2003
Owned paths:
- `frontend/`
- `ai-services/agents/generation_agent/`

### Member 2 — Backend + Collection Agent
GitHub: @NirmalKP18
Owned paths:
- `backend/`
- `ai-services/agents/collection_agent/`

### Member 3 — NLP Agent
GitHub: @theuni03
Owned paths:
- `ai-services/agents/analysis_agent/`

### Member 4 — Retrieval/RAG Agent
GitHub: @PoornaviSina
Owned paths:
- `ai-services/agents/retrieval_agent/`
- `ai-services/knowledge_base/`


## Architecture

```text
React UI -> Express API -> MongoDB
                 |
                 +-> Python agent service (FastAPI): collection -> NLP -> retrieval -> insight
                 |      +-> Sentence-Transformers embeddings + FAISS knowledge index (local)
                 |      +-> persistent job store with pipeline states
                 +-> alerts / persistence / audit log
                 +-> Gemini/local generation -> pending human review
```

The Express backend is the public API and persistence layer. Python is the authoritative compute engine: on boot the backend auto-starts the FastAPI agent service (`ai-services/service.py`) and calls it over HTTP. If the service and the CLI spawn both fail, the backend falls back to its retained Node-only pipeline.

`POST /api/workflow/run` analyzes the user's posts, retrieves evidence for a query, generates an evidence-backed draft, and returns each agent stage's result. It never publishes content — every draft stays `pending` until a human approves or rejects it.

## Stack and prerequisites

- React 19, React Router, Axios, Vite
- Node.js 18+, Express 5, Mongoose, MongoDB
- Python 3.10+ with `sentence-transformers`, `faiss-cpu`, `numpy`, `fastapi`, `uvicorn` (see `ai-services/requirements.txt`)
- Optional Gemini API key (the grounded template generator works offline without it)
- Node built-in test runner and Python `unittest`

## Install and configure

From the repository root (PowerShell):

```powershell
cd backend
npm install
Copy-Item .env.example .env
cd ..\frontend
npm install
Copy-Item .env.example .env
cd ..\ai-services
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Use `cp .env.example .env` on macOS/Linux, and `.venv/bin/python` instead of `.venv\Scripts\python.exe`.

Backend `backend/.env`:

```dotenv
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/social-media-agentic-ai
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.6-flash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
LLM_TIMEOUT_MS=15000
PYTHON_SERVICE_AUTOSTART=true
PYTHON_SERVICE_URL=http://127.0.0.1:8000
PYTHON_SERVICE_HOST=127.0.0.1
PYTHON_SERVICE_PORT=8000
PYTHON_SERVICE_TIMEOUT_MS=15000
PYTHON_PIPELINE_TIMEOUT_MS=60000
PYTHON_SERVICE_START_TIMEOUT_MS=45000
PYTHON_COMMAND=
PYTHON_AGENT_TIMEOUT_MS=15000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
```

Leave `PYTHON_COMMAND` empty to auto-detect `ai-services/.venv`; set it to an explicit interpreter path if needed. The first embedding request downloads `sentence-transformers/all-MiniLM-L6-v2` (~90 MB) to the Hugging Face cache, so the very first run needs network access.

Frontend `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

When `GEMINI_API_KEY` is absent or the provider fails, the report records `local-fallback` and displays a warning. Never put secrets in frontend variables or committed files.

## Run

Start MongoDB, then use two terminals:

```powershell
cd backend
npm start
```

```powershell
cd frontend
npm run dev
```

The backend auto-starts the Python agent service on boot (disable with `PYTHON_SERVICE_AUTOSTART=false`). To run that service by hand instead:

```powershell
cd ai-services
.\.venv\Scripts\python.exe -m uvicorn service:app --host 127.0.0.1 --port 8000
```

Open `http://localhost:5173`; backend health is at `http://localhost:5000/api/health` and agent-service health at `http://127.0.0.1:8000/health`.

Seed demo users, sample posts, and a knowledge document (writes to your configured database):

```powershell
cd backend
npm run seed
```

This creates `admin@example.com / Admin12345` (admin) and `user@example.com / User12345` (analyst). Replace these before any real deployment.

## Demo flow

1. Sign in as the admin and add an authoritative document under **Knowledge**.
2. Add permitted/public sample posts under **Collection** (or use the seeded posts).
3. Enter an evidence query and run the agent workflow; the dashboard renders the four-agent pipeline (collection -> analysis -> retrieval -> generation) with each stage's output, the job id/status, and a link to the pending draft.
4. Inspect NLP analyses (sentiment, intent, emotion, priority, entities), ranked evidence, and generated alerts.
5. Open the insight, review the cited knowledge sources, edit the draft if needed, then approve or reject it.
6. Export the report as Markdown or JSON.

## API

All routes except health and auth require `Authorization: Bearer <token>`.

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | Authentication |
| GET/POST | `/api/posts` | List/collect posts |
| POST | `/api/analyses/posts/:postId` | Analyze a post |
| POST | `/api/retrieval` | Save a Top-K search |
| POST | `/api/insights` | Generate report and draft |
| PATCH | `/api/insights/:id/review` | Approve/reject an edited draft |
| GET/PATCH | `/api/alerts`, `/api/alerts/:id` | List/update alerts |
| GET | `/api/audit-logs` | Current user's action history |
| POST | `/api/workflow/run` | Integrated agent workflow (synchronous) |
| POST | `/api/workflow/runs` | Start the agent workflow asynchronously (returns a job id, 202) |
| GET | `/api/workflow/runs/:jobId` | Poll live agent stage; returns the finalized workflow when the job completes |
| GET | `/api/workflow/jobs`, `/api/workflow/jobs/:id` | Agent job states (admin) |
| GET/POST | `/api/knowledge` | List/add knowledge documents (admin) |
| GET | `/api/knowledge/stats`, `/api/knowledge/search` | Knowledge stats/search |
| POST | `/api/knowledge/upload` | Upload and index a `.txt`, `.md` or `.json` file (admin) |
| POST | `/api/knowledge/reindex` | Rebuild the knowledge index (admin) |
| DELETE | `/api/knowledge/:id` | Remove a knowledge document (admin) |
| POST | `/api/pipeline/process/:postId` | Run the full four-agent pipeline for one mention (Collect → Analyze → Retrieve → Generate) |
| GET | `/api/pipeline/runs`, `/api/pipeline/runs/:id` | List/get a pipeline run with its per-stage results |
| GET | `/api/agent-logs` | Agent execution trace (admin; filters: `agent`, `status`) |
| GET | `/api/agent-logs/pipeline/:runId` | Agent logs for one pipeline run (admin) |
| GET | `/api/settings` | Live runtime status: MongoDB, vector store, Python service, LLM, agents |

Responses use `{ "success": true, "message": "...", "data": ... }`; errors use `{ "success": false, "message": "..." }`. Knowledge management routes require the `admin` role; insight responses include `knowledgeSources` and `insufficientEvidence` for all authenticated users.

## Tests and evaluation

```powershell
cd backend
npm test
cd ..\ai-services
.\.venv\Scripts\python.exe -m unittest discover -s tests
cd ..\frontend
npm run build
```

Tests cover NLP behavior, retrieval ranking, dashboard aggregation, report export, validation, the Python agents (analysis, RAG, service, workflow), and the knowledge/validation paths. Model-quality metrics (precision, recall, F1/confusion matrix, Precision@K/Recall@K, and grounded-generation rubric scores) require an approved labelled dataset; do not fabricate them.

Run the Python pipeline directly against a sample file with:

```powershell
cd ai-services
.\.venv\Scripts\python.exe main.py sample.json
```

## Structure

```text
backend/src/{config,controllers,middleware,models,routes,services,utils}
backend/scripts/seed.js
ai-services/agents/{collection_agent,analysis_agent,retrieval_agent,generation_agent}/
ai-services/{orchestrator,shared}/, ai-services/service.py (FastAPI), ai-services/main.py (CLI)
ai-services/{settings,requirements}.py|txt, ai-services/tests/, ai-services/knowledge_base/
backend/test
frontend/src/{components,context,pages,routes,services,utils}
docs/architecture/audit-report.md
.env.example
README.md
```

## Security and responsible AI

Retrieved text is untrusted evidence, provider errors do not expose keys/stacks, provenance and warnings appear with drafts, generated content is never auto-published, review/alert actions are audited, and NLP labels are presented as uncertain signals rather than objective truth.

## Known limitations

- Data is entered from approved datasets/public sources; no direct platform connector is included because no permitted provider/API was specified.
- Built-in NLP is English-oriented. Retrieval uses local `all-MiniLM-L6-v2` embeddings + FAISS, with a TF-IDF lexical fallback if the embedding model is unavailable, so quality depends on the local model.
- A labelled evaluation corpus is not bundled, so the team must run and record reproducible quality metrics on approved versioned data.
- Audit history is available by API but has no dedicated frontend page.
