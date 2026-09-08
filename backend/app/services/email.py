"""Email notification service using Resend API."""
from __future__ import annotations

import httpx
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("services.email")


async def send_project_invitation_email(
    *,
    to_email: str,
    project_title: str,
    role: str,
    specialization: str | None = None,
    inviter_name: str | None = None,
    invite_id: str,
) -> bool:
    """Send an invitation email to join a project."""
    api_key = settings.resend_api_key
    invite_url = f"{settings.app_url}/invite/{invite_id}"

    if not api_key:
        logger.info(
            "RESEND_API_KEY is not configured. Invitation recorded in DB for %s. Join link: %s",
            to_email, invite_url
        )
        return False

    role_display = role.capitalize()
    if specialization:
        role_display = f"{role_display} ({specialization})"

    inviter_display = inviter_name or "A team manager"

    html_content = f"""
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="background: #2563eb; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Devflow</h1>
            <p style="color: #bfdbfe; margin: 4px 0 0 0; font-size: 13px;">AI-Augmented Autonomous Engineering</p>
          </div>
          <div style="padding: 32px; color: #1e293b;">
            <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #0f172a;">You're invited to collaborate!</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
              <strong>{inviter_display}</strong> has invited you to join <strong>{project_title}</strong> as a <strong>{role_display}</strong>.
            </p>
            <div style="margin: 28px 0; text-align: center;">
              <a href="{invite_url}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px; display: inline-block;">
                Accept Invitation &amp; Join Project
              </a>
            </div>
            <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
              Or copy and paste this link into your browser:<br/>
              <a href="{invite_url}" style="color: #2563eb; word-break: break-all;">{invite_url}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">
              If you did not expect this invitation, you can safely ignore this email.
            </p>
          </div>
        </div>
      </body>
    </html>
    """

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": settings.resend_from_email,
                    "to": [to_email],
                    "subject": f"Invitation: Join {project_title} as {role_display} on Devflow",
                    "html": html_content,
                },
            )
            if resp.status_code in (200, 201):
                logger.info("Successfully sent invitation email to %s via Resend", to_email)
                return True
            else:
                logger.error("Resend API error (%s): %s", resp.status_code, resp.text)
                return False
    except Exception as exc:
        logger.error("Failed to send invitation email to %s: %s", to_email, exc)
        return False
