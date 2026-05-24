# Devflow AI Services 🧠

The AI Services microservice handles the execution of autonomous agents and planning workflows. It coordinates specialized agents to analyze user project ideas, break down requirements, evaluate technical stack compatibility, estimate costs, assess project risks, and produce developer-friendly blueprints.

---

## 🛠️ Technology Stack

- **Framework**: FastAPI (Python 3.11-slim base image) running on Port **8001**
- **ASGI Server**: Uvicorn
- **AI Tooling Frameworks**: Langchain / Langgraph (or custom sequential DAG routers)
- **Database Driver**: Motor (Async driver for MongoDB)
- **Caching & Broker**: Redis

---

## 📁 Directory Structure

The internal module structure isolates agent design patterns:

```
ai-services/
├── agents/             # Specialized AI Agent implementations (e.g. Risk AI, Cost Estimator)
├── llm/                # LLM connectors (OpenAI, Anthropic, Gemini, local models)
├── memory/             # Session storage, context retrieval, and window systems
├── services/           # Helper business services for API endpoints
├── tools/              # Action tools used by agents (web searches, API calls, calculators)
├── utils/              # Helper utilities (text parsers, cleanups)
├── workflows/          # Workflow definitions (Agent graphs and orchestrators)
├── main.py             # FastAPI entry point, exposing Swagger UI on Port 8001
│
├── Dockerfile          # Container setup
└── requirements.txt    # Declared Python library dependencies
```

---

## 🚦 Health Check & Swagger UI

To help test and monitor agent APIs, this service runs a FastAPI endpoint on port `8001`.

- **Swagger UI**: Visit `http://localhost:8001/docs` in your browser.
- **Health Endpoint**: Test service health with `GET /health`.

#### Health Response format:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 150.2,
  "dependencies": {
    "redis": "healthy",
    "mongodb": "healthy"
  }
}
```

---

## 🚀 Local Development Setup

To run the AI services locally (without Docker):

### 1. Environment Configuration

Create a `.env` file in the `ai-services/` directory:

```env
REDIS_URL=redis://localhost:6379/0
MONGO_URL=mongodb://localhost:27017
# Add LLM API Keys here if necessary
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### 2. Set Up Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Run the Service

```bash
python main.py
```

The server will initialize and begin listening on `http://localhost:8001`. You can access the Swagger UI at `http://localhost:8001/docs`.
