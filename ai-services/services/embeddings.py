"""Embedding provider for tenant-scoped retrieval.

The default is a deterministic, zero-network feature-hashing encoder so RAG
continues to work when the configured chat provider (for example Groq) has no
embedding endpoint. Production deployments can select OpenAI's embedding API;
both providers emit the fixed 384 dimensions used by the pgvector schema.
"""
from __future__ import annotations

import hashlib
import math
import os
import re
from collections import Counter

from openai import AsyncOpenAI

DIMENSIONS = 384
_TOKEN_RE = re.compile(r"[a-z0-9][a-z0-9_+.#/-]*")


def _features(text: str) -> Counter[str]:
    tokens = _TOKEN_RE.findall(text.lower())
    features: Counter[str] = Counter(tokens)
    features.update(f"{a}::{b}" for a, b in zip(tokens, tokens[1:]))
    return features


def local_embedding(text: str) -> list[float]:
    """Produce a normalized hashing-vector embedding with unigram/bigram recall."""
    vector = [0.0] * DIMENSIONS
    for feature, count in _features(text).items():
        digest = hashlib.blake2b(feature.encode("utf-8"), digest_size=16).digest()
        index = int.from_bytes(digest[:8], "big") % DIMENSIONS
        sign = 1.0 if digest[8] & 1 else -1.0
        vector[index] += sign * (1.0 + math.log(count))
    norm = math.sqrt(sum(value * value for value in vector))
    if norm:
        vector = [value / norm for value in vector]
    return vector


async def embed_text(text: str) -> list[float]:
    provider = os.getenv("RAG_EMBEDDING_PROVIDER", "local").lower()
    if provider != "openai":
        return local_embedding(text)

    client = AsyncOpenAI(
        api_key=os.getenv("OPENAI_API_KEY", ""),
        base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
        max_retries=2,
    )
    response = await client.embeddings.create(
        model=os.getenv("RAG_EMBEDDING_MODEL", "text-embedding-3-small"),
        input=text,
        dimensions=DIMENSIONS,
    )
    return list(response.data[0].embedding)


def vector_literal(values: list[float]) -> str:
    if len(values) != DIMENSIONS:
        raise ValueError(f"expected {DIMENSIONS} embedding dimensions, got {len(values)}")
    return "[" + ",".join(f"{value:.8f}" for value in values) + "]"
