"""Domain knowledge databases for Devflow specialist agents.

Provides authoritative, structured industry benchmarks, architectures, security
catalogs, rate cards, and agile metrics for high-quality agent outputs.
"""
from __future__ import annotations

from typing import Any

# ============================================================================
# 1. System Architect Knowledge Base
# ============================================================================
ARCHITECTURE_KNOWLEDGE_BASE: dict[str, Any] = {
    "tech_stacks": {
        "nextjs_fastapi_postgres": {
            "name": "Next.js + FastAPI + PostgreSQL + Redis",
            "tier": "Production-Grade Fullstack",
            "recommended_use": "Modern SaaS, AI applications, real-time dashboards",
            "concurrency_model": "Async ASGI + React Server Components",
            "scalability_rating": "Very High",
            "strengths": [
                "FastAPI asynchronous event loop handles high-throughput I/O",
                "Next.js App Router provides SSR, Turbopack, and edge rendering",
                "PostgreSQL JSONB provides hybrid relational + semi-structured storage",
                "Redis offers sub-millisecond session, cache, and WebSocket Pub/Sub",
            ],
            "recommended_libraries": [
                "asyncpg", "pydantic-v2", "tanstack-query", "tailwind-css", "lucide-react"
            ],
        },
        "python_microservices": {
            "name": "FastAPI + Celery/Redis + Postgres + Docker",
            "tier": "Enterprise Asynchronous",
            "recommended_use": "Background task heavy apps, AI workflow pipelines",
            "scalability_rating": "High",
            "strengths": [
                "Decoupled long-running LLM and background compute jobs",
                "Horizontal auto-scaling with Celery/Redis workers",
            ],
        },
        "node_microservices": {
            "name": "Node.js (NestJS / Express) + Prisma + Postgres",
            "tier": "Enterprise Monolith / Modular",
            "recommended_use": "Real-time collaboration, heavy TypeScript sharing",
            "scalability_rating": "High",
        },
    },
    "database_selection": {
        "relational_transactional": {
            "recommended": "PostgreSQL 16+",
            "use_case": "Users, billing, projects, ACID transactions, complex queries",
            "indexing_advice": "B-Tree on foreign keys & created_at; GIN on JSONB columns",
        },
        "cache_and_pubsub": {
            "recommended": "Redis 7+",
            "use_case": "Session storage, rate limiting, agent progress events, WebSockets",
        },
        "vector_search": {
            "recommended": "pgvector (Postgres extension) or Qdrant",
            "use_case": "Document embeddings, semantic search, RAG pipelines",
        },
        "document_blob": {
            "recommended": "S3-compatible Object Storage (MinIO / AWS S3) + Postgres JSONB",
            "use_case": "File uploads, large export artifacts, raw audit payloads",
        },
    },
}

# ============================================================================
# 2. Risk & Security Knowledge Base
# ============================================================================
SECURITY_RISK_CATALOG: dict[str, Any] = {
    "threats": [
        {
            "id": "SEC-AUTH-01",
            "category": "Authentication & Authorization",
            "threat": "Broken Object Level Authorization (BOLA / IDOR)",
            "severity": "CRITICAL",
            "mitigation": "Enforce project_id and user_id scoping at the database query level; use cryptographic tokens or JWT with short expiry.",
        },
        {
            "id": "SEC-INJ-02",
            "category": "Injection & Prompt Injection",
            "threat": "LLM Prompt Injection and Data Poisoning",
            "severity": "HIGH",
            "mitigation": "Isolate system prompts from untrusted user inputs; enforce structured Pydantic schema validation on all LLM responses.",
        },
        {
            "id": "SEC-RATE-03",
            "category": "Availability & Denial of Service",
            "threat": "API & LLM Token Exhaustion / DoS",
            "severity": "HIGH",
            "mitigation": "Redis sliding-window rate limiting per IP/User; strict token and timeout caps on upstream LLM requests.",
        },
        {
            "id": "SEC-DATA-04",
            "category": "Data Privacy & Compliance",
            "threat": "PII / Sensitive Data Exposure in Logs or LLM Payloads",
            "severity": "HIGH",
            "mitigation": "Redact Authorization headers and API keys in logging middleware; enforce TLS 1.3 in transit and AES-256 at rest.",
        },
    ],
    "compliance_standards": {
        "GDPR": "Right to erasure, data residency controls, encrypted user identifiers.",
        "SOC2": "Audit logs for all state-changing endpoints, role-based access control (RBAC).",
        "OWASP_TOP_10": "Input sanitization, parameterized queries (asyncpg), CORS restriction.",
    },
}

