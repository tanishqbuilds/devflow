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

const MAX_LIST = 15

function priorityClass(p?: string): string {
  switch ((p || '').toLowerCase()) {
    case 'critical':
    case 'high':
      return 'bg-rose-50 text-rose-700 border-rose-200'
    case 'medium':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'low':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

function truncate<T>(arr: T[] | undefined | null): { items: T[]; more: number } {
  const list = arr || []
  return { items: list.slice(0, MAX_LIST), more: Math.max(0, list.length - MAX_LIST) }
}

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
      if (layer.decisions?.length) out.push(`*Decisions:*\n${bullets(layer.decisions)}`)
    }
  }

  const backlog = project.backlog
  if (backlog) {
    out.push('\n## Backlog & Sprints')
    if (backlog.methodology) out.push(`Methodology: ${backlog.methodology}`)
    if (backlog.sprints?.length) {
      for (const s of backlog.sprints) {
        out.push(`\n### Sprint ${s.number}: ${s.name}`)
        if (s.goal) out.push(`Goal: ${s.goal}`)
        const tasks = (backlog.tasks || []).filter((t) => t.sprint === s.number)
        for (const t of tasks) {
          out.push(`- **${t.title}** (${t.priority}, ${t.estimated_days}d) — ${t.description || ''}`)
        }
      }
    }
  }

  const risks = project.risks
  if (risks) {
    out.push('\n## Risks')
    if (risks.overall_risk_level) out.push(`Overall: ${risks.overall_risk_level}`)
    if (risks.summary) out.push(risks.summary)
    for (const r of risks.risks || []) {
      out.push(`- **${r.title}** [${r.severity}] — ${r.description} (Mitigation: ${r.mitigation})`)
    }
  }

  const team = project.team
  if (team) {
    out.push('\n## Team')
    for (const m of team.members || []) {
      out.push(`- **${m.role}** (${m.seniority}, ${m.count}x, ${m.allocation_pct}%): ${(m.skills || []).join(', ')}`)
    }
  }

  const cost = project.cost
  if (cost) {
    out.push('\n## Cost')
    if (cost.monthly_total_usd) out.push(`Monthly: $${Math.round(cost.monthly_total_usd).toLocaleString()}`)
    if (cost.project_total_usd) out.push(`Total: $${Math.round(cost.project_total_usd).toLocaleString()}`)
  }

  const timeline = project.timeline
  if (timeline) {
    out.push('\n## Timeline & Milestones')
    for (const m of timeline.milestones || []) {
      out.push(`- **${m.title}** (${m.phase}, W${m.start_week}+${m.duration_weeks}w) — ${m.description}`)
    }
  }

  return out.join('\n')
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-3 pt-6 border-t border-slate-100 first:pt-0 first:border-0">
      <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
      {children}
    </section>
  )
}

