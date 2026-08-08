'use client'

import { motion } from 'framer-motion'
import { Flag, Rocket, Beaker, Boxes, TrendingUp } from 'lucide-react'
import { useProjectStore } from '@/lib/project-store'
import { GeneratingPanel } from './overview-view'
import type { MilestoneItem } from '@/lib/project-types'

const phaseMeta: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
  mvp: { label: 'MVP Phase', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Rocket },
  beta: { label: 'Beta Release', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: Beaker },
  production: { label: 'Production Go-Live', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: Boxes },
  scaling: { label: 'Scale & Optimization', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: TrendingUp },
}

function addWeeks(iso: string | undefined, weeks: number): string {
  const base = iso ? new Date(iso) : new Date()
  const d = new Date(base.getTime() + weeks * 7 * 24 * 60 * 60 * 1000)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function MilestonesView() {
  const project = useProjectStore((s) => s.project)
  const timeline = project?.timeline || null

  if (!timeline) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Milestones & Delivery Roadmap</h2>
        <GeneratingPanel label="Milestones & Delivery Roadmap" />
      </div>
    )
  }

  const milestones: MilestoneItem[] = [...(timeline.milestones || [])].sort((a, b) => a.start_week - b.start_week)
  const created = project?.created_at

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Milestones & Delivery Roadmap</h2>
        <p className="text-slate-500 text-sm mt-0.5">
          Delivery schedule compiled by the Timeline Delivery Agent across MVP, Beta, and Production gates
        </p>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Total Milestones" value={String(milestones.length)} sub="Sequenced Deliverables" color="text-blue-600" />
        <Stat label="Total Estimated Duration" value={`${timeline.total_duration_weeks} Weeks`} sub="Kickoff to Scale" color="text-slate-900" />
        <Stat label="Distinct Release Gates" value={String(new Set(milestones.map((m) => m.phase)).size)} sub="Phased Releases" color="text-indigo-600" />
      </div>

      {/* Milestones List */}
      <div className="space-y-4">
        {milestones.map((m, index) => {
          const meta = phaseMeta[m.phase] || phaseMeta.mvp
          const Icon = meta.icon
          return (
            <div
              key={index}
              className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl ${meta.bg} ${meta.border} ${meta.text} border flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-sm text-slate-900">{m.title}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${meta.bg} ${meta.border} ${meta.text}`}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-2">{m.description}</p>
                  
                  <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                    <span>{addWeeks(created, m.start_week)} → {addWeeks(created, m.start_week + m.duration_weeks)}</span>
                    <span className="text-slate-300">•</span>
                    <span>{m.duration_weeks} Weeks Duration</span>
                  </div>

                  {m.deliverables?.length > 0 && (
                    <div className="mt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Deliverables</span>
                      <div className="flex flex-wrap gap-1.5">
                        {m.deliverables.map((d, i) => (
                          <span key={i} className="px-2.5 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {m.dependencies?.length > 0 && (
                    <p className="text-[11px] text-slate-400 mt-2.5">
                      <strong className="text-slate-500 font-semibold">Dependencies:</strong> {m.dependencies.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Critical Path Sequence */}
      {timeline.critical_path?.length > 0 && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Flag className="w-4 h-4 text-blue-600" /> Critical Path Sequence
          </h3>
          <p className="text-xs text-slate-500 mb-3">Longest continuous dependency chain determining delivery timeline</p>
          <div className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-4 leading-relaxed">
            {timeline.critical_path.join('  ⟶  ')}
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
    </div>
  )
}