# ============================================================================
# 3. Agile Sprint & Velocity Knowledge Base
# ============================================================================
AGILE_VELOCITY_DATABASE: dict[str, Any] = {
    "story_point_benchmarks": {
        "1": {"description": "Trivial tweak, copy change, or config update", "typical_hours": "1-3 hrs"},
        "2": {"description": "Small component or straightforward CRUD endpoint", "typical_hours": "4-8 hrs"},
        "3": {"description": "Medium feature with UI + API integration", "typical_hours": "1-2 days"},
        "5": {"description": "Complex workflow, new database schema, or third-party integration", "typical_hours": "3-4 days"},
        "8": {"description": "High complexity architectural feature or core security subsystem", "typical_hours": "1 sprint week"},
        "13": {"description": "Too large — should be decomposed into smaller epics/stories", "typical_hours": "Epic level"},
    },
    "sprint_velocity_guidelines": {
        "small_team_3_engineers": {"average_velocity_points_per_sprint": 24, "buffer_percent": 15},
        "medium_team_5_engineers": {"average_velocity_points_per_sprint": 45, "buffer_percent": 20},
        "large_team_8_engineers": {"average_velocity_points_per_sprint": 75, "buffer_percent": 20},
    },
}

# ============================================================================
# 4. Team Compensation & Rate Card Knowledge Base
# ============================================================================
COMPENSATION_RATE_CARD: dict[str, Any] = {
    "roles": {
        "Principal System Architect": {
            "hourly_rate_usd": 150,
            "monthly_fte_usd": 18000,
            "core_skills": ["Distributed Systems", "Cloud Architecture", "Data Modeling", "High Availability"],
        },
        "Senior Fullstack Engineer": {
            "hourly_rate_usd": 110,
            "monthly_fte_usd": 13500,
            "core_skills": ["Next.js", "FastAPI / Node", "PostgreSQL", "API Design", "State Management"],
        },
        "Senior AI / ML Engineer": {
            "hourly_rate_usd": 135,
            "monthly_fte_usd": 16000,
            "core_skills": ["LangChain / LangGraph", "LLM Fine-tuning / RAG", "Prompt Engineering", "Evaluation"],
        },
        "DevOps / Platform Engineer": {
            "hourly_rate_usd": 115,
            "monthly_fte_usd": 14000,
            "core_skills": ["Docker", "Kubernetes", "CI/CD", "Terraform", "Monitoring (Prometheus/Grafana)"],
        },
        "QA / Test Automation Engineer": {
            "hourly_rate_usd": 85,
            "monthly_fte_usd": 10000,
            "core_skills": ["Playwright", "Pytest", "Integration Testing", "Load Testing (k6)"],
        },
        "Product Manager / Agile Delivery Lead": {
            "hourly_rate_usd": 105,
            "monthly_fte_usd": 13000,
            "core_skills": ["User Story Mapping", "Sprint Management", "Roadmapping", "Stakeholder Alignment"],
        },
    }
}

# ============================================================================
# 5. DevOps & Integration Knowledge Base
# ============================================================================
DEVOPS_INTEGRATION_CATALOG: dict[str, Any] = {
    "ci_cd_pipelines": {
        "github_actions": {
            "stages": [
                "1. Lint & Format (ruff, biome/eslint)",
                "2. Static Type Check (tsc, mypy/pyright)",
                "3. Unit & Integration Tests (pytest, vitest)",
                "4. Container Image Build & Multi-stage Cache Mounts",
                "5. Automated Deployment (Staging / Production)",
            ],
            "caching_strategy": "Docker Buildx layer caching + GitHub Actions cache",
        }
    },
    "observability_stack": {
        "metrics": "Prometheus + Grafana",
        "logging": "Structured JSON with Request-ID tracing",
        "tracing": "OpenTelemetry (OTel)",
        "error_tracking": "Sentry with environment tags",
        "health_checks": "Dedicated /health (shallow) and /health/readiness (deep DB & Redis ping) endpoints",
    },
}
