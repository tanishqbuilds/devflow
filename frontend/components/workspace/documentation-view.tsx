'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Download,
  Copy,
  Check,
  Printer,
  FileCode2,
  Sparkles,
} from 'lucide-react'
import { useProjectStore } from '@/lib/project-store'
import type { ProjectDoc } from '@/lib/project-types'

const MAX_LIST = 12

function priorityClass(p?: string): string {
  switch ((p || '').toLowerCase()) {
    case 'critical':
    case 'high':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30'
    case 'medium':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    case 'low':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    default:
      return 'bg-slate-500/15 text-slate-300 border-slate-500/30'
  }
}

function truncate<T>(arr: T[] | undefined | null): { items: T[]; more: number } {
  const list = arr || []
  return { items: list.slice(0, MAX_LIST), more: Math.max(0, list.length - MAX_LIST) }
}

// ---------------------------------------------------------------------------
// Markdown builder — produces a sensible '# Title' -> '## Section' document.
// ---------------------------------------------------------------------------
function buildMarkdown(project: ProjectDoc): string {
  const out: string[] = []
  const exec = project.executive_summary
  const title = exec?.project_title || project.title || 'Project Plan'
  out.push(`# ${title}`)
  if (exec?.tagline) out.push(`> ${exec.tagline}`)
  if (project.idea) out.push(`\n*${project.idea}*`)

  const bullets = (items?: (string | undefined)[]) =>
    (items || []).filter(Boolean).map((i) => `- ${i}`).join('\n')

  if (exec) {
    out.push('\n## Executive Summary')
    if (exec.overview) out.push(exec.overview)
    if (exec.vision) out.push(`\n**Vision:** ${exec.vision}`)
    const meta: string[] = []
    if (exec.complexity_label) meta.push(`Complexity: ${exec.complexity_label} (${exec.complexity_score})`)
    if (exec.estimated_duration_weeks) meta.push(`Duration: ${exec.estimated_duration_weeks} weeks`)
    if (exec.recommended_team_size) meta.push(`Team size: ${exec.recommended_team_size}`)
    if (meta.length) out.push(`\n${meta.join(' · ')}`)
    if (exec.business_goals?.length) out.push(`\n### Business Goals\n${bullets(exec.business_goals)}`)
    if (exec.success_criteria?.length) out.push(`\n### Success Criteria\n${bullets(exec.success_criteria)}`)
    if (exec.target_users?.length) out.push(`\n### Target Users\n${bullets(exec.target_users)}`)
    if (exec.key_differentiators?.length) out.push(`\n### Key Differentiators\n${bullets(exec.key_differentiators)}`)
  }

  const req = project.requirements
  if (req) {
    out.push('\n## Requirements')
    if (req.functional_requirements?.length) {
      out.push('\n### Functional')
      out.push(req.functional_requirements.map((r) => `- **${r.title}** (${r.priority}) — ${r.description}`).join('\n'))
    }
    if (req.non_functional_requirements?.length) {
      out.push('\n### Non-Functional')
      out.push(req.non_functional_requirements.map((r) => `- **${r.title}** (${r.priority}) — ${r.description}`).join('\n'))
    }
    if (req.user_stories?.length) {
      out.push('\n### User Stories')
      out.push(req.user_stories.map((s) => `- As a ${s.as_a}, I want ${s.i_want} so that ${s.so_that}`).join('\n'))
    }
    if (req.scope_in?.length) out.push(`\n### In Scope\n${bullets(req.scope_in)}`)
    if (req.scope_out?.length) out.push(`\n### Out of Scope\n${bullets(req.scope_out)}`)
  }

  const arch = project.architecture
  if (arch) {
    out.push('\n## Architecture')
    const layers: [string, typeof arch.frontend][] = [
      ['Frontend', arch.frontend],
      ['Backend', arch.backend],
      ['Database', arch.database],
      ['Infrastructure', arch.infrastructure],
    ]
    for (const [name, layer] of layers) {
      if (!layer) continue
      out.push(`\n### ${name}`)
      if (layer.summary) out.push(layer.summary)
      if (layer.technologies?.length) out.push(`*Tech:* ${layer.technologies.join(', ')}`)
      if (layer.components?.length) out.push(`*Components:* ${layer.components.join(', ')}`)
    }
    if (arch.technology_recommendations?.length)
      out.push(`\n### Technology Recommendations\n${bullets(arch.technology_recommendations)}`)
    if (arch.scalability_plan?.length) out.push(`\n### Scalability Plan\n${bullets(arch.scalability_plan)}`)
  }

  const backlog = project.backlog
  if (backlog) {
    out.push('\n## Backlog')
    out.push(
      `Methodology: ${backlog.methodology || 'n/a'} · Sprint length: ${backlog.sprint_length_weeks || 0} weeks · ${
        backlog.tasks?.length || 0
      } tasks`,
    )
    if (backlog.epics?.length) {
      out.push('\n### Epics')
      out.push(backlog.epics.map((e) => `- **${e.title}** — ${e.description}`).join('\n'))
    }
    if (backlog.sprints?.length) {
      out.push('\n### Sprints')
      out.push(
        backlog.sprints
          .map((s) => `- Sprint ${s.number}: ${s.name} — ${s.goal} (${s.task_titles?.length || 0} tasks)`)
          .join('\n'),
      )
    }
  }

  const risks = project.risks
  if (risks) {
    out.push('\n## Risks')
    if (risks.overall_risk_level) out.push(`**Overall risk level:** ${risks.overall_risk_level}`)
    if (risks.summary) out.push(risks.summary)
    if (risks.risks?.length) {
      out.push('')
      out.push(
        risks.risks
          .map((r) => `- **${r.title}** (${r.severity}) — ${r.description}\n  - *Mitigation:* ${r.mitigation}`)
          .join('\n'),
      )
    }
  }

  const team = project.team
  if (team) {
    out.push('\n## Team')
    if (team.members?.length) {
      out.push(
        team.members
          .map((m) => `- **${m.count}× ${m.seniority} ${m.role}** (${m.allocation_pct}% allocation) — ${(m.skills || []).join(', ')}`)
          .join('\n'),
      )
    }
    if (team.staffing_notes?.length) out.push(`\n### Staffing Notes\n${bullets(team.staffing_notes)}`)
  }

  const cost = project.cost
  if (cost) {
    out.push('\n## Cost')
    out.push(
      `**Monthly:** $${Math.round(cost.monthly_total_usd || 0).toLocaleString()} · **Project total:** $${Math.round(
        cost.project_total_usd || 0,
      ).toLocaleString()} over ${cost.duration_months || 0} months`,
    )
    if (cost.lines?.length) {
      out.push('')
      out.push(
        cost.lines
          .map((l) => `- ${l.category}: $${Math.round(l.monthly_usd).toLocaleString()}/mo${l.notes ? ` — ${l.notes}` : ''}`)
          .join('\n'),
      )
    }
  }

  const timeline = project.timeline
  if (timeline) {
    out.push('\n## Timeline')
    if (timeline.total_duration_weeks) out.push(`**Total duration:** ${timeline.total_duration_weeks} weeks`)
    if (timeline.milestones?.length) {
      out.push('\n### Milestones')
      out.push(
        timeline.milestones
          .map((m) => `- **${m.title}** [${m.phase}] — week ${m.start_week} for ${m.duration_weeks}w. ${m.description}`)
          .join('\n'),
      )
    }
    if (timeline.critical_path?.length) out.push(`\n### Critical Path\n${bullets(timeline.critical_path)}`)
  }

  const integ = project.integrations
  if (integ) {
    out.push('\n## Integrations')
    if (integ.integrations?.length) {
      out.push(
        integ.integrations.map((i) => `- **${i.name}** (${i.category}) — ${i.purpose}`).join('\n'),
      )
    }
    if (integ.deployment_plan?.length) out.push(`\n### Deployment Plan\n${bullets(integ.deployment_plan)}`)
    if (integ.cicd_recommendations?.length) out.push(`\n### CI/CD Recommendations\n${bullets(integ.cicd_recommendations)}`)
  }

  return out.join('\n')
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-white/5 pt-6 first:border-t-0 first:pt-0">
      <h3 id={id} className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
        <span className="h-5 w-1 rounded-full bg-gradient-to-b from-primary to-secondary" />
        {title}
      </h3>
      <div className="space-y-3 text-sm">{children}</div>
    </section>
  )
}

