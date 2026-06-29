"""Backend configuration, sourced from environment variables."""
from __future__ import annotations

import os
from dataclasses import dataclass, field


def _csv(name: str, default: str) -> list[str]:
    return [x.strip() for x in os.getenv(name, default).split(",") if x.strip()]


@dataclass(frozen=True)
class Settings:
    app_version: str = "1.0.0"
    redis_url: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
    mongo_url: str = os.getenv("MONGO_URL", "mongodb://mongodb:27017")
    mongo_db: str = os.getenv("MONGO_DB", "planforge")
    ai_services_url: str = os.getenv("AI_SERVICES_URL", "http://ai-services:8001")

    # Orchestration
    analyze_queue: str = "queue:analyze"
    worker_count: int = int(os.getenv("ORCHESTRATOR_WORKERS", "1"))
    run_timeout_seconds: int = int(os.getenv("RUN_TIMEOUT_SECONDS", "1800"))
    event_buffer_ttl_seconds: int = int(os.getenv("EVENT_BUFFER_TTL_SECONDS", "86400"))

    cors_origins: list[str] = field(
        default_factory=lambda: _csv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3100")
    )


settings = Settings()
