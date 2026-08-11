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
    database_url: str = os.getenv(
        "DATABASE_URL", "postgresql://devflow:devflow@postgres:5432/devflow"
    )
    ai_services_url: str = os.getenv("AI_SERVICES_URL", "http://ai-services:8001")
    clerk_secret_key: str = os.getenv("CLERK_SECRET_KEY", "")
    clerk_issuer_url: str = os.getenv("CLERK_ISSUER_URL", "").rstrip("/")
    bypass_auth: bool = os.getenv("BYPASS_AUTH", "true").lower() in ("true", "1", "yes")
    unlimited_credentials: bool = os.getenv("UNLIMITED_CREDENTIALS", "false").lower() in ("true", "1", "yes")

    # Orchestration
    analyze_queue: str = "queue:analyze"
    worker_count: int = int(os.getenv("ORCHESTRATOR_WORKERS", "1"))
    run_timeout_seconds: int = int(os.getenv("RUN_TIMEOUT_SECONDS", "1800"))
    event_buffer_ttl_seconds: int = int(os.getenv("EVENT_BUFFER_TTL_SECONDS", "86400"))

    cors_origins: list[str] = field(
        default_factory=lambda: _csv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3100,http://127.0.0.1:3000,http://127.0.0.1:3100")
    )


settings = Settings()
