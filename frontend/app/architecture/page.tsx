import type { Metadata } from 'next'
import Link from 'next/link'
import { AgentTraceDemo } from '@/components/architecture/agent-trace-demo'
import {
  ArrowDown, ArrowRight, Bot, Braces, CheckCircle2, ChevronRight,
  Database, FileSearch, GitBranch, Layers3, LockKeyhole, Network,
  Radio, RefreshCw, ShieldCheck, Sparkles, Workflow, Wrench, Zap,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'System Architecture',
  description: 'A visual map of Devflow’s custom multi-agent orchestration and data flow.',
}

const stages = [
  { n: '01', title: 'Vision', agents: ['CEO Agent'], output: 'Executive summary', tone: 'cyan' },
  { n: '02', title: 'Product', agents: ['Product Manager'], output: 'Requirements', tone: 'sky' },
  { n: '03', title: 'Design', agents: ['System Architect'], output: 'Architecture + diagram', tone: 'violet' },
  { n: '04', title: 'Delivery planning', agents: ['Sprint Planner', 'Risk Analyst', 'Team Allocation'], output: 'Backlog · risks · team · cost', tone: 'fuchsia' },
  { n: '05', title: 'Release planning', agents: ['Timeline Agent', 'Integration Agent'], output: 'Roadmap · integrations', tone: 'emerald' },
]

const agents = [
  ['CEO', 'Chief Vision Officer', 'ExecutiveSummary'],
  ['Product Manager', 'Senior Product Manager', 'RequirementsBundle'],
  ['System Architect', 'Principal Architect', 'ArchitectureBundle'],
  ['Sprint Planner', 'Agile Delivery Lead', 'SprintPlan'],
  ['Risk', 'Risk Analyst', 'RiskBundle'],
  ['Team Allocation', 'VP of Engineering', 'TeamPlan'],
  ['Timeline', 'Delivery Manager', 'TimelinePlan'],
  ['Integration', 'Platform / DevOps', 'IntegrationBundle'],
]

const contextMap = [
  ['01', 'CEO', 'Founder idea', 'Executive summary', 'LLM + Pydantic schema'],
  ['02', 'Product Manager', 'Idea · executive summary', 'Requirements', 'LLM + Pydantic schema'],
  ['03', 'System Architect', 'Idea · executive · requirements', 'Architecture', 'LLM + schema · deterministic diagram + Mermaid'],
  ['04a', 'Sprint Planner', 'Idea · executive · requirements · architecture', 'Backlog', 'LLM + Pydantic schema'],
  ['04b', 'Risk Analyst', 'Idea · executive · requirements · architecture', 'Risks', 'LLM + Pydantic schema'],
  ['04c', 'Team Allocation', 'Idea · executive · architecture', 'Team + cost', 'LLM + schema · deterministic cost calculator'],
  ['05a', 'Timeline', 'Idea · executive · architecture · backlog', 'Timeline', 'LLM + Pydantic schema'],
  ['05b', 'Integration', 'Idea · executive · architecture', 'Integrations', 'LLM + Pydantic schema'],
]

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">{children}</span>
}

