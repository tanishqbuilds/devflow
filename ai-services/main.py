import os
import time
import uvicorn
from fastapi import FastAPI, status
from pydantic import BaseModel
import redis.asyncio as aioredis
from motor.motor_asyncio import AsyncIOMotorClient

from fastapi.openapi.docs import get_swagger_ui_html

app = FastAPI(
    title="Devflow AI Services API",
    description="AI Orchestration and Agent Services for Devflow",
    version="1.0.0",
    docs_url=None,  # Disable default docs
)

from fastapi.responses import HTMLResponse

@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    response = get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " - Swagger UI",
    )
    # Applying a post-processing CSS filter to invert colors for a perfect dark mode
    # This guarantees the layout remains 100% default and unbroken
    dark_css = """
    <style>
        html { filter: invert(90%) hue-rotate(180deg); background-color: white; }
        img, svg { filter: invert(100%) hue-rotate(180deg); }
        .swagger-ui .microlight { filter: invert(100%) hue-rotate(180deg); }
    </style>
    """
    html_content = response.body.decode("utf-8").replace("</head>", f"{dark_css}</head>")
    return HTMLResponse(content=html_content, status_code=response.status_code)



# Configuration from env with fallback defaults
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongodb:27017")
APP_VERSION = "1.0.0"

class HealthResponse(BaseModel):
    status: str
    version: str
    uptime_seconds: float
    dependencies: dict

# Track startup time for uptime calculation
START_TIME = time.time()

@app.get("/health", response_model=HealthResponse, status_code=status.HTTP_200_OK)
async def health_check():
    dependencies = {
        "redis": "unknown",
        "mongodb": "unknown",
        "llm": "unknown"
    }
    
    # Check Redis
    try:
        r = aioredis.from_url(REDIS_URL, socket_timeout=2.0)
        await r.ping()
        await r.close()
        dependencies["redis"] = "healthy"
    except Exception as e:
        dependencies["redis"] = f"unhealthy: {str(e)}"
        
    # Check MongoDB
    try:
        client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=2000)
        await client.admin.command('ismaster')
        dependencies["mongodb"] = "healthy"
    except Exception as e:
        dependencies["mongodb"] = f"unhealthy: {str(e)}"
        
    # Check LLM (Ollama or Cloud OpenAI)
    LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
    LLM_MODEL = os.getenv("LLM_MODEL", "mistral")
    
    if LLM_PROVIDER.lower() == "ollama":
        try:
            import httpx
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get(f"{OLLAMA_BASE_URL.rstrip('/')}/api/tags")
                if resp.status_code == 200:
                    models_data = resp.json().get("models", [])
                    available_models = [m.get("name", "") for m in models_data]
                    if any(LLM_MODEL in name for name in available_models):
                        dependencies["llm"] = f"healthy (Ollama - {LLM_MODEL} loaded)"
                    else:
                        dependencies["llm"] = f"degraded (Ollama active but {LLM_MODEL} model not pulled. Available: {available_models})"
                else:
                    dependencies["llm"] = f"unhealthy: Ollama status {resp.status_code}"
        except Exception as e:
            dependencies["llm"] = f"unhealthy: Cannot reach Ollama at {OLLAMA_BASE_URL} ({str(e)})"
    else:
        dependencies["llm"] = "healthy (configured for cloud OpenAI API)"
        
    overall_status = "healthy"
    if any("unhealthy" in v for v in dependencies.values()):
        overall_status = "degraded"
        
    return HealthResponse(
        status=overall_status,
        version=APP_VERSION,
        uptime_seconds=time.time() - START_TIME,
        dependencies=dependencies
    )

@app.get("/")
async def root():
    return {"message": "Welcome to Devflow AI Services API. Access /docs for API documentation."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
