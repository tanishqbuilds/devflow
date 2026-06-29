'use client'

import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  Lightbulb,
  GitBranch,
  CheckSquare,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react'
import { useProjectStore } from '@/lib/project-store'
import { GeneratingPanel } from './overview-view'
import type { ProjectDoc } from '@/lib/project-types'

const severityRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }

function sevColor(sev: string): { text: string; border: string; bg: string } {
  switch ((sev || '').toLowerCase()) {
    case 'critical':
    case 'high':
      return { text: 'text-rose-400', border: '#f43f5e', bg: 'bg-rose-500/15' }
    case 'medium':
      return { text: 'text-amber-400', border: '#f59e0b', bg: 'bg-amber-500/15' }
    default:
      return { text: 'text-emerald-400', border: '#10b981', bg: 'bg-emerald-500/15' }
  }
}

interface Health {
  score: number
  label: string
  ring: string
  text: string
  rationale: string
}

function computeHealth(project: ProjectDoc): Health {
  let score = 100
  const reasons: string[] = []

  const level = (project.risks?.overall_risk_level || '').toLowerCase()
  if (level.includes('critical')) {
    score -= 40
    reasons.push('critical overall risk')
  } else if (level.includes('high')) {
    score -= 25
    reasons.push('high overall risk')
  } else if (level.includes('moderate') || level.includes('medium')) {
    score -= 12
    reasons.push('moderate risk')
  } else if (level.includes('low')) {
    score -= 4
  }

  const complexity = project.executive_summary?.complexity_score ?? 0
  if (complexity > 0) {
    score -= complexity / 5
    if (complexity >= 70) reasons.push('high complexity')
  }

  const estWeeks = project.executive_summary?.estimated_duration_weeks ?? 0
  const planWeeks = project.timeline?.total_duration_weeks ?? 0
  if (estWeeks > 0 && planWeeks > 0) {
    const diff = Math.abs(estWeeks - planWeeks) / Math.max(estWeeks, planWeeks)
    if (diff > 0.25) {
      score -= 10
      reasons.push('timeline vs estimate mismatch')
    }
  }

  score = Math.max(5, Math.min(99, Math.round(score)))

  let label: string
  let ring: string
  let text: string
  if (score >= 70) {
    label = 'Healthy'
    ring = '#10b981'
    text = 'text-emerald-400'
  } else if (score >= 45) {
    label = 'At Risk'
    ring = '#f59e0b'
    text = 'text-amber-400'
  } else {
    label = 'Critical'
    ring = '#f43f5e'
    text = 'text-rose-400'
  }

  const rationale =
    reasons.length > 0
      ? `Driven down by ${reasons.slice(0, 3).join(', ')}.`
      : 'Plan looks well-balanced with low identified risk.'

  return { score, label, ring, text, rationale }
}

function deriveAssumptions(project: ProjectDoc): string[] {
  const exec = project.executive_summary
  const out: string[] = []
  const users = exec?.target_users || []
  const criteria = exec?.success_criteria || []

  if (users[0]) out.push(`We assume ${users[0].toLowerCase()} are reachable and willing to adopt this product.`)
  if (criteria[0]) out.push(`We assume the team can validate "${criteria[0]}" within the planned timeline.`)
  if (users[1]) out.push(`We assume demand from ${users[1].toLowerCase()} stays stable through delivery.`)
  else if (criteria[1]) out.push(`We assume measurement is in place to track "${criteria[1]}".`)

  if (out.length === 0) {
    out.push('We assume scope and priorities stay stable across the engagement.')
    out.push('We assume required tooling and infrastructure access is available on day one.')
    out.push('We assume stakeholders are available for timely reviews and sign-off.')
  }
  return out.slice(0, 3)
}

function deriveDependencies(project: ProjectDoc): string[] {
  const critical = project.timeline?.critical_path || []
  if (critical.length > 0) return critical.slice(0, 5)

  const tasks = project.backlog?.tasks || []
  const deps = new Set<string>()
  for (const t of tasks) {
    for (const d of t.dependencies || []) {
      if (d) deps.add(d)
    }
  }
  return Array.from(deps).slice(0, 5)
}

