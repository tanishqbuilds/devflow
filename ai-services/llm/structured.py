"""Structured generation: call the LLM and return a validated Pydantic object.

Local models are not always perfectly behaved, so this module is defensive:

* It requests JSON mode where supported.
* It strips reasoning blocks (``<think>...</think>``) and markdown fences.
* It extracts the first balanced JSON object from the response.
* It validates against the target schema and, on failure, retries while
  feeding the validation error back to the model.
"""
from __future__ import annotations

import json
import re
from typing import Type, TypeVar

from pydantic import BaseModel, ValidationError

from llm.client import get_llm_client
from llm.router import resolve
from utils.logging import get_logger

logger = get_logger("llm.structured")

T = TypeVar("T", bound=BaseModel)

_THINK_RE = re.compile(r"<think>.*?</think>", re.DOTALL | re.IGNORECASE)
_FENCE_RE = re.compile(r"```(?:json)?\s*(.*?)```", re.DOTALL)


class StructuredGenerationError(RuntimeError):
    """Raised when the model cannot produce schema-valid output after retries."""


def _extract_json(text: str) -> str:
    """Pull the most likely JSON object out of a noisy model response."""
    cleaned = _THINK_RE.sub("", text).strip()

    fence = _FENCE_RE.search(cleaned)
    if fence:
        cleaned = fence.group(1).strip()

    start = cleaned.find("{")
    if start == -1:
        raise ValueError("no JSON object found in response")

    # Walk forward tracking brace depth, ignoring braces inside strings.
    depth = 0
    in_string = False
    escape = False
    for i in range(start, len(cleaned)):
        ch = cleaned[i]
        if escape:
            escape = False
            continue
        if ch == "\\":
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return cleaned[start : i + 1]
    raise ValueError("unterminated JSON object in response")


def _schema_hint(schema: Type[BaseModel]) -> str:
    return json.dumps(schema.model_json_schema(), indent=2)


async def generate_structured(
    agent_id: str,
    system_prompt: str,
    user_prompt: str,
    schema: Type[T],
    *,
    max_attempts: int = 3,
) -> T:
    """Generate output validated against ``schema``."""
    cfg = resolve(agent_id)
    client = get_llm_client()

    # qwen3 is a hybrid reasoning model; "/no_think" disables its chain-of-thought,
    # which is essential for acceptable latency on CPU. Harmless to non-qwen3 models
    # only if present, so we gate it on the model name.
    no_think = " /no_think" if "qwen3" in cfg.model.lower() else ""

    full_system = (
        f"{system_prompt}\n\n"
        "You MUST respond with a single valid JSON object and nothing else. "
        "Do not include markdown fences, comments, or any prose outside the JSON. "
        "The JSON must conform exactly to this JSON Schema:\n"
        f"{_schema_hint(schema)}"
        f"{no_think}"
    )

    messages = [
        {"role": "system", "content": full_system},
        {"role": "user", "content": user_prompt},
    ]

    last_error: Exception | None = None
    for attempt in range(1, max_attempts + 1):
        try:
            kwargs: dict = dict(
                model=cfg.model,
                messages=messages,
                temperature=cfg.temperature,
                max_tokens=cfg.max_tokens,
            )
            # JSON mode is best-effort; some models/providers ignore it.
            try:
                resp = await client.chat.completions.create(
                    response_format={"type": "json_object"}, **kwargs
                )
            except Exception:  # pragma: no cover - provider rejected json mode
                resp = await client.chat.completions.create(**kwargs)

            raw = resp.choices[0].message.content or ""
            payload = _extract_json(raw)
            obj = schema.model_validate_json(payload)
            logger.info("Agent %s produced valid %s (attempt %d)", agent_id, schema.__name__, attempt)
            return obj
        except (ValidationError, ValueError, json.JSONDecodeError) as exc:
            last_error = exc
            logger.warning(
                "Agent %s attempt %d failed validation: %s", agent_id, attempt, str(exc)[:300]
            )
            messages.append(
                {
                    "role": "user",
                    "content": (
                        "Your previous response was not valid for the schema. "
                        f"Error:\n{str(exc)[:800]}\n"
                        "Return ONLY a corrected JSON object that satisfies the schema."
                    ),
                }
            )
        except Exception as exc:  # network / provider error
            last_error = exc
            logger.error("Agent %s attempt %d errored: %s", agent_id, attempt, str(exc)[:300])

    raise StructuredGenerationError(
        f"agent '{agent_id}' failed to produce valid output after {max_attempts} attempts: {last_error}"
    )
