"""Shared-secret authentication for the internal AI service boundary."""
from __future__ import annotations

import hmac
import os

from fastapi import Header, HTTPException


async def require_internal_auth(
    x_devflow_internal_key: str | None = Header(default=None),
) -> None:
    configured = os.getenv("AI_INTERNAL_API_KEY", "")
    # Local development remains usable without secret management. Production
    # readiness checks require this value to be configured.
    if not configured:
        return
    if not x_devflow_internal_key or not hmac.compare_digest(
        x_devflow_internal_key, configured
    ):
        raise HTTPException(status_code=401, detail="invalid internal service credential")
