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
  { n: '04', title: 'Plan in parallel', agents: ['Sprint Planner', 'Risk Analyst', 'Team Allocation'], output: 'Backlog · risks · team · cost', tone: 'fuchsia' },
  { n: '05', title: 'Deliver in parallel', agents: ['Timeline Agent', 'Integration Agent'], output: 'Roadmap · integrations', tone: 'emerald' },
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
            This map is derived from the executable backend and AI-services code—not from the frontend presentation. Devflow does not currently use LangChain or LangGraph. It runs a fixed asynchronous Python workflow that passes accumulated project context through role-specific prompts, validates agent output with Pydantic, and publishes progress through Redis.
          </p>
        </header>

        <section>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[.25em] text-cyan-400">Execution graph</p><h2 className="mt-2 text-2xl font-semibold">Five stages, controlled parallelism</h2></div>
            <p className="hidden max-w-md text-right text-sm text-slate-500 md:block">Stages are sequential. Agents inside stages 4 and 5 execute concurrently with <code className="text-slate-300">asyncio.gather</code>.</p>
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
              <p className="mt-2 text-sm leading-6 text-slate-400">Agents have no callable tools and cannot browse, query PostgreSQL, or search Redis. Diagram/Mermaid and cost generation are trusted Python post-processors run by the workflow engine.</p>
            </article>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm leading-6 text-slate-400">
            <span className="font-semibold text-white">Parallel-context rule:</span> Stage 4 agents start from the same completed Stage 3 context. Although Team Allocation’s prompt builder supports a backlog summary, the Sprint Planner runs beside it, so that backlog is not available to Team Allocation in this graph. Stage 5 starts only after Stage 4 finishes, allowing Timeline to consume the backlog.
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-emerald-400">Project assistant</p>
            <h2 className="mt-3 text-xl font-semibold">Grounded chat, separate from the graph</h2>
            <p className="mt-4 text-sm leading-6 text-slate-400">Chat receives a compact briefing built from the stored project: idea, executive summary, requirements, architecture, backlog, risks, team, cost, timeline, and integrations when available. It also receives only the latest six conversation turns, truncated per turn.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-violet-400">Prompt assembly</p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-300">
              {['Role system prompt', 'Selected context summaries', 'Original idea', 'Target JSON Schema', 'Model profile', 'Validated JSON'].map((item, i) => (
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
                [Database, '2. Create project', 'FastAPI writes the user-owned project and queues its ID in Redis.'],
                [Zap, '3. Dispatch workflow', 'A backend worker pops the job, subscribes first, then asks AI Services to start a background run.'],
                [Bot, '4. Run fixed graph', 'Each agent receives the accumulated context and returns Pydantic-validated structured data.'],
                [Radio, '5. Publish events', 'AI Services publishes sequenced node, log, progress, section, error, and completion events.'],
                [CheckCircle2, '6. Apply + relay', 'The backend buffers events, applies generated sections to PostgreSQL, and serves snapshot, replay, and live WebSocket data.'],
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
                ['Orchestrator worker', 'BRPOP analysis queue · pre-subscribe · event consumption · run timeout'],
                ['AI Services', 'Background WorkflowEngine task · agent registry · prompts · schemas · assistant'],
                ['Redis', 'Analysis queue · events:{project_id} pub/sub · capped replay list with TTL'],
                ['PostgreSQL', 'Users · user-owned project JSONB · generated-section and chat response rows'],
                ['LLM client', 'AsyncOpenAI-compatible client · Groq, Ollama, or generic endpoint · per-agent model profiles'],
              ].map(([name, detail], i) => <div key={name} className="flex items-center gap-4 rounded-xl border border-white/5 bg-black/20 p-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-400/10 font-mono text-xs text-emerald-400">{i + 1}</span><div><h3 className="text-sm font-medium text-white">{name}</h3><p className="mt-1 text-xs text-slate-500">{detail}</p></div><ChevronRight className="ml-auto h-4 w-4 text-slate-700" /></div>)}
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6"><div className="flex items-center gap-3"><RefreshCw className="h-5 w-5 text-amber-400" /><h2 className="font-semibold">Failure behavior</h2></div><p className="mt-4 text-sm leading-6 text-slate-400">Provider and schema-validation failures are attempted up to three times; validation retries include the exact Pydantic error. An exhausted agent emits an error and the remaining graph continues. A backend run timeout marks the project failed. The replay list is capped at 2,000 events and expires after the configured TTL (24 hours by default).</p></div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-cyan-400" /><h2 className="font-semibold">Data boundaries</h2></div><p className="mt-4 text-sm leading-6 text-slate-400">User-facing project REST and WebSocket access is scoped to the verified Clerk user ID. Internal workers resolve trusted project IDs dequeued from Redis. Projects belong to users; AI-response rows belong to both a user and project, with cascading foreign keys.</p></div>
            <div className="rounded-3xl border border-violet-400/20 bg-violet-400/[0.05] p-6"><div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-violet-300" /><h2 className="font-semibold">Derived artifacts</h2></div><p className="mt-4 text-sm leading-6 text-slate-400">Architecture diagrams and Mermaid source are derived after the architect agent. Cost is computed deterministically from the team plan, duration, and complexity—not generated as a separate LLM guess.</p></div>
          </div>
        </section>

        <footer className="flex flex-col items-start justify-between gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center"><p className="text-xs text-slate-600">Audited against <code>backend/</code> and <code>ai-services/</code>. Frontend state was not used as an architecture source.</p><Link href="/" className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300">Explore the product <ArrowRight className="h-4 w-4" /></Link></footer>
      </div>
    </main>
  )
}