function SubHead({ children }: { children: React.ReactNode }) {
  return <h4 className="text-sm font-semibold text-foreground/90 mt-2 mb-1 uppercase tracking-wide">{children}</h4>
}

function PlainList({ items }: { items: string[] }) {
  const { items: shown, more } = truncate(items)
  if (!shown.length) return null
  return (
    <ul className="list-disc pl-5 space-y-1 text-muted-foreground marker:text-primary/60">
      {shown.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
      {more > 0 && <li className="list-none text-xs text-muted-foreground/70 italic">+{more} more</li>}
    </ul>
  )
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-block text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${className || 'bg-white/5 text-muted-foreground border-white/10'}`}>
      {children}
    </span>
  )
}

const secondaryViolet = '#7c3aed'

export function DocumentationView() {
  const project = useProjectStore((s) => s.project)
  const [copied, setCopied] = useState(false)

  if (!project) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="glass-panel p-10 rounded-xl flex flex-col items-center justify-center text-center gap-4">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >
            <FileText className="w-10 h-10 text-primary" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Documentation &amp; Export</h2>
            <p className="text-muted-foreground mt-1">Documentation is being generated by the AI organization.</p>
          </div>
        </div>
      </motion.div>
    )
  }

  const exec = project.executive_summary
  const req = project.requirements
  const arch = project.architecture
  const backlog = project.backlog
  const risks = project.risks
  const team = project.team
  const cost = project.cost
  const timeline = project.timeline
  const integ = project.integrations

  const docTitle = exec?.project_title || project.title || 'Project Plan'

  const handleDownloadJson = () => {
    try {
      const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safe = (docTitle || 'devflow-project').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()
      a.download = `${safe || 'devflow-project'}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      /* no-op */
    }
  }

  const handleCopyMarkdown = async () => {
    try {
      const md = buildMarkdown(project)
      await navigator.clipboard.writeText(md)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard may be unavailable */
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <FileText className="w-7 h-7 text-primary" />
          Documentation &amp; Export
        </h2>
        <p className="text-muted-foreground">
          No lock-in. Take your entire plan with you — JSON, Markdown, or a printable PDF.
        </p>
      </div>

      {/* Export action bar */}
      <div className="glass-panel p-4 rounded-xl flex flex-wrap items-center gap-3 print:hidden">
        <button
          onClick={handleDownloadJson}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download JSON
        </button>
        <button
          onClick={handleCopyMarkdown}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
          style={{
            color: copied ? '#34d399' : secondaryViolet,
            borderColor: copied ? 'rgba(52,211,153,0.4)' : 'rgba(124,58,237,0.4)',
            backgroundColor: copied ? 'rgba(52,211,153,0.12)' : 'rgba(124,58,237,0.12)',
          }}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy as Markdown'}
        </button>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-foreground border border-white/10 hover:bg-white/10 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print / PDF
        </button>
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileCode2 className="w-3.5 h-3.5" />
          Open formats, zero lock-in
        </span>
      </div>

      {/* The document */}
      <article className="glass-panel p-8 rounded-xl space-y-8">
        {/* Doc title block */}
        <header className="space-y-2 pb-2">
          <h1 className="text-3xl font-bold text-foreground">{docTitle}</h1>
          {exec?.tagline && <p className="text-primary text-lg">{exec.tagline}</p>}
          {project.idea && <p className="text-sm text-muted-foreground italic max-w-3xl">{project.idea}</p>}
          <div className="flex flex-wrap gap-2 pt-1">
            {project.status && <Badge className="bg-primary/10 text-primary border-primary/30">{project.status}</Badge>}
            {typeof project.progress === 'number' && (
              <Badge className="bg-white/5 text-muted-foreground border-white/10">{project.progress}% complete</Badge>
            )}
          </div>
        </header>

        {/* Executive Summary */}
        {exec ? (
          <Section id="doc-exec" title="Executive Summary">
            {exec.overview && <p className="text-muted-foreground leading-relaxed">{exec.overview}</p>}
            {exec.vision && (
              <p className="text-foreground/80 leading-relaxed border-l-2 border-secondary/40 pl-4">{exec.vision}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {exec.complexity_label && (
                <Badge className="bg-secondary/10 text-violet-300 border-secondary/30">
                  Complexity: {exec.complexity_label} ({exec.complexity_score})
                </Badge>
              )}
              {exec.estimated_duration_weeks ? (
                <Badge className="bg-primary/10 text-primary border-primary/30">
                  ~{exec.estimated_duration_weeks} weeks
                </Badge>
              ) : null}
              {exec.recommended_team_size ? (
                <Badge className="bg-white/5 text-muted-foreground border-white/10">
                  {exec.recommended_team_size} people
                </Badge>
              ) : null}
            </div>
            {!!exec.business_goals?.length && (
              <div>
                <SubHead>Business Goals</SubHead>
                <PlainList items={exec.business_goals} />
              </div>
            )}
            {!!exec.success_criteria?.length && (
              <div>
                <SubHead>Success Criteria</SubHead>
                <PlainList items={exec.success_criteria} />
              </div>
            )}
            {!!exec.key_differentiators?.length && (
              <div>
                <SubHead>Key Differentiators</SubHead>
                <PlainList items={exec.key_differentiators} />
              </div>
            )}
          </Section>
        ) : null}

        {/* Requirements */}
        {req ? (
          <Section id="doc-req" title="Requirements">
            {!!req.functional_requirements?.length && (
              <div>
                <SubHead>Functional</SubHead>
                <div className="space-y-2">
                  {truncate(req.functional_requirements).items.map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Badge className={priorityClass(r.priority)}>{r.priority}</Badge>
                      <p className="text-muted-foreground">
                        <span className="text-foreground font-medium">{r.title}</span> — {r.description}
                      </p>
                    </div>
                  ))}
                  {truncate(req.functional_requirements).more > 0 && (
                    <p className="text-xs text-muted-foreground/70 italic">
                      +{truncate(req.functional_requirements).more} more
                    </p>
                  )}
                </div>
              </div>
            )}
            {!!req.non_functional_requirements?.length && (
              <div>
                <SubHead>Non-Functional</SubHead>
                <div className="space-y-2">
                  {truncate(req.non_functional_requirements).items.map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Badge className={priorityClass(r.priority)}>{r.priority}</Badge>
                      <p className="text-muted-foreground">
                        <span className="text-foreground font-medium">{r.title}</span> — {r.description}
                      </p>
                    </div>
                  ))}
                  {truncate(req.non_functional_requirements).more > 0 && (
                    <p className="text-xs text-muted-foreground/70 italic">
                      +{truncate(req.non_functional_requirements).more} more
                    </p>
                  )}
                </div>
              </div>
            )}
            {!!req.user_stories?.length && (
              <div>
                <SubHead>User Stories</SubHead>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground marker:text-secondary/60">
                  {truncate(req.user_stories).items.map((s, i) => (
                    <li key={i}>
                      As a <span className="text-foreground">{s.as_a}</span>, I want {s.i_want} so that {s.so_that}
                    </li>
                  ))}
                  {truncate(req.user_stories).more > 0 && (
                    <li className="list-none text-xs text-muted-foreground/70 italic">
                      +{truncate(req.user_stories).more} more
                    </li>
                  )}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!!req.scope_in?.length && (
                <div>
                  <SubHead>In Scope</SubHead>
                  <PlainList items={req.scope_in} />
                </div>
              )}
              {!!req.scope_out?.length && (
                <div>
                  <SubHead>Out of Scope</SubHead>
                  <PlainList items={req.scope_out} />
                </div>
              )}
            </div>
          </Section>
        ) : null}

        {/* Architecture */}
        {arch ? (
          <Section id="doc-arch" title="Architecture">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(
                [
                  ['Frontend', arch.frontend],
                  ['Backend', arch.backend],
                  ['Database', arch.database],
                  ['Infrastructure', arch.infrastructure],
                ] as const
              ).map(([name, layer]) =>
                layer ? (
                  <div key={name} className="bg-card/40 border border-white/5 rounded-lg p-4">
                    <p className="text-sm font-semibold text-foreground mb-1">{name}</p>
                    {layer.summary && <p className="text-xs text-muted-foreground mb-2">{layer.summary}</p>}
                    {!!layer.technologies?.length && (
                      <div className="flex flex-wrap gap-1.5">
                        {layer.technologies.slice(0, MAX_LIST).map((t, i) => (
                          <Badge key={i} className="bg-primary/10 text-primary border-primary/20">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null,
              )}
            </div>
            {!!arch.technology_recommendations?.length && (
              <div>
                <SubHead>Technology Recommendations</SubHead>
                <PlainList items={arch.technology_recommendations} />
              </div>
            )}
            {!!arch.scalability_plan?.length && (
              <div>
                <SubHead>Scalability Plan</SubHead>
                <PlainList items={arch.scalability_plan} />
              </div>
            )}
            {!!arch.integration_points?.length && (
              <div>
                <SubHead>Integration Points</SubHead>
                <PlainList items={arch.integration_points} />
              </div>
            )}
          </Section>
        ) : null}

        {/* Backlog */}
        {backlog ? (
          <Section id="doc-backlog" title="Backlog">
            <div className="flex flex-wrap gap-2">
              {backlog.methodology && (
                <Badge className="bg-secondary/10 text-violet-300 border-secondary/30">{backlog.methodology}</Badge>
              )}
              {backlog.sprint_length_weeks ? (
                <Badge className="bg-white/5 text-muted-foreground border-white/10">
                  {backlog.sprint_length_weeks}-week sprints
                </Badge>
              ) : null}
              <Badge className="bg-primary/10 text-primary border-primary/30">
                {backlog.tasks?.length || 0} tasks
              </Badge>
            </div>
            {!!backlog.epics?.length && (
              <div>
                <SubHead>Epics</SubHead>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground marker:text-primary/60">
                  {truncate(backlog.epics).items.map((e, i) => (
                    <li key={i}>
                      <span className="text-foreground font-medium">{e.title}</span> — {e.description}
                    </li>
                  ))}
                  {truncate(backlog.epics).more > 0 && (
                    <li className="list-none text-xs text-muted-foreground/70 italic">
                      +{truncate(backlog.epics).more} more
                    </li>
                  )}
                </ul>
              </div>
            )}
            {!!backlog.sprints?.length && (
              <div>
                <SubHead>Sprints</SubHead>
                <div className="space-y-2">
                  {truncate(backlog.sprints).items.map((s, i) => (
                    <div key={i} className="bg-card/40 border border-white/5 rounded-lg p-3">
                      <p className="text-sm text-foreground font-medium">
                        Sprint {s.number}: {s.name}
                      </p>
                      {s.goal && <p className="text-xs text-muted-foreground">{s.goal}</p>}
                      <p className="text-[11px] text-muted-foreground/70 mt-1">
                        {s.task_titles?.length || 0} tasks
                      </p>
                    </div>
                  ))}
                  {truncate(backlog.sprints).more > 0 && (
                    <p className="text-xs text-muted-foreground/70 italic">
                      +{truncate(backlog.sprints).more} more sprints
                    </p>
                  )}
                </div>
              </div>
            )}
          </Section>
        ) : null}

        {/* Risks */}
        {risks ? (
          <Section id="doc-risks" title="Risks">
            {risks.overall_risk_level && (
              <Badge className={priorityClass(risks.overall_risk_level)}>
                Overall: {risks.overall_risk_level}
              </Badge>
            )}
            {risks.summary && <p className="text-muted-foreground leading-relaxed">{risks.summary}</p>}
            {!!risks.risks?.length && (
              <div className="space-y-2">
                {truncate(risks.risks).items.map((r, i) => (
                  <div key={i} className="bg-card/40 border border-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={priorityClass(r.severity)}>{r.severity}</Badge>
                      <span className="text-sm text-foreground font-medium">{r.title}</span>
                      {r.category && <Badge>{r.category}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                    {r.mitigation && (
                      <p className="text-xs text-foreground/80 mt-1">
                        <span className="text-emerald-300">Mitigation:</span> {r.mitigation}
                      </p>
                    )}
                  </div>
                ))}
                {truncate(risks.risks).more > 0 && (
                  <p className="text-xs text-muted-foreground/70 italic">+{truncate(risks.risks).more} more</p>
                )}
              </div>
            )}
          </Section>
        ) : null}

        {/* Team */}
        {team ? (
          <Section id="doc-team" title="Team">
            {!!team.members?.length && (
              <div className="space-y-2">
                {truncate(team.members).items.map((m, i) => (
                  <div key={i} className="bg-card/40 border border-white/5 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm text-foreground font-medium">
                        {m.count}× {m.seniority} {m.role}
                      </p>
                      <Badge className="bg-primary/10 text-primary border-primary/30">{m.allocation_pct}%</Badge>
                    </div>
                    {!!m.skills?.length && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {m.skills.slice(0, MAX_LIST).map((sk, j) => (
                          <Badge key={j}>{sk}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {truncate(team.members).more > 0 && (
                  <p className="text-xs text-muted-foreground/70 italic">+{truncate(team.members).more} more roles</p>
                )}
              </div>
            )}
            {!!team.staffing_notes?.length && (
              <div>
                <SubHead>Staffing Notes</SubHead>
                <PlainList items={team.staffing_notes} />
              </div>
            )}
          </Section>
        ) : null}

        {/* Cost */}
        {cost ? (
          <Section id="doc-cost" title="Cost">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/30">
                ${Math.round(cost.monthly_total_usd || 0).toLocaleString()}/mo
              </Badge>
              <Badge className="bg-secondary/10 text-violet-300 border-secondary/30">
                ${Math.round(cost.project_total_usd || 0).toLocaleString()} total
              </Badge>
              {cost.duration_months ? (
                <Badge className="bg-white/5 text-muted-foreground border-white/10">
                  {cost.duration_months} months
                </Badge>
              ) : null}
            </div>
            {!!cost.lines?.length && (
              <div className="space-y-1.5">
                {truncate(cost.lines).items.map((l, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 bg-card/40 border border-white/5 rounded px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">{l.category}</p>
                      {l.notes && <p className="text-xs text-muted-foreground truncate">{l.notes}</p>}
                    </div>
                    <p className="text-sm font-semibold text-primary whitespace-nowrap">
                      ${Math.round(l.monthly_usd).toLocaleString()}/mo
                    </p>
                  </div>
                ))}
                {truncate(cost.lines).more > 0 && (
                  <p className="text-xs text-muted-foreground/70 italic">+{truncate(cost.lines).more} more lines</p>
                )}
              </div>
            )}
          </Section>
        ) : null}

        {/* Timeline */}
        {timeline ? (
          <Section id="doc-timeline" title="Timeline">
            {timeline.total_duration_weeks ? (
              <Badge className="bg-primary/10 text-primary border-primary/30">
                {timeline.total_duration_weeks} weeks total
              </Badge>
            ) : null}
            {!!timeline.milestones?.length && (
              <div>
                <SubHead>Milestones</SubHead>
                <div className="space-y-2">
                  {truncate(timeline.milestones).items.map((m, i) => (
                    <div key={i} className="bg-card/40 border border-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-foreground font-medium">{m.title}</span>
                        <Badge className="bg-secondary/10 text-violet-300 border-secondary/30">{m.phase}</Badge>
                        <span className="text-[11px] text-muted-foreground">
                          wk {m.start_week} · {m.duration_weeks}w
                        </span>
                      </div>
                      {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
                    </div>
                  ))}
                  {truncate(timeline.milestones).more > 0 && (
                    <p className="text-xs text-muted-foreground/70 italic">
                      +{truncate(timeline.milestones).more} more milestones
                    </p>
                  )}
                </div>
              </div>
            )}
            {!!timeline.critical_path?.length && (
              <div>
                <SubHead>Critical Path</SubHead>
                <PlainList items={timeline.critical_path} />
              </div>
            )}
          </Section>
        ) : null}

        {/* Integrations */}
        {integ ? (
          <Section id="doc-integ" title="Integrations">
            {!!integ.integrations?.length && (
              <div className="space-y-2">
                {truncate(integ.integrations).items.map((it, i) => (
                  <div key={i} className="bg-card/40 border border-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-foreground font-medium">{it.name}</span>
                      {it.category && <Badge>{it.category}</Badge>}
                    </div>
                    {it.purpose && <p className="text-xs text-muted-foreground">{it.purpose}</p>}
                  </div>
                ))}
                {truncate(integ.integrations).more > 0 && (
                  <p className="text-xs text-muted-foreground/70 italic">
                    +{truncate(integ.integrations).more} more
                  </p>
                )}
              </div>
            )}
            {!!integ.deployment_plan?.length && (
              <div>
                <SubHead>Deployment Plan</SubHead>
                <PlainList items={integ.deployment_plan} />
              </div>
            )}
            {!!integ.cicd_recommendations?.length && (
              <div>
                <SubHead>CI/CD Recommendations</SubHead>
                <PlainList items={integ.cicd_recommendations} />
              </div>
            )}
          </Section>
        ) : null}

        {/* Empty placeholder when nothing has generated yet */}
        {!exec && !req && !arch && !backlog && !risks && !team && !cost && !timeline && !integ && (
          <div className="flex flex-col items-center justify-center text-center gap-3 py-10">
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              <Sparkles className="w-8 h-8 text-primary" />
            </motion.div>
            <p className="text-muted-foreground">
              The plan document is being generated by the AI organization.
            </p>
          </div>
        )}
      </article>
    </motion.div>
  )
}
