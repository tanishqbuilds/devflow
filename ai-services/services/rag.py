"""Hybrid pgvector/full-text retrieval with strict project and tenant scoping."""
from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from typing import Any

from services.db_client import get_db_pool
from services.embeddings import embed_text, vector_literal
from utils.logging import get_logger

logger = get_logger("services.rag")

AGENT_RETRIEVAL_FOCUS: dict[str, str] = {
    "ceo": "business goals users market positioning monetization constraints success metrics",
    "product_manager": "requirements scope personas user journeys acceptance criteria priorities constraints",
    "architect": "architecture stack data model APIs security scalability integrations non-functional requirements",
    "sprint_planner": "epics tasks dependencies delivery estimates acceptance criteria team velocity milestones",
    "risk": "security privacy compliance availability delivery product technical risks mitigations constraints",
    "team_allocation": "team skills ownership staffing seniority budget architecture backlog delivery constraints",
    "timeline": "milestones dependencies critical path sprints release criteria delivery constraints",
    "integration": "external services APIs authentication deployment CI CD observability rollback security",
}


@dataclass(frozen=True)
class RetrievedChunk:
    id: str
    source_kind: str
    source_key: str
    source_title: str
    chunk_index: int
    content: str
    score: float
    metadata: dict[str, Any]

    @property
    def citation(self) -> str:
        return f"{self.source_kind}:{self.source_key}#{self.chunk_index}"


def _json(value: Any) -> Any:
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value
    return value


def _text(value: Any) -> str:
    if isinstance(value, str):
        return value
    return json.dumps(value, ensure_ascii=False, default=str, indent=1)


def chunk_text(text: str, *, max_chars: int = 1600, overlap_chars: int = 240) -> list[str]:
    """Split sources at paragraph/sentence boundaries with bounded overlap."""
    clean = re.sub(r"[ \t]+", " ", text).strip()
    if not clean:
        return []
    paragraphs = [part.strip() for part in re.split(r"\n\s*\n", clean) if part.strip()]
    chunks: list[str] = []
    current = ""
    for paragraph in paragraphs:
        units = [paragraph]
        if len(paragraph) > max_chars:
            units = [unit.strip() for unit in re.split(r"(?<=[.!?])\s+", paragraph) if unit.strip()]
        for unit in units:
            candidate = f"{current}\n\n{unit}".strip() if current else unit
            if current and len(candidate) > max_chars:
                chunks.append(current)
                prefix = current[-overlap_chars:].lstrip()
                current = f"{prefix}\n\n{unit}".strip()
            else:
                current = candidate
            while len(current) > max_chars:
                chunks.append(current[:max_chars])
                current = current[max_chars - overlap_chars:].lstrip()
    if current:
        chunks.append(current)
    return chunks


async def _upsert_source(
    *,
    workspace_id: str,
    project_id: str,
    document_id: str | None,
    source_kind: str,
    source_key: str,
    source_title: str,
    content: str,
    metadata: dict[str, Any] | None = None,
) -> int:
    pool = await get_db_pool()
    if not pool:
        return 0
    chunks = chunk_text(content)
    prepared: list[tuple[Any, ...]] = []
    for index, chunk in enumerate(chunks):
        digest = hashlib.sha256(chunk.encode("utf-8")).hexdigest()
        embedding = vector_literal(await embed_text(chunk))
        prepared.append((
            workspace_id, project_id, document_id, source_kind, source_key,
            source_title, index, chunk, len(chunk.split()), digest, embedding,
            json.dumps(metadata or {}, default=str),
        ))
    async with pool.acquire() as conn:
        async with conn.transaction():
            existing_rows = await conn.fetch(
                """SELECT chunk_index, content_sha256 FROM knowledge_chunks
                   WHERE project_id=$1 AND source_kind=$2 AND source_key=$3""",
                project_id, source_kind, source_key,
            )
            existing = {int(row["chunk_index"]): row["content_sha256"] for row in existing_rows}
            changed = [row for row in prepared if existing.get(int(row[6])) != row[9]]
            if changed:
                await conn.executemany(
                    """INSERT INTO knowledge_chunks
                           (workspace_id, project_id, document_id, source_kind, source_key,
                            source_title, chunk_index, content, token_count, content_sha256,
                            embedding, metadata)
                       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::vector,$12::jsonb)
                       ON CONFLICT (project_id, source_kind, source_key, chunk_index)
                       DO UPDATE SET document_id=EXCLUDED.document_id,
                           source_title=EXCLUDED.source_title, content=EXCLUDED.content,
                           token_count=EXCLUDED.token_count,
                           content_sha256=EXCLUDED.content_sha256,
                           embedding=EXCLUDED.embedding, metadata=EXCLUDED.metadata,
                           updated_at=NOW()""",
                    changed,
                )
            await conn.execute(
                """DELETE FROM knowledge_chunks
                   WHERE project_id=$1 AND source_kind=$2 AND source_key=$3 AND chunk_index >= $4""",
                project_id, source_kind, source_key, len(chunks),
            )
    return len(chunks)