function SubHead({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{children}</h3>
}

function PlainList({ items }: { items?: (string | undefined)[] }) {
  const clean = (items || []).filter(Boolean) as string[]
  if (!clean.length) return null
  return (
    <ul className="space-y-1.5 text-xs text-slate-700">
      {clean.map((it, idx) => (
        <li key={idx} className="flex items-start gap-2">
          <span className="text-blue-600 font-bold">•</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  )
}

function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${className}`}>
      {children}
    </span>
  )
}

export function DocumentationView() {
  const project = useProjectStore((s) => s.project)
  const [copied, setCopied] = useState(false)

  if (!project) {
    return (
      <div className="bg-white border border-slate-200 p-10 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
        <FileText className="w-10 h-10 text-blue-600" />
        <h2 className="text-xl font-bold text-slate-900">Documentation &amp; Export</h2>
        <p className="text-slate-500 text-xs">Documentation is being generated by the AI organization.</p>
      </div>
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          Documentation &amp; Export
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Complete project blueprint ready for team export in JSON, Markdown, or printable PDF formats.
        </p>
      </div>

      {/* Export action bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center gap-3 print:hidden shadow-xs">
        <button
          onClick={handleDownloadJson}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download JSON
        </button>
        <button
          onClick={handleCopyMarkdown}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied to Clipboard!' : 'Copy as Markdown'}
        </button>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print / PDF
        </button>
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-slate-400">
          <FileCode2 className="w-3.5 h-3.5" />
          Open formats, zero lock-in
        </span>
      </div>

      {/* The document */}
      <article className="bg-white border border-slate-200 p-8 rounded-2xl space-y-8 shadow-xs">
        {/* Doc title block */}
        <header className="space-y-2 pb-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{docTitle}</h1>
          {exec?.tagline && <p className="text-blue-600 font-medium text-sm">{exec.tagline}</p>}
          {project.idea && <p className="text-xs text-slate-500 italic max-w-3xl">{project.idea}</p>}
          <div className="flex flex-wrap gap-2 pt-1">
            {project.status && <Badge className="bg-blue-50 text-blue-700 border-blue-200 capitalize">{project.status}</Badge>}
            {typeof project.progress === 'number' && (
              <Badge className="bg-slate-50 text-slate-600 border-slate-200">{project.progress}% complete</Badge>
            )}
          </div>
        </header>

        {/* Executive Summary */}
        {exec && (
          <Section id="doc-exec" title="Executive Summary">
            {exec.overview && <p className="text-slate-600 text-xs leading-relaxed">{exec.overview}</p>}
            {exec.vision && (
              <p className="text-slate-700 text-xs leading-relaxed border-l-2 border-blue-500 pl-3 bg-slate-50 p-2.5 rounded-r-lg">{exec.vision}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {exec.complexity_label && (
                <Badge className="bg-purple-50 text-purple-700 border-purple-200">
                  Complexity: {exec.complexity_label} ({exec.complexity_score})
                </Badge>
              )}
              {exec.estimated_duration_weeks ? (
                <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                  ~{exec.estimated_duration_weeks} weeks
                </Badge>
              ) : null}
              {exec.recommended_team_size ? (
                <Badge className="bg-slate-50 text-slate-600 border-slate-200">
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
        )}

        {/* Requirements */}
        {req && (
          <Section id="doc-req" title="Requirements">
            {!!req.functional_requirements?.length && (
              <div>
                <SubHead>Functional</SubHead>
                <div className="space-y-2">
                  {truncate(req.functional_requirements).items.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <Badge className={priorityClass(r.priority)}>{r.priority}</Badge>
                      <p className="text-slate-600">
                        <span className="text-slate-900 font-semibold">{r.title}</span> — {r.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!!req.non_functional_requirements?.length && (
              <div className="mt-4">
                <SubHead>Non-Functional</SubHead>
                <div className="space-y-2">
                  {truncate(req.non_functional_requirements).items.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <Badge className={priorityClass(r.priority)}>{r.priority}</Badge>
                      <p className="text-slate-600">
                        <span className="text-slate-900 font-semibold">{r.title}</span> — {r.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!!req.user_stories?.length && (
              <div className="mt-4">
                <SubHead>User Stories</SubHead>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {truncate(req.user_stories).items.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>
                        As a <strong className="text-slate-900">{s.as_a}</strong>, I want {s.i_want} so that {s.so_that}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>
        )}

        {/* Architecture */}
        {arch && (
          <Section id="doc-arch" title="System Architecture">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Frontend Tier', layer: arch.frontend },
                { name: 'Backend Tier', layer: arch.backend },
                { name: 'Database Tier', layer: arch.database },
                { name: 'Infrastructure Tier', layer: arch.infrastructure },
              ].map(({ name, layer }) => {
                if (!layer) return null
                return (
                  <div key={name} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <h3 className="font-bold text-xs text-slate-900">{name}</h3>
                    {layer.summary && <p className="text-xs text-slate-600">{layer.summary}</p>}
                    {!!layer.technologies?.length && (
                      <p className="text-xs text-slate-500">
                        <strong className="text-slate-700">Technologies:</strong> {layer.technologies.join(', ')}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </Section>
        )}

        {/* Risks */}
        {risks && (
          <Section id="doc-risks" title="Security & Risk Assessment">
            {risks.overall_risk_level && (
              <p className="text-xs text-slate-600">
                Overall Risk Profile: <Badge className="bg-amber-50 text-amber-700 border-amber-200">{risks.overall_risk_level}</Badge>
              </p>
            )}
            {risks.summary && <p className="text-xs text-slate-600 leading-relaxed">{risks.summary}</p>}
            <div className="space-y-2 mt-2">
              {(risks.risks || []).map((r, i) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-900">{r.title}</span>
                    <Badge className={priorityClass(r.severity)}>{r.severity}</Badge>
                  </div>
                  <p className="text-slate-600">{r.description}</p>
                  {r.mitigation && (
                    <p className="text-slate-700 mt-1 font-medium">
                      <span className="text-slate-400">Mitigation:</span> {r.mitigation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}
      </article>
    </div>
  )
}