function deriveDecisions(project: ProjectDoc): { layer: string; decision: string }[] {
  const arch = project.architecture
  if (!arch) return []
  const layers: { key: keyof typeof arch; label: string }[] = [
    { key: 'frontend', label: 'Frontend' },
    { key: 'backend', label: 'Backend' },
    { key: 'database', label: 'Database' },
    { key: 'infrastructure', label: 'Infrastructure' },
  ]
  const out: { layer: string; decision: string }[] = []
  for (const { key, label } of layers) {
    const layer = arch[key] as { decisions?: string[] } | undefined
    const first = layer?.decisions?.[0]
    if (first) out.push({ layer: label, decision: first })
    if (out.length >= 4) break
  }
  return out.slice(0, 4)
}

function deriveRecommendations(project: ProjectDoc, health: Health): string[] {
  const out: string[] = []
  const risks = [...(project.risks?.risks || [])].sort(
    (a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0),
  )
  const level = (project.risks?.overall_risk_level || '').toLowerCase()
  const estWeeks = project.executive_summary?.estimated_duration_weeks ?? 0
  const planWeeks = project.timeline?.total_duration_weeks ?? 0
  const complexity = project.executive_summary?.complexity_score ?? 0
  const teamSize = (project.team?.members || []).reduce((s, m) => s + (m.count || 1), 0)

  if ((level.includes('high') || level.includes('critical')) && risks[0]) {
    out.push(`Front-load the mitigation for "${risks[0].title}" in sprint 1 before it compounds.`)
  } else if (risks[0]) {
    out.push(`Track "${risks[0].title}" with a clear owner so it stays contained.`)
  }

  if (estWeeks > 16 || planWeeks > 16) {
    out.push('Cut MVP scope to hit a 12-week beta, then expand based on real usage signals.')
  }

  if (complexity >= 70) {
    out.push('Add a technical spike sprint to de-risk the highest-complexity components early.')
  }

  if (planWeeks > 0 && estWeeks > 0 && Math.abs(estWeeks - planWeeks) / Math.max(estWeeks, planWeeks) > 0.25) {
    out.push('Reconcile the estimated duration with the timeline plan to set realistic stakeholder expectations.')
  }

  if (teamSize > 0 && teamSize <= 3 && (planWeeks > 12 || estWeeks > 12)) {
    out.push('The lean team plus long timeline is fragile — define backup ownership for critical roles.')
  }

  if (out.length < 3) {
    if (health.score >= 70) out.push('Maintain momentum with weekly health checks against the success criteria.')
    out.push('Lock the critical path early and protect it from scope creep.')
    out.push('Schedule a mid-project risk review to revalidate assumptions.')
  }

  return out.slice(0, 4)
}

