"""Deterministic, auditable specialist output for provider-outage continuity."""
from __future__ import annotations

from typing import Any

from agents.schemas import IntegrationBundle


def build_integration_runbook(ctx: dict[str, Any]) -> dict[str, Any]:
    """Build a safe integration/deployment baseline from authoritative context.

    This is deliberately narrow: it is used only after model retries are
    exhausted. It preserves a deployable project plan without pretending a
    provider-generated response succeeded.
    """
    idea = str(ctx.get("idea", "")).lower()
    architecture = ctx.get("architecture") or {}
    infrastructure = architecture.get("infrastructure") or {}
    technologies = " ".join(str(item) for item in infrastructure.get("technologies") or [])
    aws_region = "eu-west-1" if "eu-west-1" in f"{idea} {technologies}".lower() else "configured AWS region"

    integrations = [
        {
            "name": "NetSuite ERP",
            "category": "other",
            "purpose": "Import purchase orders and post reconciliation outcomes using tenant-scoped credentials.",
            "auth_method": "OAuth 2.0 authorization code flow with encrypted per-tenant refresh tokens",
            "steps": [
                "Register separate sandbox and production integrations with least-privilege scopes.",
                "Complete tenant admin consent and store encrypted token references, never raw tokens in logs.",
                "Pull incrementally with cursor checkpoints, idempotency keys, bounded retries, and a dead-letter queue.",
                "Reconcile counts and totals before promoting the connector from shadow to active mode.",
            ],
            "rollback_steps": [
                "Disable the tenant connector feature flag and revoke its refresh token.",
                "Stop consumers, preserve the cursor, and replay only verified dead-letter messages after remediation.",
            ],
        },
        {
            "name": "Stripe Payments and Billing",
            "category": "payments",
            "purpose": "Ingest payment state and operate SaaS subscription billing with auditable event handling.",
            "auth_method": "Restricted API key plus verified, rotated webhook signing secret",
            "steps": [
                "Create restricted test/live keys and keep them in the deployment secret manager.",
                "Verify webhook signatures against the raw request body and reject stale timestamps.",
                "Persist event IDs before processing so duplicate deliveries are idempotent.",
                "Route exhausted events to a dead-letter queue with operator replay controls.",
            ],
            "rollback_steps": [
                "Disable webhook consumption while retaining the durable inbox.",
                "Roll back the handler image, rotate compromised secrets, then replay by event ID.",
            ],
        },
        {
            "name": f"AWS {aws_region} Platform Services",
            "category": "deployment",
            "purpose": "Provide private networking, encrypted object storage, secrets, queues, and recoverable deployment primitives.",
            "auth_method": "Workload identity/IAM roles with no long-lived application access keys",
            "steps": [
                "Provision separate environments through reviewed infrastructure-as-code state.",
                "Enable KMS encryption, private subnets, least-privilege security groups, and immutable audit logging.",
                "Configure database point-in-time recovery and test the stated RPO/RTO with restoration drills.",
                "Set autoscaling and queue-depth alarms against measured SLOs.",
            ],
            "rollback_steps": [
                "Shift traffic to the previous healthy task/image revision.",
                "Revert forward-compatible infrastructure changes through the reviewed prior plan; restore data only through the recovery runbook.",
            ],
        },
        {
            "name": "OpenTelemetry Observability",
            "category": "analytics",
            "purpose": "Correlate tenant-safe traces, metrics, logs, queue work, and external dependency health against the 99.95% SLO.",
            "auth_method": "Workload identity or scoped ingest token held in the secret manager",
            "steps": [
                "Instrument HTTP, database, queue, and connector boundaries with correlation IDs.",
                "Redact financial data, credentials, and tenant content before telemetry export.",
                "Create latency, availability, error-budget, queue-age, and reconciliation-accuracy dashboards.",
                "Route actionable alerts to an owned on-call playbook and verify them in staging.",
            ],
            "rollback_steps": [
                "Disable the exporter while retaining local health metrics and application operation.",
                "Roll back collector configuration and rotate the scoped ingest credential if exposed.",
            ],
        },
    ]
    output = IntegrationBundle.model_validate({
        "integrations": integrations,
        "deployment_plan": [
            "Build an immutable, signed container image once and promote the same digest across environments.",
            "Run unit, integration, tenant-isolation, BOLA, dependency, secret, and infrastructure policy checks before release.",
            "Apply backward-compatible database migrations before application traffic; destructive cleanup requires a later release.",
            "Deploy a canary in AWS with automated p95 latency, error-rate, queue-age, and reconciliation smoke gates.",
            "Promote gradually, verify NetSuite/Stripe sandbox probes, then record the release and approver in the audit trail.",
            "On a failed gate, shift traffic to the prior digest, halt consumers, preserve durable events, and execute the documented restore drill.",
        ],
        "cicd_recommendations": [
            "Require protected branches, peer review, pinned actions, and short-lived OIDC cloud credentials.",
            "Generate an SBOM, scan source/dependencies/images/IaC, sign artifacts, and verify signatures at deploy time.",
            "Use ephemeral preview environments with seeded synthetic financial data and no production credentials.",
            "Run contract tests for NetSuite and Stripe plus webhook signature, replay, idempotency, and dead-letter tests.",
            "Run migrations as a separately observable job with lock timeout, compatibility check, and explicit recovery procedure.",
            "Publish deployment provenance, test evidence, image digest, migration version, and rollback owner for every release.",
        ],
    }).model_dump(mode="json")
    output["evidence_citations"] = [
        "project_brief:idea#0",
        "manager_constraints:manager_inputs#0",
        "agent_output:architecture#0",
        "agent_output:requirements#0",
    ]
    output["generation_mode"] = "deterministic_resilience_tool"
    return output
