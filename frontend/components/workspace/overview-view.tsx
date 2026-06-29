'use client'

import { motion } from 'framer-motion'
import { useProjectStore } from '@/lib/project-store'
import {
  Target, Gauge, Clock, Users, Sparkles, CheckCircle2, Rocket,
  DollarSign, ShieldAlert, ListChecks, Flag, TrendingUp,
} from 'lucide-react'

const RISK_TONE: Record<string, string> = {
  Low: 'text-emerald-400', Moderate: 'text-amber-400', High: 'text-orange-400', Critical: 'text-red-400',
}

export function OverviewView() {
  const project = useProjectStore((s) => s.project)
  const status = useProjectStore((s) => s.status)
  const exec = project?.executive_summary || null

  const title = exec?.project_title || project?.title || 'New Project'
  const subtitle = exec?.tagline || exec?.overview || project?.idea || 'Your AI-powered delivery plan'

  const reqCount =
    (project?.requirements?.functional_requirements?.length || 0) +
    (project?.requirements?.non_functional_requirements?.length || 0)
  const taskCount = project?.backlog?.tasks?.length || 0
  const sprintCount = project?.backlog?.sprints?.length || 0
  const riskCount = project?.risks?.risks?.length || 0
  const milestoneCount = project?.timeline?.milestones?.length || 0
  const teamCount = (project?.team?.members || []).reduce((sum, m) => sum + (m.count || 1), 0)
  const projectCost = project?.cost?.project_total_usd || 0
  const riskLevel = project?.risks?.overall_risk_level || '—'

  const fmtMoney = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k` : `$${n}`

  const snapshot = [
    { icon: Clock, label: 'Duration', value: exec ? `${exec.estimated_duration_weeks}w` : '—', tone: 'text-cyan-400' },
    { icon: Users, label: 'Team', value: teamCount ? `${teamCount}` : (exec ? `${exec.recommended_team_size}` : '—'), tone: 'text-emerald-400' },
    { icon: DollarSign, label: 'Total cost', value: projectCost ? fmtMoney(projectCost) : '—', tone: 'text-green-400' },
    { icon: ShieldAlert, label: 'Risk level', value: riskLevel, tone: RISK_TONE[riskLevel] || 'text-muted-foreground' },
    { icon: Flag, label: 'Sprints', value: sprintCount || '—', tone: 'text-violet-400' },
    { icon: TrendingUp, label: 'Milestones', value: milestoneCount || '—', tone: 'text-fuchsia-400' },
  ]

  const stats = [
    { label: 'Requirements', value: reqCount, color: 'from-blue-500 to-cyan-500' },
    { label: 'Backlog Tasks', value: taskCount, color: 'from-purple-500 to-pink-500' },
    { label: 'Risks Tracked', value: riskCount, color: 'from-orange-500 to-red-500' },
    { label: 'Team Members', value: teamCount, color: 'from-green-500 to-emerald-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div className="glass-panel p-8 rounded-2xl relative overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="absolute -top-20 -right-10 w-64 h-64 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">{title}</h1>
              <StatusPill status={status} />
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl">{subtitle}</p>
          </div>
          {exec && (
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">Complexity</p>
              <p className="text-2xl font-bold text-primary">{exec.complexity_score}<span className="text-sm text-muted-foreground">/100</span></p>
              <p className="text-xs text-muted-foreground">{exec.complexity_label}</p>
            </div>
          )}
        </div>
        {exec?.vision && (
          <p className="relative mt-5 text-sm text-foreground/80 max-w-3xl leading-relaxed border-l-2 border-primary/40 pl-4">
            {exec.vision}
          </p>
        )}
      </motion.div>

      {/* Delivery snapshot */}
      <motion.div className="grid grid-cols-3 lg:grid-cols-6 gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>
        {snapshot.map((s, i) => (
          <motion.div key={s.label} className="glass-panel p-4 rounded-xl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.04 }}>
            <s.icon className={`w-4 h-4 ${s.tone}`} />
            <p className="mt-2 text-xl font-bold text-foreground leading-none">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Count stats */}
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
        {stats.map((stat, idx) => (
          <motion.div key={stat.label} className="glass-panel p-6 rounded-xl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + idx * 0.05 }}>
            <p className="text-muted-foreground text-sm mb-2">{stat.label}</p>
            <p className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {exec ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Business Goals" icon={Target} items={exec.business_goals} accent="text-cyan-400" />
          <Panel title="Success Criteria" icon={CheckCircle2} items={exec.success_criteria} accent="text-emerald-400" />
          <Panel title="Target Users" icon={Users} items={exec.target_users} accent="text-blue-400" />
          <Panel title="Key Differentiators" icon={Sparkles} items={exec.key_differentiators} accent="text-purple-400" />
        </div>
      ) : (
        <GeneratingPanel label="Executive summary" />
      )}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; dot: string }> = {
    running: { label: 'Planning', cls: 'text-cyan-300 border-cyan-400/30 bg-cyan-400/10', dot: 'bg-cyan-400 animate-pulse' },
    queued: { label: 'Queued', cls: 'text-amber-300 border-amber-400/30 bg-amber-400/10', dot: 'bg-amber-400 animate-pulse' },
    complete: { label: 'Plan ready', cls: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10', dot: 'bg-emerald-400' },
    failed: { label: 'Degraded', cls: 'text-red-300 border-red-400/30 bg-red-400/10', dot: 'bg-red-400' },
  }
  const s = map[status] || map.complete
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {s.label}
    </span>
  )
}

function Panel({ title, icon: Icon, items, accent }: { title: string; icon: any; items: string[]; accent: string }) {
  return (
    <motion.div className="glass-panel p-6 rounded-xl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Icon className={`w-5 h-5 ${accent}`} />
        {title}
      </h3>
      <ul className="space-y-2">
        {(items || []).map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-foreground/90">
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${accent.replace('text-', 'bg-')}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

export function GeneratingPanel({ label }: { label: string }) {
  return (
    <div className="glass-panel p-8 rounded-2xl flex items-center gap-4">
      <Rocket className="w-6 h-6 text-primary animate-pulse" />
      <div>
        <p className="text-foreground font-medium">{label} is being generated…</p>
        <p className="text-sm text-muted-foreground">The AI organization is still working on this section.</p>
      </div>
    </div>
  )
}
