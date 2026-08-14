'use client'

import { useState } from 'react'
import { ArrowRight, Bot, Braces, Database, Radio, Wrench } from 'lucide-react'

type Trace = {
  id: string
  name: string
  section: string
  schema: string
  context: string[]
  output: unknown
  processor: string
}

const traces: Trace[] = [
  {
    id: 'ceo', name: 'CEO', section: 'executive_summary', schema: 'ExecutiveSummary',
    context: ['idea'], processor: 'No post-processor',
    output: { project_title: 'LaunchMap', tagline: 'From idea to an executable delivery plan', vision: 'Make software planning concrete and measurable.', overview: 'An AI-assisted planning workspace for founders.', business_goals: ['Reduce planning time', 'Improve delivery confidence'], success_criteria: ['Plan generated in under 5 minutes', 'Every task has an owner'], target_users: ['Startup founders'], key_differentiators: ['Coordinated specialist analysis'], complexity_score: 62, complexity_label: 'High', estimated_duration_weeks: 16, recommended_team_size: 6 },
  },
  {
    id: 'product_manager', name: 'Product Manager', section: 'requirements', schema: 'RequirementsBundle',
    context: ['idea', 'executive_summary (compact summary)'], processor: 'No post-processor',
    output: { functional_requirements: [{ title: 'Generate project plan', category: 'ai', description: 'Create a structured plan from an idea.', priority: 'high' }, { title: 'Project workspace', category: 'frontend', description: 'Display generated sections.', priority: 'high' }, { title: 'Persist projects', category: 'backend', description: 'Store plans per user.', priority: 'high' }], non_functional_requirements: [{ title: 'Tenant isolation', category: 'security', description: 'Users access only their projects.', priority: 'high' }, { title: 'Reliable generation', category: 'ai', description: 'Validate structured output.', priority: 'high' }], user_stories: [{ as_a: 'founder', i_want: 'a generated plan', so_that: 'I can start delivery', acceptance_criteria: ['All plan sections are visible'], priority: 'high' }, { as_a: 'founder', i_want: 'saved projects', so_that: 'I can return later', acceptance_criteria: ['Projects survive a new session'], priority: 'high' }, { as_a: 'founder', i_want: 'progress updates', so_that: 'I know generation is active', acceptance_criteria: ['Progress updates arrive live'], priority: 'medium' }], scope_in: ['Planning', 'Persistent workspaces'], scope_out: ['Source-code generation'] },
  },
  {
    id: 'architect', name: 'System Architect', section: 'architecture', schema: 'ArchitectureBundle',
    context: ['idea', 'executive_summary (summary)', 'requirements (summary)'], processor: 'build_diagram() + build_mermaid()',
    output: { frontend: { summary: 'Web application', components: ['Landing', 'Workspace'], technologies: ['Next.js'], decisions: ['Server/client component split'] }, backend: { summary: 'API and orchestration', components: ['FastAPI API', 'Worker'], technologies: ['FastAPI'], decisions: ['Async event flow'] }, database: { summary: 'Durable tenant data', components: ['Users', 'Projects', 'Knowledge chunks'], technologies: ['PostgreSQL', 'pgvector'], decisions: ['JSONB project read model', 'Hybrid retrieval'] }, infrastructure: { summary: 'Container runtime', components: ['Application containers', 'Managed PostgreSQL'], technologies: ['Docker'], decisions: ['Service separation'] }, technology_recommendations: ['Use typed contracts', 'Keep AI workers isolated'], scalability_plan: ['Add workers', 'Pool database connections'], integration_points: ['Clerk', 'LLM provider'] },
  },
  {
    id: 'sprint_planner', name: 'Sprint Planner', section: 'backlog', schema: 'SprintPlan',
    context: ['idea', 'executive_summary (summary)', 'requirements (summary)', 'architecture (summary)'], processor: 'No post-processor',
    output: { methodology: 'Scrum', sprint_length_weeks: 2, epics: [{ title: 'Foundation', description: 'Core platform' }, { title: 'AI Planning', description: 'Generation workflow' }], tasks: [{ title: 'Create project API', description: 'Persist a user-owned project.', category: 'backend', epic: 'Foundation', estimated_days: 3, priority: 'high', sprint: 1, dependencies: [] }, { title: 'Build workspace', description: 'Render plan sections.', category: 'frontend', epic: 'Foundation', estimated_days: 5, priority: 'high', sprint: 1, dependencies: ['Create project API'] }, { title: 'Add workflow engine', description: 'Run staged agents.', category: 'ai', epic: 'AI Planning', estimated_days: 5, priority: 'high', sprint: 2, dependencies: ['Create project API'] }, { title: 'Stream events', description: 'Relay workflow events.', category: 'backend', epic: 'AI Planning', estimated_days: 3, priority: 'medium', sprint: 2, dependencies: ['Add workflow engine'] }, { title: 'Test tenant isolation', description: 'Verify ownership checks.', category: 'qa', epic: 'Foundation', estimated_days: 2, priority: 'high', sprint: 2, dependencies: ['Create project API'] }], sprints: [{ number: 1, name: 'Core', goal: 'Establish the platform', task_titles: ['Create project API', 'Build workspace'] }, { number: 2, name: 'Intelligence', goal: 'Deliver planning', task_titles: ['Add workflow engine', 'Stream events', 'Test tenant isolation'] }] },
  },
  {
    id: 'risk', name: 'Risk Analyst', section: 'risks', schema: 'RiskBundle',
    context: ['idea', 'executive_summary (summary)', 'requirements (summary)', 'architecture (summary)'], processor: 'No post-processor',
    output: { risks: [{ title: 'Invalid model output', description: 'Provider output may violate contracts.', category: 'technical', severity: 'high', probability: 45, impact: 75, mitigation: 'Validate with Pydantic and retry.' }, { title: 'Weak product fit', description: 'Plans may not match user needs.', category: 'product', severity: 'medium', probability: 35, impact: 65, mitigation: 'Collect structured feedback.' }, { title: 'Schedule drift', description: 'Tasks may exceed estimates.', category: 'delivery', severity: 'medium', probability: 50, impact: 55, mitigation: 'Track milestone variance.' }, { title: 'Tenant leakage', description: 'A user could access another project.', category: 'security', severity: 'critical', probability: 15, impact: 100, mitigation: 'Scope public queries by Clerk user ID.' }, { title: 'Worker saturation', description: 'Generation demand may exceed capacity.', category: 'scalability', severity: 'medium', probability: 40, impact: 60, mitigation: 'Scale queue workers horizontally.' }], overall_risk_level: 'High', summary: 'Security and structured-output reliability need early controls.' },
  },
  {
    id: 'team_allocation', name: 'Team Allocation', section: 'team', schema: 'TeamPlan',
    context: ['idea', 'executive_summary (summary)', 'architecture (summary)'], processor: 'compute_cost(team, duration, complexity) → separate cost section',
    output: { members: [{ role: 'Engineering Lead', seniority: 'Lead', count: 1, skills: ['Architecture'], responsibilities: ['Technical direction'], allocation_pct: 100 }, { role: 'Backend Engineer', seniority: 'Senior', count: 2, skills: ['Python', 'PostgreSQL'], responsibilities: ['API and orchestration'], allocation_pct: 100 }, { role: 'Frontend Engineer', seniority: 'Senior', count: 2, skills: ['Next.js'], responsibilities: ['Product UI'], allocation_pct: 100 }], staffing_notes: ['Add QA support before beta'], ownership: ['Engineering Lead owns architecture'] },
  },
  {
    id: 'timeline', name: 'Timeline', section: 'timeline', schema: 'TimelinePlan',
    context: ['idea', 'executive_summary (summary)', 'architecture (summary)', 'backlog (summary)'], processor: 'No post-processor',
    output: { milestones: [{ title: 'MVP', description: 'Core planning flow', phase: 'mvp', start_week: 0, duration_weeks: 6, deliverables: ['Authenticated workspace'], dependencies: [] }, { title: 'Beta', description: 'Validated workflows', phase: 'beta', start_week: 6, duration_weeks: 4, deliverables: ['Reliable generation'], dependencies: ['MVP'] }, { title: 'Production', description: 'Operational release', phase: 'production', start_week: 10, duration_weeks: 4, deliverables: ['Monitoring and support'], dependencies: ['Beta'] }], total_duration_weeks: 14, critical_path: ['MVP', 'Beta', 'Production'] },
  },
  {
    id: 'integration', name: 'Integration', section: 'integrations', schema: 'IntegrationBundle',
    context: ['idea', 'executive_summary (summary)', 'architecture (summary)'], processor: 'No post-processor',
    output: { integrations: [{ name: 'GitHub', category: 'github', purpose: 'Source and issue tracking', steps: ['Create an OAuth app'] }, { name: 'Calendar', category: 'calendar', purpose: 'Milestone scheduling', steps: ['Configure calendar API credentials'] }], deployment_plan: ['Build service containers', 'Deploy with managed PostgreSQL and pgvector'], cicd_recommendations: ['Run tests and schema checks before deployment'] },
  },
]