export default function ArchitecturePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050816] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,.10),transparent_30%),radial-gradient(circle_at_85%_30%,rgba(139,92,246,.10),transparent_28%)]" />

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-white">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-400/10 text-cyan-300"><Network className="h-4 w-4" /></span>
          Devflow Architecture
        </Link>
        <Link href="/" className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-300 transition hover:border-cyan-400/40 hover:text-white">Back to product</Link>
      </nav>

      <div className="relative z-10 mx-auto max-w-7xl space-y-24 px-5 pb-24 pt-14 lg:px-8">
        <header className="max-w-4xl">
          <div className="mb-5 flex flex-wrap gap-2"><Badge>8 specialized agents</Badge><Badge>5 execution stages</Badge><Badge>Schema-validated output</Badge></div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">A custom AI organization,<br /><span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 bg-clip-text text-transparent">not a generic agent chain.</span></h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-slate-400 sm:text-lg">
            This map is derived from the executable backend and AI-services code—not from the frontend presentation. Devflow runs a fixed staged workflow built with LangChain and LangGraph, passes accumulated project context through role-specific prompts and tools, validates agent output with Pydantic, and streams progress directly to the backend over HTTP.
          </p>
        </header>

        <section>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[.25em] text-cyan-400">Execution graph</p><h2 className="mt-2 text-2xl font-semibold">Five stages, rate-limit-aware scheduling</h2></div>
            <p className="hidden max-w-md text-right text-sm text-slate-500 md:block">Stages are sequential. Peer agents use bounded concurrency and run one at a time on Groq by default so retries do not collide with the provider TPM window.</p>
          </div>
          <div className="grid gap-3 xl:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1.35fr_auto_1.2fr] xl:items-stretch">
            {stages.map((stage, i) => (
              <div key={stage.n} className="contents">
                <article className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:-translate-y-1 hover:border-cyan-400/30">
                  <div className="flex items-center justify-between"><span className="font-mono text-xs text-cyan-400">STAGE {stage.n}</span>{stage.agents.length > 1 && <GitBranch className="h-4 w-4 text-fuchsia-400" />}</div>
                  <h3 className="mt-4 font-semibold text-white">{stage.title}</h3>
                  <div className="mt-4 space-y-2">{stage.agents.map(a => <div key={a} className="rounded-lg bg-black/20 px-3 py-2 text-xs text-slate-300">{a}</div>)}</div>
                  <p className="mt-4 border-t border-white/5 pt-3 text-xs leading-5 text-slate-500">{stage.output}</p>
                </article>
                {i < stages.length - 1 && <div className="grid place-items-center text-slate-600"><ArrowRight className="hidden h-4 w-4 xl:block" /><ArrowDown className="h-4 w-4 xl:hidden" /></div>}
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.25em] text-cyan-400">Context routing</p>
              <h2 className="mt-2 text-2xl font-semibold">What every agent actually receives</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-500">Upstream JSON is reduced into token-light summaries before prompt injection. Context is selected by each prompt builder; agents do not receive the entire project document.</p>
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
            <div className="hidden grid-cols-[.55fr_1.15fr_2fr_1.1fr_1.8fr] gap-4 border-b border-white/10 bg-white/[0.035] px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 md:grid">
              <span>Stage</span><span>Agent</span><span>Prompt context</span><span>Writes</span><span>Execution capability</span>
            </div>
            {contextMap.map(([stage, agent, context, output, capability]) => (
              <article key={agent} className="grid gap-3 border-b border-white/5 px-5 py-4 last:border-0 md:grid-cols-[.55fr_1.15fr_2fr_1.1fr_1.8fr] md:items-center md:gap-4">
                <span className="font-mono text-xs text-cyan-400">{stage}</span>
                <span className="text-sm font-medium text-white">{agent}</span>
                <span className="text-xs leading-5 text-slate-400">{context}</span>
                <span className="text-xs text-violet-300">{output}</span>
                <span className="text-xs leading-5 text-slate-500">{capability}</span>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <article className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-5">
              <FileSearch className="h-5 w-5 text-amber-300" />
              <h3 className="mt-4 font-semibold text-white">RAG status: not implemented</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">There are no embeddings, vector database, document chunks, similarity search, citations, or retrieval-ranking pipeline in the current backend.</p>
            </article>
            <article className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-5">
              <Workflow className="h-5 w-5 text-cyan-300" />
              <h3 className="mt-4 font-semibold text-white">What grounding exists</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">Four deterministic summarizers compact executive, requirements, architecture, and backlog data. Prompt builders choose which summaries to inject with the original idea.</p>
            </article>
            <article className="rounded-2xl border border-violet-400/20 bg-violet-400/[0.04] p-5">
              <Wrench className="h-5 w-5 text-violet-300" />
              <h3 className="mt-4 font-semibold text-white">Tool boundary</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">Role-specific deterministic tools enrich model output with market, prioritization, sizing, security, staffing, schedule, and DevOps data. Diagram/Mermaid and cost generation remain trusted Python post-processors.</p>
            </article>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm leading-6 text-slate-400">
            <span className="font-semibold text-white">Stage-context rule:</span> Every stage starts after its prerequisite stage finishes. With Groq’s default serialized peer scheduling, later peers can also see sections completed earlier in the same stage; other providers may raise the configured concurrency when their rate limits allow it.
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-emerald-400">Project assistant</p>
            <h2 className="mt-3 text-xl font-semibold">Grounded chat, separate from the graph</h2>
            <p className="mt-4 text-sm leading-6 text-slate-400">Chat receives a compact project briefing plus a project-scoped hybrid retrieval over uploaded sources, validated outputs, and durable decisions. Retrieved claims carry stable source citations; only the latest six bounded conversation turns are included.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-violet-400">Prompt assembly</p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-300">
              {['Role prompt', 'Scoped dependencies', 'Hybrid RAG evidence', 'Specialist tools', 'Target JSON Schema', 'Validated JSON'].map((item, i) => (
                <div key={item} className="contents"><span className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">{item}</span>{i < 5 && <ArrowRight className="h-3.5 w-3.5 text-slate-600" />}</div>
              ))}
            </div>
            <p className="mt-5 text-xs leading-5 text-slate-500">The schema is injected into the system message. JSON mode is requested when supported, balanced JSON is extracted, and Pydantic validates it before the result enters shared workflow context.</p>
          </div>
        </section>

        <AgentTraceDemo />

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:col-span-2">
            <div className="flex items-center gap-3"><Workflow className="h-5 w-5 text-violet-400" /><h2 className="text-xl font-semibold">Request-to-response flow</h2></div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                [LockKeyhole, '1. Authenticate', 'Clerk token is verified; the user is upserted in PostgreSQL.'],
                [Database, '2. Create project', 'FastAPI writes a workspace-owned project and a durable PostgreSQL orchestration job.'],
                [Zap, '3. Dispatch workflow', 'A backend worker dequeues the job and opens a streaming HTTP request to AI Services.'],
                [Bot, '4. Retrieve + run graph', 'Each specialist retrieves tenant-scoped sources and memories, calls dedicated tools, and returns Pydantic-validated data.'],
                [Radio, '5. Stream events', 'AI Services emits newline-delimited node, log, progress, section, error, and completion events.'],
                [CheckCircle2, '6. Apply + replay', 'The backend appends events and sections to PostgreSQL; any API replica can replay them to WebSocket clients.'],
              ].map(([Icon, title, body]) => {
                const C = Icon as typeof Bot
                return <article key={String(title)} className="rounded-xl border border-white/5 bg-black/20 p-4"><C className="h-4 w-4 text-cyan-400" /><h3 className="mt-3 text-sm font-medium text-white">{String(title)}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{String(body)}</p></article>
              })}
            </div>
          </div>
          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.04] p-6">
            <div className="flex items-center gap-3"><Braces className="h-5 w-5 text-cyan-300" /><h2 className="text-xl font-semibold">Structured generation</h2></div>
            <div className="mt-7 space-y-5">
              {['Resolve model by agent role', 'Inject target JSON Schema', 'Request JSON response mode', 'Extract balanced JSON object', 'Validate with Pydantic', 'Retry up to 3× with validation feedback'].map((x, i) => <div key={x} className="flex gap-3"><span className="font-mono text-xs text-cyan-500">0{i + 1}</span><span className="text-sm text-slate-300">{x}</span></div>)}
            </div>
          </div>
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-[.25em] text-violet-400">Agent registry</p>
          <h2 className="mt-2 text-2xl font-semibold">One execution primitive, eight configurations</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">A frozen Agent dataclass binds identity, role, graph node, system prompt, user-prompt builder, and output schema. The behavior is configuration; execution and validation stay consistent.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {agents.map(([name, role, schema], i) => <article key={name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><div className="flex items-center justify-between"><Bot className="h-4 w-4 text-violet-400" /><span className="font-mono text-[10px] text-slate-600">A{i + 1}</span></div><h3 className="mt-4 text-sm font-semibold text-white">{name}</h3><p className="mt-1 text-xs text-slate-500">{role}</p><div className="mt-4 rounded-md bg-black/20 px-2.5 py-2 font-mono text-[10px] text-cyan-300">{schema}</div></article>)}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
            <div className="flex items-center gap-3"><Layers3 className="h-5 w-5 text-emerald-400" /><h2 className="text-xl font-semibold">Runtime topology</h2></div>
            <div className="mt-8 space-y-3">
              {[
                ['FastAPI API', 'Clerk JWT verification · user upsert · ownership checks · project and chat routes'],
                ['Orchestrator worker', 'PostgreSQL SKIP LOCKED queue · worker leases · streamed consumption · reconnects'],
                ['AI Services', 'Streaming WorkflowEngine task · LangGraph agents · prompts · tools · schemas · assistant'],
                ['RAG and event store', 'pgvector + full-text retrieval · durable memories · append-only job event replay'],
                ['PostgreSQL', 'Workspace tenancy · project JSONB · sources/chunks · agent runs/steps · revisions'],
                ['LLM client', 'AsyncOpenAI-compatible client · Groq, Ollama, or generic endpoint · per-agent model profiles'],
              ].map(([name, detail], i) => <div key={name} className="flex items-center gap-4 rounded-xl border border-white/5 bg-black/20 p-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-400/10 font-mono text-xs text-emerald-400">{i + 1}</span><div><h3 className="text-sm font-medium text-white">{name}</h3><p className="mt-1 text-xs text-slate-500">{detail}</p></div><ChevronRight className="ml-auto h-4 w-4 text-slate-700" /></div>)}
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6"><div className="flex items-center gap-3"><RefreshCw className="h-5 w-5 text-amber-400" /><h2 className="font-semibold">Failure behavior</h2></div><p className="mt-4 text-sm leading-6 text-slate-400">Provider and schema retries have separate budgets. Minute limits honor reset hints, daily quotas fail fast, and incomplete sections remain checkpointed. Worker leases recover abandoned jobs; PostgreSQL retains the current event stream for replica-safe replay.</p></div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-cyan-400" /><h2 className="font-semibold">Data boundaries</h2></div><p className="mt-4 text-sm leading-6 text-slate-400">REST and WebSocket access requires a verified Clerk user and workspace membership. Retrieval SQL filters both workspace_id and project_id. Sources, chunks, memories, runs, events, and generated responses cascade from their owning tenant/project.</p></div>
            <div className="rounded-3xl border border-violet-400/20 bg-violet-400/[0.05] p-6"><div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-violet-300" /><h2 className="font-semibold">Derived artifacts</h2></div><p className="mt-4 text-sm leading-6 text-slate-400">Architecture diagrams and Mermaid source are derived after the architect agent. Cost is computed deterministically from the team plan, duration, and complexity—not generated as a separate LLM guess.</p></div>
          </div>
        </section>

        <footer className="flex flex-col items-start justify-between gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center"><p className="text-xs text-slate-600">Audited against <code>backend/</code> and <code>ai-services/</code>. Frontend state was not used as an architecture source.</p><Link href="/" className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300">Explore the product <ArrowRight className="h-4 w-4" /></Link></footer>
      </div>
    </main>
  )
}
