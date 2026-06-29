"""HTTP client for the ai-services orchestration layer.

The backend is the only component that talks to ai-services; the frontend never
does. Workflow runs are fire-and-forget (ai-services streams progress over the
shared Redis channel), so the call itself returns quickly.
"""
from __future__ import annotations

from typing import Any, Optional

import httpx

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("services.ai_client")


class AIServicesClient:
    def __init__(self, base_url: Optional[str] = None):
        self._base_url = (base_url or settings.ai_services_url).rstrip("/")

    async def run_workflow(self, project_id: str, idea: str, title: Optional[str]) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{self._base_url}/workflow/run",
                json={"project_id": project_id, "idea": idea, "title": title},
            )
            resp.raise_for_status()
            return resp.json()

    async def chat(
        self, project: dict[str, Any], message: str, history: list[dict[str, str]]
    ) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(
                f"{self._base_url}/assistant/chat",
                json={"project": project, "message": message, "history": history},
            )
            resp.raise_for_status()
            return resp.json()

    async def list_agents(self) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{self._base_url}/agents")
            resp.raise_for_status()
            return resp.json()

    async def health(self) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{self._base_url}/health")
            return resp.json()


ai_services = AIServicesClient()
