'use client'

import { motion } from 'framer-motion'
import { useProjectStore } from '@/lib/project-store'
import { InlineEditable } from './workspace-editor'
import {
  Target, Clock, Users, Sparkles, CheckCircle2,
  DollarSign, ShieldAlert, Flag, TrendingUp, Loader2,
} from 'lucide-react'

export function OverviewView() {
  const project = useProjectStore((s) => s.project)
  const status = useProjectStore((s) => s.status)
  const exec = project?.executive_summary || null

  const title = exec?.project_title || project?.title || 'New Project'
  const subtitle = exec?.tagline || exec?.overview || project?.idea || 'Your AI-generated delivery plan'

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
    { icon: Clock, label: 'Duration', value: exec ? `${exec.estimated_duration_weeks}w` : '—', color: 'text-blue-600' },
    { icon: Users, label: 'Team Roles', value: teamCount ? `${teamCount}` : (exec ? `${exec.recommended_team_size}` : '—'), color: 'text-indigo-600' },
    { icon: DollarSign, label: 'Total Budget', value: projectCost ? fmtMoney(projectCost) : '—', color: 'text-emerald-600' },
    { icon: ShieldAlert, label: 'Risk Level', value: riskLevel, color: 'text-amber-600' },
    { icon: Flag, label: 'Sprints', value: sprintCount || '—', color: 'text-violet-600' },
    { icon: TrendingUp, label: 'Milestones', value: milestoneCount || '—', color: 'text-sky-600' },
  ]

  const stats = [
    { label: 'Requirements Defined', value: reqCount, sub: 'Functional & Non-functional' },
    { label: 'Backlog Tasks', value: taskCount, sub: 'With Story Points & Epics' },
    { label: 'Risks Evaluated', value: riskCount, sub: 'Threats & Mitigations' },
    { label: 'Team Composition', value: teamCount || 4, sub: 'Specialist FTE Roles' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight"><InlineEditable path="/executive_summary/project_title" value={title} /></h1>
              <StatusPill status={status} />
            </div>
            <p className="text-slate-500 text-base max-w-2xl"><InlineEditable path={exec?.tagline ? '/executive_summary/tagline' : '/idea'} value={subtitle} multiline /></p>
          </div>
          {exec && (
            <div className="text-right shrink-0 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Complexity Score</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">
                {exec.complexity_score}<span className="text-xs text-slate-400 font-normal">/100</span>
              </p>
              <p className="text-xs font-medium text-blue-600 mt-0.5">{exec.complexity_label}</p>
            </div>
          )}
        </div>
        {exec?.vision && (
          <div className="mt-5 text-sm text-slate-700 max-w-3xl leading-relaxed bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <span className="font-semibold text-slate-900 block mb-1 text-xs uppercase tracking-wider">Executive Vision</span>
            <InlineEditable path="/executive_summary/vision" value={exec.vision} multiline />
          </div>
        )}
      </div>

      {/* Delivery snapshot */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {snapshot.map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
            <s.icon className={`w-4 h-4 ${s.color}`} />
            <p className="mt-2 text-xl font-bold text-slate-900 leading-none">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Count stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* 4 Detail Panels */}
      {exec ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Business Goals" icon={Target} items={exec.business_goals} pathPrefix="/executive_summary/business_goals" />
            <Panel title="Success Criteria" icon={CheckCircle2} items={exec.success_criteria} pathPrefix="/executive_summary/success_criteria" />
            <Panel title="Target Users & Personas" icon={Users} items={exec.target_users} pathPrefix="/executive_summary/target_users" />
            <Panel title="Key Differentiators" icon={Sparkles} items={exec.key_differentiators} pathPrefix="/executive_summary/key_differentiators" />
          </div>

          {(exec.competitive_landscape || exec.go_to_market) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {exec.competitive_landscape && (
                <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-xl shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Competitive Landscape</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <InlineEditable path="/executive_summary/competitive_landscape" value={exec.competitive_landscape} multiline />
                  </p>
                </div>
              )}
              {exec.go_to_market && (
                <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-xl shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Go-To-Market Strategy</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <InlineEditable path="/executive_summary/go_to_market" value={exec.go_to_market} multiline />
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <GeneratingPanel label="Executive Summary" />
      )}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; dot: string }> = {
    running: { label: 'Analyzing', cls: 'text-blue-700 border-blue-200 bg-blue-50', dot: 'bg-blue-500 animate-pulse' },
    queued: { label: 'Queued', cls: 'text-amber-700 border-amber-200 bg-amber-50', dot: 'bg-amber-500 animate-pulse' },
    complete: { label: 'Specification Ready', cls: 'text-emerald-700 border-emerald-200 bg-emerald-50', dot: 'bg-emerald-500' },
    failed: { label: 'Attention Needed', cls: 'text-rose-700 border-rose-200 bg-rose-50', dot: 'bg-rose-500' },
  }
  const s = map[status] || map.complete
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {s.label}
    </span>
  )
}

function Panel({ title, icon: Icon, items, pathPrefix }: { title: string; icon: any; items: string[]; pathPrefix?: string }) {
  return (
    <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-xl shadow-xs">
      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4 text-blue-600" />
        {title}
      </h3>
      <ul className="space-y-2.5">
        {(items || []).map((item, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
            <span className="flex-1">
              {pathPrefix ? (
                <InlineEditable path={`${pathPrefix}/${idx}`} value={item} multiline />
              ) : (
                item
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function GeneratingPanel({ label }: { label: string }) {
  return (
    <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-xs flex items-center gap-4">
      <Loader2 className="w-6 h-6 text-blue-600 animate-spin flex-shrink-0" />
      <div>
        <p className="text-slate-900 font-semibold text-sm">{label} is being compiled…</p>
        <p className="text-xs text-slate-500 mt-0.5">The autonomous AI organization is actively writing this section.</p>
      </div>
    </div>
  )
}
