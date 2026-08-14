# SaaS RAG and multi-agent orchestration architecture

## Schema review

The supplied ERD is a useful conceptual inventory of generated planning data, but it should not be deployed as-is for Devflow.

| ERD area | Assessment for Devflow |
| --- | --- |
| `USER.role` | A global manager/employee enum cannot express SaaS membership. Devflow uses workspace membership roles (`owner`, `admin`, `editor`, `viewer`) and keeps the user profile role separate. |
| `PROJECT.manager_id` | A single manager does not provide tenant isolation. A project belongs to a workspace and also records its creator. Every source, chunk, memory, run, and output is scoped by project/workspace. |
| Separate requirement/story/architecture/risk tables | Useful for analytics, but too rigid as the primary generated-output store because specialist schemas evolve. Devflow keeps a versioned JSONB project read model plus response history, and materializes operational entities where they need independent lifecycle or querying. |
| `TASK_ASSIGNMENT` | The ERD appears one-to-one on assignment. Real delivery needs task-to-member history and workspace authorization. Devflow currently keeps assignment in the versioned backlog and validates assignees against workspace membership; a future reporting projection can be materialized without changing the AI contract. |
| `PROJECT_DOCUMENT` | Missing source content, checksum, tenant, creator, indexing status, metadata, and chunk provenance. Those fields are required for safe RAG ingestion. |
| `AI_RESPONSE` | A response row alone cannot explain a multi-agent run. Devflow adds runs and phase-level steps for retrieval, tools, generation, quality gates, retries, and supervision. |
| Missing RAG model | The ERD has no chunks, embeddings, lexical index, source citations, durable memories, or supersession. Devflow adds all of these. |
| Missing operations | The ERD has no durable queue, leases, replayable events, idempotency, revisions, or failure recovery. Devflow stores jobs and append-only orchestration events in PostgreSQL. |

The project JSONB document remains the transactional UI read model. This avoids fragile joins across a fast-evolving AI schema while `project_revisions`, `ai_responses`, `agent_runs`, and `agent_run_steps` retain history and provenance.

## Runtime flow

```text
authenticated user
  -> workspace-authorized project/source upload
  -> durable orchestration_jobs row
  -> worker claims with FOR UPDATE SKIP LOCKED + expiring lease
  -> source indexer
       project brief + manager constraints + uploaded documents + prior outputs
       -> bounded chunks -> 384d embedding + English tsvector
  -> staged specialist graph
       CEO
        -> Product Manager
          -> Architect
            -> Sprint Planner / Risk / Team Allocation
              -> Timeline / Integration
                -> CEO supervisor
  -> for each specialist
       role-specific hybrid retrieval (workspace_id AND project_id)
       + dependency-scoped upstream output
       + dedicated deterministic/domain tools
       -> schema-constrained generation
       -> deterministic quality gate
       -> optional LLM quality review/refinement
       -> validated output + durable memories + downstream re-indexing
  -> section event persisted in orchestration_events
  -> backend atomically updates the project read model
  -> any WebSocket/API replica replays events from PostgreSQL
```

## Storage model

- `users`, `workspaces`, `workspace_members`, `workspace_invites`: identity and tenant RBAC.
- `projects`: project ownership, workflow state, and current JSONB read model.
- `project_revisions`: optimistic edit history and undo.
- `project_documents`: source content, creator, checksum, MIME/source type, metadata, and indexing state.
- `knowledge_chunks`: tenant/project scope, source citation, chunk content, `vector(384)`, generated `tsvector`, and source metadata.
- `project_memories`: important decisions, constraints, facts, feedback, and lessons with importance and supersession support.
- `ai_responses`: durable generated versions and chat transcript.
- `agent_runs`: one auditable orchestration execution.
- `agent_run_steps`: retrieval sources/scores, tool calls, schema generation, quality results, refinements, and timings.
- `orchestration_jobs`: durable multi-replica queue with claims and lease recovery.
- `orchestration_events`: append-only browser replay stream for the current job.

## Retrieval design

