# Devflow — AI-Powered Autonomous SDLC Architecture Platform

Devflow is an autonomous AI software architecture and delivery planning platform. You provide a project idea, and an autonomous organization of specialized AI agents (CEO, Product Manager, System Architect, Sprint Planner, Risk Analyst, Team Allocation Lead, Timeline Manager, and DevOps/Integration Engineer) plans, designs, estimates, and structures the complete project specification in real-time.

```
                    ┌──────────────────────────────────────────────────┐
                    │  frontend (Next.js 15 + Tailwind + Lucide Icons) │  :3000
                    └─────────────────────────┬────────────────────────┘
                                              │ REST + WebSocket
                                              ▼
                    ┌──────────────────────────────────────────────────┐
                    │  backend (FastAPI) — orchestration layer         │  :8000
                    │  • POST /projects/analyze  GET /projects/:id     │
                    │  • WS  /projects/:id/stream                      │
                    │  • In-memory job queue + event bus + buffer      │
                    │  • Supabase (PostgreSQL) persistence             │
                    └────────┬────────────────────────────────┬────────┘
                             │ HTTP Stream (SSE / NDJSON)     │ SSL Connection Pool
                    ┌────────▼──────────────┐         ┌───────▼──────────────┐
                    │ ai-services (FastAPI) │         │  Supabase (Cloud)    │
                    │ • 8 agents + prompts  │         │  PostgreSQL Database │
                    │ • workflow engine     │         └──────────────────────┘
                    │ • model router        │
                    └────────┬──────────────┘
                             │ OpenAI-compatible API
                    ┌────────▼──────────────┐
                    │ Groq Cloud API        │  (or Ollama / OpenAI API)
                    └───────────────────────┘
```

---

## ⚡ Quickstart: Running Devflow

Devflow can be run **natively without Docker** (ideal for local development) or **with Docker** (single-command containerized stack).

---

### Option 1: Running Without Docker (Native Local Mode)

#### 1. Prerequisites
- **Python 3.10+** (Python 3.11 or 3.12 recommended)
- **Node.js 18+** or **Node.js 20+** with `npm`
- **Supabase Database URL** (`DATABASE_URL`)
- **Groq API Key** (`GROQ_API_KEY`)

#### 2. Configure Environment
Copy `.env.example` to `.env` (or update `.env` in the project root):
```bash
cp .env.example .env
```

Ensure the following variables are set in `.env`:
```env
# Supabase PostgreSQL Connection URL
DATABASE_URL=postgresql://postgres:[PASSWORD]@[YOUR-HOST]:5432/postgres

# Groq LLM API Key (free tier available at https://console.groq.com)
GROQ_API_KEY=gsk_your_groq_api_key_here

# Service URLs for local execution
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
AI_SERVICES_URL=http://localhost:8001
```

#### 3. Install Dependencies

```bash
# 1. Backend dependencies
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ..

# 2. AI Services dependencies
cd ai-services
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ..

# 3. Frontend dependencies
cd frontend
npm install
cd ..
```

#### 4. Start the Services

Open 3 terminal windows (or tabs) and run:

**Terminal 1 — Backend API (:8000)**:
```bash
make local-backend
# or: cd backend && source .venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — AI Services (:8001)**:
```bash
make local-ai
# or: cd ai-services && source .venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 3 — Frontend UI (:3000)**:
```bash
make local-frontend
# or: cd frontend && npm run dev -- -p 3000
```

Open **http://localhost:3000** in your browser!

---

### Option 2: Running With Docker (Containerized Mode)

If you prefer using Docker:

```bash
# 1. Ensure .env has DATABASE_URL and GROQ_API_KEY
make dev

# 2. Or rebuild and start
make build-dev

# 3. Stop containers
make down
```

---

## 🧭 Service Endpoints

| Service | Local URL | Description |
| --- | --- | --- |
| **Frontend Web App** | http://localhost:3000 | Next.js interactive web app |
| **Backend API & Swagger** | http://localhost:8000/docs | FastAPI backend REST API |
| **AI Services & Swagger** | http://localhost:8001/docs | Autonomous agent microservice |
| **Backend Healthcheck** | http://localhost:8000/health | Database & AI service health check |
| **AI Services Healthcheck** | http://localhost:8001/health | Database & LLM health check |

---

## 🤖 The AI Organization (Agents)

```
CEO ─▶ Product Manager ─▶ System Architect ─┬▶ Sprint Planner ─┐
                                            ├▶ Risk Analyst     ├▶ Timeline ┐
                                            └▶ Team Allocation ─┘  Integration┘
```

| Agent | Role | Output Populated |
| --- | --- | --- |
| **CEO** | Chief Vision Officer | Executive summary, complexity, duration, budget estimation |
| **Product Manager** | Senior Product Lead | Functional & non-functional requirements, user stories |
| **System Architect** | Principal Architect | Architecture layers, component interactions & diagrams |
| **Sprint Planner** | Agile Delivery Lead | Epics, backlog tasks, story points, sprint roadmap |
| **Risk Analyst** | Risk & Security Analyst | Technical, operational, security risks & mitigations |
| **Team Allocation** | VP of Engineering | Team roles, staffing allocation & cost breakdown |
| **Timeline** | Delivery Manager | Phase roadmap (MVP → Beta → Production → Scaling) |
| **Integration** | Platform / DevOps | Third-party integrations, CI/CD pipeline, deployment plan |

---

## 🛠️ Makefile Reference

| Command | Description |
| --- | --- |
| `make local-backend` | Run FastAPI Backend locally on `:8000` with auto-reload |
| `make local-ai` | Run AI Services locally on `:8001` with auto-reload |
| `make local-frontend` | Run Next.js Frontend locally on `:3000` |
| `make dev` | Start Docker containers in the background |
| `make build-dev` | Rebuild and start Docker containers |
| `make health` | Query health endpoints across all services |
| `make logs` | Tail Docker container logs |
| `make down` | Stop and remove all Docker containers |
| `make prune` | Remove unused Docker resources |

---

## 🔒 Authentication & Database

- **Database**: Connects directly to **Supabase** (or any PostgreSQL instance) using async connection pooling (`asyncpg`) with automatic SSL. Database tables and indexes are initialized automatically on startup.
- **Authentication**: Powered by **Clerk**. Set `BYPASS_AUTH=true` in `.env` for local testing without authentication, or provide `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` for multi-user authentication.
- **Event Streaming**: Uses an in-memory async event broker with WebSocket streaming and late-joiner replay buffer — no Redis or external broker installation needed.