function HealthRing({ score, ring, text, label }: { score: number; ring: string; text: string; label: string }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  return (
    <div className="relative flex items-center justify-center w-36 h-36 flex-shrink-0">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={ring}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${text}`}>{score}</span>
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

function RaidCard({
  title,
  icon: Icon,
  accent,
  children,
  delay,
}: {
  title: string
  icon: any
  accent: string
  children: React.ReactNode
  delay: number
}) {
  return (
    <motion.div
      className="glass-panel p-6 rounded-xl"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground mb-4 flex items-center gap-2">
        <Icon className={`w-4 h-4 ${accent}`} />
        {title}
      </h3>
      {children}
    </motion.div>
  )
}

export function InsightsView() {
  const project = useProjectStore((s) => s.project)

  if (!project) {
    return (
      <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-foreground">AI Insights</h2>
        <GeneratingPanel label="AI insights" />
      </motion.div>
    )
  }

  const hasAnyData =
    project.executive_summary || project.risks || project.timeline || project.architecture || project.backlog

  if (!hasAnyData) {
    return (
      <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">AI Insights</h2>
          <p className="text-muted-foreground">Delivery health, RAID analysis and recommendations</p>
        </div>
        <GeneratingPanel label="AI insights" />
      </motion.div>
    )
  }

  const health = computeHealth(project)
  const topRisks = [...(project.risks?.risks || [])]
    .sort((a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0))
    .slice(0, 3)
  const assumptions = deriveAssumptions(project)
  const dependencies = deriveDependencies(project)
  const decisions = deriveDecisions(project)
  const recommendations = deriveRecommendations(project, health)

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">AI Insights</h2>
        <p className="text-muted-foreground">
          A synthesized read on delivery health, derived from the full plan — no extra analysis required.
        </p>
      </div>

      {/* Delivery Health */}
      <motion.div
        className="glass-panel p-8 rounded-xl"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <HealthRing score={health.score} ring={health.ring} text={health.text} label={health.label} />
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <Activity className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold text-foreground">Delivery Health</h3>
            </div>
            <p className={`text-lg font-semibold ${health.text}`}>{health.label}</p>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{health.rationale}</p>
            <div className="mt-4 grid grid-cols-3 gap-3 max-w-md mx-auto sm:mx-0">
              <MiniStat
                label="Risk Level"
                value={project.risks?.overall_risk_level || '—'}
              />
              <MiniStat
                label="Complexity"
                value={
                  project.executive_summary?.complexity_score != null
                    ? `${project.executive_summary.complexity_score}/100`
                    : '—'
                }
              />
              <MiniStat
                label="Duration"
                value={
                  project.timeline?.total_duration_weeks
                    ? `${project.timeline.total_duration_weeks}w`
                    : project.executive_summary?.estimated_duration_weeks
                      ? `${project.executive_summary.estimated_duration_weeks}w`
                      : '—'
                }
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* RAID grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RaidCard title="Risks" icon={ShieldAlert} accent="text-rose-400" delay={0.1}>
          {topRisks.length > 0 ? (
            <ul className="space-y-3">
              {topRisks.map((r, i) => {
                const c = sevColor(r.severity)
                return (
                  <li key={i} className="border-l-2 pl-3" style={{ borderLeftColor: c.border }}>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 ${c.text}`} />
                      <span className="text-sm font-medium text-foreground">{r.title}</span>
                      <span
                        className={`text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded ${c.bg} ${c.text}`}
                      >
                        {r.severity}
                      </span>
                    </div>
                    {r.mitigation && (
                      <p className="text-xs text-muted-foreground">Mitigation: {r.mitigation}</p>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyHint text="No risks identified yet." />
          )}
        </RaidCard>

        <RaidCard title="Assumptions" icon={HelpCircle} accent="text-amber-400" delay={0.14}>
          {assumptions.length > 0 ? (
            <ul className="space-y-2">
              {assumptions.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-amber-400" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyHint text="Assumptions surface once the summary is ready." />
          )}
        </RaidCard>

        <RaidCard title="Dependencies" icon={GitBranch} accent="text-primary" delay={0.18}>
          {dependencies.length > 0 ? (
            <ul className="space-y-2">
              {dependencies.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                  <span className="text-primary mt-0.5 text-xs font-mono flex-shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyHint text="Critical path appears once the timeline is planned." />
          )}
        </RaidCard>

        <RaidCard title="Decisions" icon={CheckSquare} accent="text-violet-400" delay={0.22}>
          {decisions.length > 0 ? (
            <ul className="space-y-2">
              {decisions.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                  <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 flex-shrink-0 mt-0.5">
                    {d.layer}
                  </span>
                  <span>{d.decision}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyHint text="Architecture decisions appear once design is complete." />
          )}
        </RaidCard>
      </div>

      {/* Recommendations */}
      <motion.div
        className="glass-panel p-6 rounded-xl"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26 }}
      >
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          Key Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recommendations.map((rec, i) => (
            <motion.div
              key={i}
              className="glass-panel-dark p-4 rounded-lg flex items-start gap-3 border border-white/5"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.28 + i * 0.05 }}
            >
              <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">{rec}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Copilot CTA */}
      <motion.div
        className="flex justify-center pt-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors cursor-default">
          Ask the copilot for a deeper dive
          <ArrowRight className="w-4 h-4" />
        </span>
      </motion.div>
    </motion.div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-panel-dark px-3 py-2 rounded-lg border border-white/5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground capitalize truncate">{value}</p>
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Sparkles className="w-4 h-4 text-primary/60 animate-pulse" />
      <span>{text}</span>
    </div>
  )
}
