from __future__ import annotations

import math
import unittest

from services.embeddings import DIMENSIONS, local_embedding
from services.evaluation import evaluate_agent_output
from services.rag import chunk_text
from services.resilient_outputs import build_integration_runbook
from agents.schemas import ArchitectureBundle, IntegrationBundle, SprintPlan, TeamPlan


class EmbeddingTests(unittest.TestCase):
    def test_embedding_is_fixed_normalized_and_deterministic(self) -> None:
        first = local_embedding("PostgreSQL tenant scoped retrieval")
        second = local_embedding("PostgreSQL tenant scoped retrieval")
        self.assertEqual(first, second)
        self.assertEqual(len(first), DIMENSIONS)
        self.assertAlmostEqual(math.sqrt(sum(value * value for value in first)), 1.0, places=6)

    def test_related_text_scores_above_unrelated_text(self) -> None:
        query = local_embedding("PostgreSQL workspace tenant isolation")
        related = local_embedding("Every PostgreSQL record carries workspace tenant ownership")
        unrelated = local_embedding("Marketing campaign illustration color palette")
        dot = lambda left, right: sum(a * b for a, b in zip(left, right))
        self.assertGreater(dot(query, related), dot(query, unrelated))


class ChunkingTests(unittest.TestCase):
    def test_long_source_is_bounded_and_overlapped(self) -> None:
        source = ("Architecture and database constraint. " * 150) + "\n\n" + ("Security control. " * 150)
        chunks = chunk_text(source)
        self.assertGreater(len(chunks), 2)
        self.assertTrue(all(len(chunk) <= 1800 for chunk in chunks))


class QualityGateTests(unittest.TestCase):
    def test_architecture_normalizes_nested_small_model_shape(self) -> None:
        layer = {
            "summary": "A concrete layer",
            "key_components": ["service"],
            "recommended_technologies": ["technology"],
            "important_architectural_decisions": ["decision with rationale"],
            "key_entities": [{"name": "Invoice", "description": "tenant-owned record"}],
        }
        payload = {
            "architecture": {
                "frontend": dict(layer),
                "backend": dict(layer),
                "database": dict(layer),
                "infrastructure": {
                    **layer,
                    "hosting": {"region": "eu-west-1"},
                    "scaling": {"trigger": "queue depth"},
                    "observability": {"slo": "99.95%"},
                },
            }
        }
        normalized = ArchitectureBundle.model_validate(payload).model_dump(mode="json")
        issues, metrics = evaluate_agent_output("architect", normalized)
        self.assertEqual(issues, [])
        self.assertEqual(metrics["complete_layers"], 4)
        self.assertIn("Invoice", normalized["database"]["key_entities"][0])

    def test_nested_backlog_tasks_are_promoted(self) -> None:
        tasks = [
            {
                "name": f"Task {index}", "estimated_days": 2, "story_points": 3,
                "sprint": (index % 3) + 1, "definition_of_done": "Tested and reviewed",
            }
            for index in range(12)
        ]
        payload = {
            "epics": [{"name": "Delivery", "tasks": tasks}],
            "sprints": [
                {"number": number, "tasks": [task["name"] for task in tasks if task["sprint"] == number]}
                for number in range(1, 4)
            ],
        }
        normalized = SprintPlan.model_validate(payload).model_dump(mode="json")
        issues, metrics = evaluate_agent_output("sprint_planner", normalized)
        self.assertEqual(issues, [])
        self.assertEqual(metrics["tasks"], 12)

    def test_team_and_devops_aliases_remain_detailed(self) -> None:
        team = TeamPlan.model_validate({
            "recommended_roles": [
                {"role": role, "responsibilities": ["deliver"], "ownership": role}
                for role in ("Tech Lead", "Product Engineer", "SRE")
            ]
        }).model_dump(mode="json")
        team_issues, _ = evaluate_agent_output("team_allocation", team)
        self.assertEqual(team_issues, [])

        integration = IntegrationBundle.model_validate({
            "integrations": [
                {"name": name, "auth_method": "signed credential", "rollback_steps": ["disable"]}
                for name in ("NetSuite", "Stripe", "Observability")
            ],
            "deployment_strategy": {"prepare": "migrate", "release": "canary", "verify": "SLO checks"},
            "ci_cd_pipeline": {"build": "test", "secure": "scan", "deploy": "promote"},
        }).model_dump(mode="json")
        integration_issues, _ = evaluate_agent_output("integration", integration)
        self.assertEqual(integration_issues, [])

    def test_provider_outage_runbook_is_detailed_and_explicit(self) -> None:
        output = build_integration_runbook({
            "idea": "NetSuite and Stripe on AWS eu-west-1 with 99.95% availability",
            "architecture": {"infrastructure": {"technologies": ["AWS eu-west-1"]}},
        })
        issues, metrics = evaluate_agent_output("integration", output)
        self.assertEqual(issues, [])
        self.assertEqual(metrics["integrations"], 4)
        self.assertEqual(output["generation_mode"], "deterministic_resilience_tool")
        self.assertGreaterEqual(len(output["deployment_plan"]), 6)

    def test_empty_risk_output_fails_with_metrics(self) -> None:
        issues, metrics = evaluate_agent_output("risk", {"risks": []})
        self.assertTrue(issues)
        self.assertEqual(metrics["risks"], 0)

    def test_detailed_risk_output_passes(self) -> None:
        risks = [
            {"title": str(index), "category": category, "mitigation": "Concrete control"}
            for index, category in enumerate(
                ["security", "technical", "delivery", "product", "scalability"], start=1
            )
        ]
        issues, _ = evaluate_agent_output("risk", {"risks": risks})
        self.assertEqual(issues, [])


if __name__ == "__main__":
    unittest.main()
