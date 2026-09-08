"""Backend configuration, sourced from environment variables."""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from dotenv import load_dotenv

# Load .env files from least-specific to most-specific so that the
# backend's own .env always wins over the root Docker Compose .env.
# Root .env is loaded first (low priority), then backend/.env overrides it.
_current_dir = Path(__file__).resolve().parent
_root_env = _current_dir.parents[2] / ".env"      # /devflow/.env  (Docker Compose defaults)
_service_env = _current_dir.parents[1] / ".env"   # /devflow/backend/.env  (service-level overrides)
_cwd_env = Path(".env")                            # fallback: wherever uvicorn was launched

# Load root .env first (base defaults, no override)
if _root_env.is_file():
    load_dotenv(_root_env, override=False)
# Then load service .env with override=True so it always wins
if _service_env.is_file():
    load_dotenv(_service_env, override=True)
elif _cwd_env.is_file() and _cwd_env.resolve() != _root_env.resolve():
    load_dotenv(_cwd_env, override=True)


def _csv(name: str, default: str) -> list[str]:
    return [x.strip() for x in os.getenv(name, default).split(",") if x.strip()]


@dataclass(frozen=True)
class Settings:
    app_version: str = "1.0.0"
    database_url: str = os.getenv(
        "DATABASE_URL", "postgresql://devflow:devflow@postgres:5432/devflow"
    )
    ai_services_url: str = os.getenv("AI_SERVICES_URL", "http://ai-services:8001")
    ai_internal_api_key: str = os.getenv("AI_INTERNAL_API_KEY", "")
    clerk_secret_key: str = os.getenv("CLERK_SECRET_KEY", "")
    clerk_issuer_url: str = os.getenv("CLERK_ISSUER_URL", "").rstrip("/")
    bypass_auth: bool = os.getenv("BYPASS_AUTH", "true").lower() in ("true", "1", "yes")
    unlimited_credentials: bool = os.getenv("UNLIMITED_CREDENTIALS", "false").lower() in ("true", "1", "yes")

    # Resend Email Configuration
    resend_api_key: str = os.getenv("RESEND_API_KEY", "")
    resend_from_email: str = os.getenv("RESEND_FROM_EMAIL", "Devflow <onboarding@resend.dev>")
    app_url: str = os.getenv("APP_URL", "http://localhost:3000")

    # Orchestration
    analyze_queue: str = "queue:analyze"
    worker_count: int = int(os.getenv("ORCHESTRATOR_WORKERS", "1"))
    run_timeout_seconds: int = int(os.getenv("RUN_TIMEOUT_SECONDS", "1800"))
    event_buffer_ttl_seconds: int = int(os.getenv("EVENT_BUFFER_TTL_SECONDS", "86400"))

    cors_origins: list[str] = field(
        default_factory=lambda: _csv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3100,http://127.0.0.1:3000,http://127.0.0.1:3100")
    )


settings = Settings()
