# PlanForge AI 🛰️

**An AI-native SDLC automation platform.** PlanForge turns a single raw idea into a
complete, execution-ready software delivery plan. Behind the scenes an autonomous
*AI organization* — CEO, Product Manager, System Architect, Sprint Planner, Risk
Analyst, Team/Delivery and Integration agents — works in parallel to produce an
executive summary, requirements, architecture (with a generated diagram), a sprint
backlog, a ranked risk register with mitigations, a staffing & cost plan, a delivery
roadmap, and an integration/deployment plan.

The experience is designed so the user feels **"an AI organization is working for me"** —
a live, streaming orchestration graph rather than a chat box.

### Product surface

- **Conversion-grade landing page** — scroll-reveal animations, an animated product preview,
  problem/how-it-works/features/social-proof/FAQ sections, and a 3-tier pricing page.
- **Migrate an existing project** — paste a spec/PRD, drop a Jira/Linear CSV, or point at a
  repo, and the same 8-agent org *reconstructs* a full plan (`POST /projects/migrate`).
- **PM command-center workspace** — grouped nav (Plan / Build / Deliver / Manage), a delivery
  KPI overview, a Kanban **Sprint Board** with capacity bars, an **AI Insights** delivery-health
  + RAID view, and a **Docs & Export** view (JSON / Markdown / PDF — no lock-in).