function JsonBlock({ value }: { value: unknown }) {
  return <pre className="max-h-[30rem] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#03050d] p-4 font-mono text-[11px] leading-5 text-cyan-200">{JSON.stringify(value, null, 2)}</pre>
}

export function AgentTraceDemo() {
  const [selected, setSelected] = useState(0)
  const trace = traces[selected]
  const graphNodes: Record<string, string> = { ceo: 'idea', product_manager: 'requirements', architect: 'architecture', sprint_planner: 'tasks', risk: 'risk', team_allocation: 'cost', timeline: 'execution', integration: 'execution' }
  const event = { type: 'section_complete', agent: trace.id, section: trace.section, node: graphNodes[trace.id], data: trace.output, project_id: 'proj_demo_01', seq: 14, ts: 1786000000.123 }

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[.25em] text-fuchsia-400">Interactive execution trace</p>
      <h2 className="mt-2 text-2xl font-semibold">Follow one response from prompt to PostgreSQL</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">Choose an agent to inspect an illustrative payload. Values are demo data; object shapes, event fields, processors, section names, and storage behavior match the running code.</p>

      <div className="mt-7 flex gap-2 overflow-x-auto pb-2">
        {traces.map((item, i) => <button key={item.id} onClick={() => setSelected(i)} className={`shrink-0 rounded-lg border px-3 py-2 text-xs transition ${selected === i ? 'border-fuchsia-400/60 bg-fuchsia-400/10 text-white' : 'border-white/10 bg-white/[0.03] text-slate-500 hover:text-slate-300'}`}>{item.name}</button>)}
      </div>

      <div className="mt-4 grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <div className="space-y-4">
          <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center gap-2"><Bot className="h-4 w-4 text-fuchsia-300" /><h3 className="font-semibold">1. Prompt input</h3></div>
            <div className="mt-4 flex flex-wrap gap-2">{trace.context.map(x => <span key={x} className="rounded-md bg-black/30 px-2.5 py-1.5 font-mono text-[11px] text-slate-300">{x}</span>)}</div>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center gap-2"><Braces className="h-4 w-4 text-cyan-300" /><h3 className="font-semibold">2. Structured generation</h3></div>
            <p className="mt-3 text-xs leading-5 text-slate-400"><code>{trace.schema}</code> JSON Schema is injected → model responds → balanced JSON is extracted → Pydantic validates.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center gap-2"><Wrench className="h-4 w-4 text-violet-300" /><h3 className="font-semibold">3. Processor</h3></div>
            <p className="mt-3 font-mono text-xs text-violet-200">{trace.processor}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center gap-2"><Radio className="h-4 w-4 text-amber-300" /><h3 className="font-semibold">4. HTTP event stream</h3></div>
            <p className="mt-3 text-xs leading-5 text-slate-400">Emitted as newline-delimited JSON to the backend, appended to the durable job event log, then replayed by any WebSocket-serving API replica.</p>
          </article>
          <article className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5">
            <div className="flex items-center gap-2"><Database className="h-4 w-4 text-emerald-300" /><h3 className="font-semibold">5. PostgreSQL writes</h3></div>
            <div className="mt-3 space-y-2 font-mono text-[11px] leading-5 text-emerald-100/80"><p>projects.document[&quot;{trace.section}&quot;] = event.data</p><p>ai_responses.kind = &quot;section:{trace.section}&quot;</p><p>ai_responses.payload = event.data</p><p>projects.updated_at = NOW()</p></div>
          </article>
        </div>

        <div className="space-y-4">
          <article className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.025] p-5">
            <div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">Validated agent JSON</h3><span className="rounded-full bg-cyan-400/10 px-2.5 py-1 font-mono text-[10px] text-cyan-300">{trace.schema}</span></div>
            <JsonBlock value={trace.output} />
          </article>
          <div className="flex items-center justify-center gap-3 text-xs text-slate-500"><span>validated data</span><ArrowRight className="h-4 w-4" /><span>event envelope</span></div>
          <details className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <summary className="cursor-pointer text-sm font-semibold text-white">Inspect the streamed <code>section_complete</code> event</summary>
            <div className="mt-4"><JsonBlock value={event} /></div>
          </details>
        </div>
      </div>
    </section>
  )
}