async def ensure_project_index(project_id: str) -> dict[str, int]:
    """Index the project brief, uploaded sources, and durable prior outputs."""
    pool = await get_db_pool()
    if not pool:
        return {"sources": 0, "chunks": 0}
    async with pool.acquire() as conn:
        project = await conn.fetchrow(
            "SELECT workspace_id, title, document FROM projects WHERE id=$1", project_id
        )
        if not project or not project["workspace_id"]:
            return {"sources": 0, "chunks": 0}
        documents = await conn.fetch(
            """SELECT id, title, source_type, content, metadata
               FROM project_documents WHERE project_id=$1 ORDER BY created_at""", project_id
        )

    workspace_id = str(project["workspace_id"])
    doc = _json(project["document"]) or {}
    sources: list[dict[str, Any]] = [
        {
            "document_id": None,
            "kind": "project_brief",
            "key": "idea",
            "title": f"{project['title']} — founder brief",
            "content": str(doc.get("idea") or ""),
            "metadata": {"authoritative": True},
        },
    ]
    if doc.get("manager_inputs"):
        sources.append({
            "document_id": None,
            "kind": "manager_constraints",
            "key": "manager_inputs",
            "title": f"{project['title']} — manager constraints",
            "content": _text(doc["manager_inputs"]),
            "metadata": {"authoritative": True},
        })
    for row in documents:
        sources.append({
            "document_id": str(row["id"]),
            "kind": "document",
            "key": str(row["id"]),
            "title": str(row["title"]),
            "content": str(row["content"]),
            "metadata": _json(row["metadata"]) or {"source_type": row["source_type"]},
        })
    for section in (
        "executive_summary", "requirements", "architecture", "backlog",
        "risks", "team", "timeline", "integrations",
    ):
        if doc.get(section):
            sources.append({
                "document_id": None,
                "kind": "agent_output",
                "key": section,
                "title": f"Prior {section.replace('_', ' ')}",
                "content": _text(doc[section]),
                "metadata": {"section": section, "prior_output": True},
            })

    chunk_count = 0
    for source in sources:
        if not source["content"].strip():
            continue
        chunk_count += await _upsert_source(
            workspace_id=workspace_id,
            project_id=project_id,
            document_id=source["document_id"],
            source_kind=source["kind"],
            source_key=source["key"],
            source_title=source["title"],
            content=source["content"],
            metadata=source["metadata"],
        )
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE project_documents SET status='indexed', updated_at=NOW() WHERE project_id=$1",
            project_id,
        )
    logger.info("Indexed %d sources / %d chunks for project %s", len(sources), chunk_count, project_id)
    return {"sources": len(sources), "chunks": chunk_count}


async def index_agent_output(
    project_id: str, agent_id: str, section: str, data: dict[str, Any]
) -> int:
    """Make a validated specialist result immediately retrievable downstream."""
    pool = await get_db_pool()
    if not pool:
        return 0
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT workspace_id, title FROM projects WHERE id=$1", project_id
        )
    if not row or not row["workspace_id"]:
        return 0
    count = await _upsert_source(
        workspace_id=str(row["workspace_id"]), project_id=project_id, document_id=None,
        source_kind="agent_output", source_key=section,
        source_title=f"Validated {section.replace('_', ' ')}",
        content=_text(data), metadata={"agent_id": agent_id, "section": section},
    )
    await _save_distilled_memories(
        workspace_id=str(row["workspace_id"]), project_id=project_id,
        agent_id=agent_id, section=section, data=data,
    )
    return count


def _memory_candidates(section: str, data: dict[str, Any]) -> list[tuple[str, str, int]]:
    candidates: list[tuple[str, str, int]] = []
    if section == "executive_summary":
        candidates.extend(("decision", str(item), 5) for item in data.get("key_decisions", []))
    elif section == "requirements":
        for item in (data.get("functional_requirements") or []) + (data.get("non_functional_requirements") or []):
            if item.get("priority") == "high":
                candidates.append(("constraint", f"{item.get('title')}: {item.get('description')}", 4))
    elif section == "architecture":
        for layer in ("frontend", "backend", "database", "infrastructure"):
            for decision in (data.get(layer) or {}).get("decisions", []):
                candidates.append(("decision", f"{layer}: {decision}", 4))
    elif section == "risks":
        for item in data.get("risks", []):
            if item.get("severity") in {"critical", "high"}:
                candidates.append(("fact", f"Risk — {item.get('title')}: {item.get('mitigation')}", 4))
    return [(kind, content, importance) for kind, content, importance in candidates if content.strip()][:30]


