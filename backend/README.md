# Devflow Backend API ⚙️

The backend coordinates authenticated REST and WebSocket APIs, persists Clerk users, projects, and AI responses in Supabase (PostgreSQL), and streams real-time AI generation events directly to connected clients.

---

## 🛠️ Technology Stack

- **Framework**: FastAPI (Python 3.11/3.12)
- **ASGI Server**: Uvicorn
- **Object Mapping / Schemas**: Pydantic v2
- **Database Driver**: asyncpg (PostgreSQL / Supabase with SSL)
- **Event Dispatch**: In-Memory Event Bus & Async Job Queue

---

## 📁 Directory Structure

```
backend/
├── app/
│   ├── api/            # API Routers (projects, streaming, users, workspaces)
│   ├── core/           # Configuration, authentication, and logging
│   ├── db/             # PostgreSQL / Supabase connection pooling & schema
│   ├── models/         # Pydantic schemas and database models
│   ├── orchestrator/   # Workflow management and event streaming
│   ├── services/       # In-memory event bus, projects, AI client
│   └── main.py         # FastAPI application entrypoint
│
├── Dockerfile          # Container build configuration
└── requirements.txt    # Declared Python library dependencies
```

---

## 🚦 Health Check & Swagger UI

- **Swagger UI**: Visit `http://localhost:8000/docs` in your browser.
- **Health Endpoint**: Test service status with `GET /health`.

#### Health Response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 12.4,
  "dependencies": {
    "database": "healthy",
    "ai_services": "healthy"
  }
}
```

---

## 🚀 Local Development Setup (Without Docker)

### 1. Environment Configuration

Ensure `backend/.env` or the root `.env` contains:
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[YOUR-HOST]:5432/postgres
AI_SERVICES_URL=http://localhost:8001
BYPASS_AUTH=true
```

### 2. Set Up Virtual Environment

```bash
# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Run the Backend API Server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# or from root: make local-backend
```

The API will be available at `http://localhost:8000`. Interactive docs are at `http://localhost:8000/docs`.
