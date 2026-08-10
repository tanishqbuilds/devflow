"""Text processing and output quality tools for Devflow agents.

Provides summarizer, structured output parser, text normalizer, and decision
extractor to improve LLM output quality before storage and downstream context.
"""
from __future__ import annotations

import json
import re
from typing import Any

from langchain_core.tools import tool

from utils.logging import get_logger

logger = get_logger("tools.text")


@tool
def summarize_for_context(text: str, max_sentences: int = 5) -> str:
    """Condense a long section output into a compact summary for downstream context.

    Extracts the most important sentences and key data points, preserving
    numbers, names, and decisions while removing filler.
    """
    if not text or len(text) < 100:
        return text

    # Split into sentences and score by importance signals
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    if len(sentences) <= max_sentences:
        return text

    scored: list[tuple[float, str]] = []
    importance_signals = [
        "must", "critical", "key", "important", "required", "recommended",
        "decision", "chosen", "selected", "primary", "core", "essential",
    ]
    for sent in sentences:
        score = 0.0
        lower = sent.lower()
        # Boost sentences with numbers (metrics, estimates)
        if re.search(r'\d+', sent):
            score += 2.0
        # Boost sentences with importance keywords
        for signal in importance_signals:
            if signal in lower:
                score += 1.5
        # Boost sentences with technical terms
        if any(t in lower for t in ["api", "database", "architecture", "sprint", "risk"]):
            score += 1.0
        # Penalize filler
        if any(f in lower for f in ["in general", "overall", "basically", "essentially"]):
            score -= 1.0
        scored.append((score, sent))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = [s[1] for s in scored[:max_sentences]]
    # Return in original order
    ordered = [s for s in sentences if s in top]
    return " ".join(ordered[:max_sentences])


@tool
def normalize_output_text(text: str) -> str:
    """Strip filler phrases, normalize whitespace, and clean LLM output.

    Removes common LLM boilerplate, excessive whitespace, and repetitive
    filler to produce clean, professional text.
    """
    if not text:
        return text

    # Remove common LLM filler phrases
    filler_patterns = [
        r"(?i)^(sure|certainly|of course|absolutely)[,!.]\s*",
        r"(?i)^(here(?:'s| is) (?:a|the|my) .*?:)\s*",
        r"(?i)^(i(?:'d| would) (?:like to |be happy to )?(?:suggest|recommend|propose).*?:)\s*",
        r"(?i)(as (?:an? )?(?:ai|language model|assistant).*?[.,])\s*",
        r"(?i)(in conclusion[,.])\s*",
        r"(?i)(to summarize[,.])\s*",
    ]
    result = text
    for pattern in filler_patterns:
        result = re.sub(pattern, "", result, count=1)

    # Normalize whitespace
    result = re.sub(r'\n{3,}', '\n\n', result)
    result = re.sub(r'[ \t]+', ' ', result)
    result = result.strip()

    return result


@tool
def extract_key_decisions(text: str) -> str:
    """Extract actionable decisions and constraints from narrative text.

    Parses an agent's output to identify specific choices, recommendations,
    and constraints that downstream agents must respect.
    """
    if not text:
        return json.dumps([])

    decisions: list[dict[str, str]] = []
    decision_signals = [
        (r"(?i)(?:we (?:will|shall|should|must) (?:use|adopt|implement|choose|select))\s+(.+?)(?:\.|$)", "technology_choice"),
        (r"(?i)(?:(?:decided|chosen|selected|recommended) (?:to use|for|as))\s+(.+?)(?:\.|$)", "decision"),
        (r"(?i)(?:the (?:primary|main|core|chosen) (?:database|framework|language|stack|tool) (?:is|will be))\s+(.+?)(?:\.|$)", "stack_decision"),
        (r"(?i)(?:must (?:not|never|always))\s+(.+?)(?:\.|$)", "constraint"),
        (r"(?i)(?:(?:non-negotiable|mandatory|critical) (?:requirement|constraint)(?::|\s+is))\s+(.+?)(?:\.|$)", "hard_constraint"),
    ]

    for pattern, decision_type in decision_signals:
        matches = re.finditer(pattern, text)
        for match in matches:
            content = match.group(1).strip()
            if len(content) > 10:  # Skip trivially short matches
                decisions.append({
                    "type": decision_type,
                    "content": content[:200],
                    "context": match.group(0).strip()[:300],
                })

    return json.dumps(decisions[:15], indent=2)


@tool
def validate_json_structure(raw_json: str, required_fields: str = "") -> str:
    """Validate and repair malformed JSON output from an LLM.

    Attempts to parse the JSON, identifies missing required fields, and
    returns a validation report.
    """
    result: dict[str, Any] = {"valid": False, "parsed": None, "errors": []}

    # Try to parse
    try:
        parsed = json.loads(raw_json)
        result["valid"] = True
        result["parsed"] = parsed
    except json.JSONDecodeError as exc:
        result["errors"].append(f"JSON parse error: {exc}")
        # Try to extract JSON from markdown code blocks
        json_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', raw_json, re.DOTALL)
        if json_match:
            try:
                parsed = json.loads(json_match.group(1))
                result["valid"] = True
                result["parsed"] = parsed
                result["errors"] = ["Extracted JSON from markdown code block"]
            except json.JSONDecodeError:
                pass

    # Check required fields
    if result["valid"] and required_fields and isinstance(result["parsed"], dict):
        fields = [f.strip() for f in required_fields.split(",") if f.strip()]
        for field in fields:
            if field not in result["parsed"]:
                result["errors"].append(f"Missing required field: '{field}'")
                result["valid"] = False

    return json.dumps(result, indent=2, default=str)