async def _save_distilled_memories(
    *, workspace_id: str, project_id: str, agent_id: str,
    section: str, data: dict[str, Any],
) -> None:
    pool = await get_db_pool()
    if not pool:
        return
    values: list[tuple[Any, ...]] = []
    for memory_type, content, importance in _memory_candidates(section, data):
        digest = hashlib.sha256(content.encode("utf-8")).hexdigest()
        embedding = vector_literal(await embed_text(content))
        values.append((
            workspace_id, project_id, agent_id, memory_type, content, digest,
            importance, embedding, json.dumps({"digest": digest, "section": section}),
        ))
    if values:
        async with pool.acquire() as conn:
            await conn.executemany(
                """INSERT INTO project_memories
                       (workspace_id, project_id, agent_id, memory_type, content,
                        content_sha256, importance, embedding, metadata)
                   VALUES ($1,$2,$3,$4,$5,$6,$7,$8::vector,$9::jsonb)
                   ON CONFLICT DO NOTHING""",
                values,
            )


async def retrieve_for_agent(
    project_id: str,
    agent_id: str,
    query: str,
    *,
    limit: int = 8,
) -> list[RetrievedChunk]:
    """Return ranked context without ever searching outside the project's workspace."""
    pool = await get_db_pool()
    if not pool:
        return []
    focus = AGENT_RETRIEVAL_FOCUS.get(agent_id, "software project requirements architecture delivery")
    retrieval_query = f"{focus}\n{query}"[:5000]
    lexical_terms = []
    for term in re.findall(r"[a-z0-9]+", retrieval_query.lower()):
        if len(term) > 2 and term not in lexical_terms:
            lexical_terms.append(term)
    lexical_query = " | ".join(lexical_terms[:40]) or "software"
    embedding = vector_literal(await embed_text(retrieval_query))
    async with pool.acquire() as conn:
        scope = await conn.fetchrow(
            "SELECT workspace_id FROM projects WHERE id=$1", project_id
        )
        if not scope or not scope["workspace_id"]:
            return []
        rows = await conn.fetch(
            """WITH query AS (
                   SELECT $3::vector AS embedding,
                          to_tsquery('english', $4) AS terms
               ), candidates AS (
                   SELECT kc.id::text, kc.source_kind, kc.source_key, kc.source_title,
                          kc.chunk_index, kc.content, kc.metadata,
                          (0.50 * GREATEST(1 - (kc.embedding <=> query.embedding), 0) +
                           0.35 * LEAST(ts_rank_cd(kc.search_vector, query.terms) * 5, 1) +
                           CASE kc.source_kind
                               WHEN 'document' THEN 0.12
                               WHEN 'manager_constraints' THEN 0.10
                               WHEN 'project_brief' THEN 0.08
                               ELSE 0
                           END) AS score
                   FROM knowledge_chunks kc CROSS JOIN query
                   WHERE kc.workspace_id=$1 AND kc.project_id=$2
                   UNION ALL
                   SELECT ('memory-' || pm.id)::text, 'memory',
                          pm.agent_id || ':' || left(pm.content_sha256, 16),
                          'Durable ' || pm.agent_id || ' ' || pm.memory_type,
                          0, pm.content, pm.metadata,
                          (0.50 * GREATEST(1 - (pm.embedding <=> query.embedding), 0) +
                           0.35 * LEAST(ts_rank_cd(pm.search_vector, query.terms) * 5, 1) +
                           0.06 + (pm.importance * 0.005)) AS score
                   FROM project_memories pm CROSS JOIN query
                   WHERE pm.workspace_id=$1 AND pm.project_id=$2 AND pm.superseded_at IS NULL
               )
               SELECT * FROM candidates
               ORDER BY score DESC, id DESC
               LIMIT $5""",
            str(scope["workspace_id"]), project_id, embedding, lexical_query, limit,
        )
    return [
        RetrievedChunk(
            id=row["id"], source_kind=row["source_kind"], source_key=row["source_key"],
            source_title=row["source_title"], chunk_index=row["chunk_index"],
            content=row["content"], score=float(row["score"] or 0),
            metadata=_json(row["metadata"]) or {},
        )
        for row in rows
    ]


def format_retrieved_context(chunks: list[RetrievedChunk], max_chars: int = 9000) -> str:
    if not chunks:
        return "No indexed project evidence matched this specialist query."
    blocks: list[str] = []
    used = 0
    for chunk in chunks:
        block = (
            f"[SOURCE {chunk.citation} | {chunk.source_title} | relevance={chunk.score:.3f}]\n"
            f"{chunk.content}"
        )
        if blocks and used + len(block) > max_chars:
            break
        blocks.append(block)
        used += len(block)
    return "\n\n".join(blocks)
