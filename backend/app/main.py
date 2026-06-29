import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from app.api.projects import agents_router, router as projects_router
from app.api.stream import router as stream_router
from app.core.config import settings
from app.core.logging import get_logger
from app.db.mongo import close_mongo, get_client, init_indexes
from app.db.redis import close_redis, get_redis
from app.orchestrator.manager import start_workers, stop_workers

logger = get_logger("main")
START_TIME = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("PlanForge backend starting")
    await init_indexes()
    start_workers()
    logger.info("Orchestrator workers started (%d)", settings.worker_count)
    yield
    await stop_workers()
    await close_redis()
    await close_mongo()
    logger.info("PlanForge backend shut down")


app = FastAPI(
    title="PlanForge Backend API",
    description="Orchestration layer for the PlanForge AI SDLC platform",
    version=settings.app_version,
    docs_url=None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects_router)
app.include_router(agents_router)
app.include_router(stream_router)


@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    response = get_swagger_ui_html(openapi_url=app.openapi_url, title=app.title + " - Swagger UI")
    dark_css = """
    <style>
        html { filter: invert(90%) hue-rotate(180deg); background-color: white; }
        img, svg { filter: invert(100%) hue-rotate(180deg); }
        .swagger-ui .microlight { filter: invert(100%) hue-rotate(180deg); }
    </style>
    """
    html_content = response.body.decode("utf-8").replace("</head>", f"{dark_css}</head>")
    return HTMLResponse(content=html_content, status_code=response.status_code)


class HealthResponse(BaseModel):
    status: str
    version: str
    uptime_seconds: float
    dependencies: dict


@app.get("/health", response_model=HealthResponse, status_code=status.HTTP_200_OK)
async def health_check():
    dependencies = {"redis": "unknown", "mongodb": "unknown"}
    try:
        await get_redis().ping()
        dependencies["redis"] = "healthy"
    except Exception as e:
        dependencies["redis"] = f"unhealthy: {str(e)}"
    try:
        await get_client().admin.command("ismaster")
        dependencies["mongodb"] = "healthy"
    except Exception as e:
        dependencies["mongodb"] = f"unhealthy: {str(e)}"

    overall = "degraded" if any("unhealthy" in v for v in dependencies.values()) else "healthy"
    return HealthResponse(
        status=overall, version=settings.app_version, uptime_seconds=time.time() - START_TIME, dependencies=dependencies
    )


@app.get("/")
async def root():
    return {"message": "PlanForge Backend API. See /docs for API documentation."}