- **Grounded AI copilot** — a collapsible floating chat that answers from the project's real
  plan (`POST /projects/:id/chat`, on Groq's fast model).

---

## 🏗️ Architecture

```
                 ┌──────────────────────────────────────────────┐
   Browser ──────▶  frontend (Next.js 16, React 19, Tailwind v4) │  :3100
                 └───────────────┬──────────────────────────────┘
                                 │ REST + WebSocket (only the backend)
                 ┌───────────────▼──────────────────────────────┐
                 │  backend (FastAPI) — orchestration layer       │  :8010
                 │  • POST /projects/analyze  GET /projects/:id   │
                 │  • WS  /projects/:id/stream                    │
                 │  • Redis job queue + worker + event relay      │
                 │  • MongoDB persistence                         │
                 └───────┬───────────────────────┬───────────────┘
                         │ HTTP (workflow run)    │ Redis pub/sub (events)
                 ┌───────▼───────────────┐   ┌────▼─────┐   ┌──────────┐
                 │ ai-services (FastAPI)  │   │  Redis    │   │ MongoDB  │
                 │ • 8 agents + prompts   │   │ queue +   │   │ projects │
                 │ • workflow engine      │   │ pub/sub + │   └──────────┘
                 │ • model router         │   │ buffer    │
                 └───────┬───────────────┘   └──────────┘
                         │ OpenAI-compatible API
                 ┌───────▼───────────────┐
                 │ Ollama (local LLM)     │  :11434
                 └────────────────────────┘
```

**Separation of concerns (as specified):**
- The **frontend never talks to ai-services** — only to the backend.
- The **backend is the orchestration layer**: REST API, Redis job queue + worker,
  WebSocket broadcasting, and MongoDB persistence.
- **ai-services owns the agents and the workflow engine** (the orchestration graph,
  parallel execution, structured outputs, the model router).

### The orchestration graph

```
CEO ─▶ Product Manager ─▶ System Architect ─┬▶ Sprint Planner ─┐
                                            ├▶ Risk Analyst     ├▶ Timeline ┐
                                            └▶ Team Allocation ─┘  Integration┘
```

Stages run sequentially; agents **within a stage run in parallel**. Each agent emits
events (`node_update`, `log`, `section_complete`, `progress`) to a Redis channel; the
backend persists them to MongoDB and relays them to the browser over a WebSocket, with
a durable replay buffer so late-joining clients see the whole run.

### The AI organization (agents)

| Agent | Role | Produces |
| --- | --- | --- |
| CEO | Chief Vision Officer | Executive summary, complexity, duration, team size |
| Product Manager | Senior PM | Functional/non-functional requirements, user stories |
| System Architect | Principal Architect | Layered architecture + component diagram |
| Sprint Planner | Agile Delivery Lead | Epics, tasks, estimates, sprints |
| Risk Analyst | Risk Analyst | Risks across 5 dimensions + mitigations |
| Team Allocation | VP Engineering | Staffing plan (cost is derived from this) |
| Timeline | Delivery Manager | Milestones & roadmap (mvp→beta→prod→scaling) |
| Integration | Platform/DevOps | Integrations, deployment plan, CI/CD |

Every agent uses a **dedicated prompt** (`ai-services/prompts/`), a **JSON-schema-validated
structured output** (`ai-services/agents/schemas.py`), the **model router**
(`ai-services/llm/router.py`), and is **independently testable** via
`POST /agents/{id}/run`.

---

## 🚀 Running it

### Prerequisites
- Docker + Docker Compose
- Node.js 20+ (only if running the frontend locally for dev)
- [Ollama](https://ollama.com) model cache — the compose Ollama service mounts `~/.ollama`,
  so any model you have pulled is reused.

### 1. Bring up the backend stack

```bash
make up-backend     # backend, ai-services, redis, mongodb, ollama
# or the full stack incl. the dockerized frontend:
make build-dev      # docker compose up --build
```

### 2. Pick your LLM provider

**Default: Groq Cloud** — fast and a generous free tier, so no GPU/disk is needed and a full
8-agent run completes in **~25–30 s**. Set your key in `.env` (`GROQ_API=gsk_...`) and the
agents are routed across two free-tier models automatically:

```env
LLM_PROVIDER=groq
LLM_MODEL=llama-3.3-70b-versatile     # default
LLM_MODEL_SMART=llama-3.3-70b-versatile   # coherence-setting agents (CEO/PM/Architect/Timeline)
LLM_MODEL_FAST=llama-3.1-8b-instant       # parallel / downstream agents — high free-tier headroom
```

The smart/fast split keeps quality where it matters while staying inside Groq's free
tokens-per-minute limits (the parallel planning agents run on the high-limit 8B model).
`max_tokens` budgets are sized to each schema to minimise token usage.

**Alternative: fully local with Ollama** — set `LLM_PROVIDER=ollama` and a local model
(e.g. `qwen2.5:3b`); `make models` pulls it. CPU runs are slower (~8–12 min) but the UI
streams progress throughout. Per-agent `LLM_MODEL_<AGENT>` overrides work for both providers;
qwen3 thinking is auto-disabled via `/no_think`.

### 3. Run the frontend

```bash
make frontend-dev   # Next.js dev server on http://localhost:3100
```

Then open **http://localhost:3100**, type an idea (e.g. *"Build an AI-powered recruitment
platform for startups."*), and watch the AI organization work.

### Endpoints

| Component | URL |
| --- | --- |
| Frontend | http://localhost:3100 |
| Backend API + Swagger | http://localhost:8010/docs |
| AI Services + Swagger | http://localhost:8011/docs |
| MongoDB | mongodb://localhost:27017 |
| Redis | redis://localhost:6380 |
| Ollama | http://localhost:11434 |

> Ports are intentionally offset (3100/8010/8011/6380) so PlanForge runs alongside other
> local stacks without colliding on 3000/8000/6379.

---

## 🔌 API

```http
POST /projects/analyze        { "idea": "...", "title"?: "..." }            -> { project_id, status }
POST /projects/migrate        { "source": "spec|file|repo", "content": "..." } -> { project_id, status }
GET  /projects/:id            -> full project document (all sections + orchestration state)
GET  /projects                -> list
POST /projects/:id/chat       { "message": "...", "history": [...] }         -> { reply }  (grounded copilot)
GET  /agents                  -> the AI org roster
WS   /projects/:id/stream     -> snapshot + buffered replay + live orchestration events
```

Health checks: `GET /health` on both `:8010` and `:8011` (reports redis / mongodb / llm).

---

## 🗄️ Persistence

- **MongoDB** (`planforge.projects`): the canonical project documents + orchestration state.
- **Redis**: the analysis job queue (`queue:analyze`), the per-project pub/sub event
  channel (`events:{id}`), and a durable event buffer (`events:{id}:buffer`) for WS replay.
- **Auth**: Clerk when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set, with a working mock-user
  fallback otherwise (so the app runs out-of-the-box).

---

## 🛠️ Makefile

| Command | Action |
| --- | --- |
| `make dev` | `docker compose up` |
| `make build-dev` | build + up (full stack) |
| `make up-backend` | up only backend/ai/redis/mongo/ollama |
| `make frontend-dev` | run Next.js locally on :3100 |
| `make models` | pull `$(LLM_MODEL)` into Ollama |
| `make health` | curl both `/health` endpoints |
| `make logs` / `down` / `prune` | logs / teardown / cleanup |
| `make backend` / `ai` / `mongo` / `redis` | open a shell/CLI in a container |

---

## ✅ Quality

Every feature includes typing, validation (Pydantic / TypeScript), structured logging,
and error handling. Agent failures are isolated — the workflow is resilient and continues
producing every section it can. There are no mock/stub implementations in the runtime path.