Retrieval is hybrid rather than vector-only:

1. Every query is augmented with a role-specific focus (architecture, risk, delivery, and so on).
2. Candidates are constrained by both `workspace_id` and `project_id` in SQL.
3. Ranking combines cosine similarity, full-text rank, and a source-authority prior.
4. Results carry stable citations such as `document:<id>#0` or `memory:architect:<digest>#0`.
5. Only the highest-ranked bounded context is inserted into the specialist prompt.

The default 384-dimensional local hashing encoder has no network dependency and is deterministic in tests. For stronger semantic recall in production, configure `RAG_EMBEDDING_PROVIDER=openai` and `RAG_EMBEDDING_MODEL=text-embedding-3-small`; the API requests 384 dimensions so the database schema does not change.

## Memory policy

Raw output is not automatically treated as durable truth. After schema validation, the memory layer distills:

- CEO binding decisions;
- high-priority product constraints;
- per-layer architecture decisions;
- critical/high risk mitigations.

These memories retain source agent, section, importance, and digest. Duplicate memories are not inserted, and the schema supports superseding stale memories. Downstream agents retrieve these alongside source documents and validated prior output.

## Agent contract

Each specialist has all four of the following; omitting any one turns the system into a prompt chain rather than an agent workflow:

1. A dedicated system prompt and strongly typed Pydantic output contract.
2. A dependency map restricting which prior specialist outputs it can see.
3. A role-specific retrieval query and callable domain/calculation tools.
4. A deterministic quality gate, optional semantic review, retry budget, and durable trace.

Provider throttling and schema failures have separate retry budgets. Minute-level limits honor provider reset hints; daily quota exhaustion fails fast. Valid prior sections remain checkpointed and are restored during retry.

Retries can target explicit specialist IDs. The job request is stored with the durable queue row, so a replacement worker preserves retry intent. A target section is removed from working state before execution; stale output therefore cannot make a failed repair appear successful. The router falls from the primary reasoning model to the fast model on exhausted daily quota and can switch to a separately metered secondary model after repeated minute throttles.

The integration specialist has one deliberately narrow outage-continuity tool. After every configured provider/model attempt is exhausted, it builds an auditable NetSuite, Stripe, AWS, observability, deployment, and CI/CD runbook from authoritative project context. It must pass the same deterministic quality gate and is persisted with `generation_mode=deterministic_resilience_tool` plus a `resilience_tool` run step; it is never represented as an LLM response.

## SaaS security and deployment requirements

- Clerk JWTs are verified when `BYPASS_AUTH=false`; demo tokens are accepted only in explicit bypass mode.
- Project and source APIs authorize through workspace membership. User enumeration is restricted to shared workspaces.
- AI endpoints support `AI_INTERNAL_API_KEY`; production must set the same long random value on backend and AI services and keep port 8001 private.
- CORS must list exact production browser origins.
- Use a managed PostgreSQL/Supabase plan with `vector`, connection pooling, point-in-time recovery, encrypted backups, and regional placement matching product requirements.
- Use at least two backend replicas/workers. Durable queue claims and event replay are replica-safe.
- Set production Clerk keys, disable bypass/unlimited test credentials, rotate provider credentials, and ship structured logs/traces to the chosen observability stack.
- The Compose and Dockerfile defaults are fail-closed (`BYPASS_AUTH=false`). Development Clerk keys intentionally emit a browser warning and are not a production credential; replace both keys from the same production Clerk instance before launch.
- Object storage should replace inline `project_documents.content` for large binary files; retain extracted text/checksum/provenance in PostgreSQL.

For a Compose-based deployment, include the production overlay so the AI control plane is not published on the host:

```bash
docker compose -f docker-compose.yml -f compose.production.yml up -d --build
```

## Verification evidence

The automated and integration checks cover deterministic embedding shape, chunk bounds, specialist quality gates, schema creation, pgvector availability, tenant-filtered retrieval, source ingestion, durable run/step creation, queue claiming, event replay, CORS/auth behavior, service health, and a browser-driven project workflow.
