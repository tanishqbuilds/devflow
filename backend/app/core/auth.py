"""Clerk session-token verification and local user synchronization."""
from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any

import httpx
import jwt
from fastapi import Depends, HTTPException, Request, WebSocket, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings
from app.db.postgres import execute

bearer = HTTPBearer(auto_error=False)
_jwks_client = (
    jwt.PyJWKClient(f"{settings.clerk_issuer_url}/.well-known/jwks.json")
    if settings.clerk_issuer_url else None
)


@dataclass(frozen=True)
class CurrentUser:
    id: str
    email: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    image_url: str | None = None


def _decode_token(token: str) -> dict[str, Any]:
    if not settings.clerk_issuer_url:
        raise HTTPException(status_code=503, detail="Clerk is not configured")
    try:
        if _jwks_client is None:
            raise HTTPException(status_code=503, detail="Clerk is not configured")
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=settings.clerk_issuer_url,
            options={"require": ["exp", "iat", "sub"]},
        )
        authorized_party = claims.get("azp")
        if authorized_party:
            azp_clean = authorized_party.rstrip("/")
            allowed_origins = [o.rstrip("/") for o in settings.cors_origins]
            if azp_clean not in allowed_origins:
                raise HTTPException(status_code=401, detail="Invalid token origin")
        return claims
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session token") from exc


async def _clerk_profile(user_id: str) -> dict[str, Any]:
    if not settings.clerk_secret_key:
        return {}
    async with httpx.AsyncClient(timeout=8) as client:
        response = await client.get(
            f"https://api.clerk.com/v1/users/{user_id}",
            headers={"Authorization": f"Bearer {settings.clerk_secret_key}"},
        )
    if response.status_code != 200:
        return {}
    return response.json()


DEMO_USER = CurrentUser(
    id="user_demo_devflow",
    email="demo@devflow.ai",
    first_name="Demo",
    last_name="User",
    image_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
)


async def _ensure_demo_user() -> CurrentUser:
    try:
        await execute(
            """INSERT INTO users (clerk_user_id, email, first_name, last_name, image_url)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (clerk_user_id) DO UPDATE SET
                 email=EXCLUDED.email, first_name=EXCLUDED.first_name,
                 last_name=EXCLUDED.last_name, image_url=EXCLUDED.image_url, updated_at=NOW()""",
            DEMO_USER.id, DEMO_USER.email, DEMO_USER.first_name, DEMO_USER.last_name, DEMO_USER.image_url,
        )
    except Exception:
        pass
    return DEMO_USER


async def authenticate_token(token: str) -> CurrentUser:
    if settings.bypass_auth:
        return await _ensure_demo_user()
    if not settings.clerk_issuer_url:
        raise HTTPException(status_code=503, detail="Clerk is not configured")
    try:
        claims = await asyncio.to_thread(_decode_token, token)
        user_id = str(claims["sub"])
        profile = await _clerk_profile(user_id)
        emails = profile.get("email_addresses") or []
        primary_id = profile.get("primary_email_address_id")
        primary = next((item for item in emails if item.get("id") == primary_id), emails[0] if emails else {})
        user = CurrentUser(
            id=user_id,
            email=primary.get("email_address") or claims.get("email"),
            first_name=profile.get("first_name") or claims.get("first_name"),
            last_name=profile.get("last_name") or claims.get("last_name"),
            image_url=profile.get("image_url") or claims.get("image_url"),
        )
        await execute(
            """INSERT INTO users (clerk_user_id, email, first_name, last_name, image_url)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (clerk_user_id) DO UPDATE SET
                 email=EXCLUDED.email, first_name=EXCLUDED.first_name,
                 last_name=EXCLUDED.last_name, image_url=EXCLUDED.image_url, updated_at=NOW()""",
            user.id, user.email, user.first_name, user.last_name, user.image_url,
        )
        return user
    except Exception:
        if settings.bypass_auth:
            return await _ensure_demo_user()
        raise


async def current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> CurrentUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        if settings.bypass_auth:
            return await _ensure_demo_user()
        raise HTTPException(status_code=401, detail="Authentication required")
    return await authenticate_token(credentials.credentials)


async def websocket_user(websocket: WebSocket) -> CurrentUser:
    token = websocket.query_params.get("token")
    if settings.bypass_auth:
        return await _ensure_demo_user()
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    return await authenticate_token(token)
