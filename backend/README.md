# Devflow Backend API ⚙️

The backend service serves as the core coordinator for the Devflow system. It exposes REST and WebSocket APIs to the frontend and acts as the data-persistence layer, interacting with MongoDB and Redis.

---

## 🛠️ Technology Stack

- **Framework**: FastAPI (Python 3.11-slim base image)
- **ASGI Server**: Uvicorn
- **Object Mapping / Schemas**: Pydantic v2
- **Database Driver**: Motor (Async driver for MongoDB) / PyMongo
- **Cache Client**: `redis-py` (asyncio support)

---

## 📁 Directory Structure

```
backend/
├── app/
│   ├── api/            # API Routers defining routes (e.g., project, task endpoints)
│   ├── core/           # Configuration management (settings, CORS setup)
│   ├── db/             # MongoDB and Redis connection clients
│   ├── middleware/     # Custom HTTP request/response middleware
│   ├── models/         # Pydantic schemas and database entity models
│   ├── orchestrator/   # Main business logic for workflow generation
│   ├── utils/          # General helper functions (formatting, validation)
│   └── main.py         # Entry point which initializes the FastAPI application
│
├── Dockerfile          # Multi-stage image build config
└── requirements.txt    # Declared Python library dependencies
```

---

## 🚦 Health Check & Swagger UI

FastAPI automatically generates interactive Swagger documentation, making it easy to test backend endpoints.

- **Swagger UI**: Visit `http://localhost:8000/docs` in your browser.
- **Health Endpoint**: Test service status with `GET /health`.

#### Health Response format:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 320.15,
  "dependencies": {
    "redis": "healthy",
    "mongodb": "healthy"
  }
}
```

If either Redis or MongoDB fails to reply within the timeout period, the health status will change to `"degraded"` and report the specific error under the failing dependency.

---

## 🚀 Local Development Setup

To run the backend service locally (without Docker):

### 1. Environment Configuration

Create a `.env` file in the `backend/` directory or set the variables in your environment:

```env
REDIS_URL=redis://localhost:6379/0
MONGO_URL=mongodb://localhost:27017
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

### 3. Run the API Server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will now be running at `http://localhost:8000`. You can inspect the Swagger docs at `/docs`.
