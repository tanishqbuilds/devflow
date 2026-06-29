'use client'

import { motion } from 'framer-motion'
import { Flag, Rocket, Beaker, Boxes, TrendingUp } from 'lucide-react'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useProjectStore } from '@/lib/project-store'
import { GeneratingPanel } from './overview-view'
import type { MilestoneItem } from '@/lib/project-types'

const phaseMeta: Record<string, { label: string; color: string; icon: any }> = {
  mvp: { label: 'MVP', color: 'text-cyan-400', icon: Rocket },
  beta: { label: 'Beta', color: 'text-purple-400', icon: Beaker },
  production: { label: 'Production', color: 'text-emerald-400', icon: Boxes },
  scaling: { label: 'Scaling', color: 'text-amber-400', icon: TrendingUp },
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
      <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-2xl font-bold text-foreground">Milestones & Roadmap</h2>
        <GeneratingPanel label="Delivery timeline" />
      </motion.div>
    )
  }

  const milestones: MilestoneItem[] = [...(timeline.milestones || [])].sort((a, b) => a.start_week - b.start_week)
  const created = project?.created_at

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      <div>
        <h2 className="text-2xl font-bold text-foreground">Milestones & Roadmap</h2>
        <p className="text-muted-foreground mt-1">Delivery schedule across MVP → Beta → Production → Scaling</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label="Total Milestones" value={String(milestones.length)} sub="Planned" valueClass="text-primary" />
        <Stat label="Total Duration" value={`${timeline.total_duration_weeks} wks`} sub="End to end" valueClass="text-accent" />
        <Stat label="Phases" value={String(new Set(milestones.map((m) => m.phase)).size)} sub="Distinct" valueClass="text-cyan-400" />
      </div>

      <div className="space-y-4">
        {milestones.map((m, index) => {
          const meta = phaseMeta[m.phase] || phaseMeta.mvp
          const Icon = meta.icon
          return (
            <motion.div key={index} className="glass-panel p-5 rounded-lg border-l-4 border-primary/30"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.06 }} whileHover={{ scale: 1.01 }}>
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-2 min-w-[44px] pt-1">
                  <Icon className={`w-5 h-5 ${meta.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{m.title}</h3>
                    <span className={`text-xs font-medium ${meta.color}`}>{meta.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{m.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {addWeeks(created, m.start_week)} → {addWeeks(created, m.start_week + m.duration_weeks)} · {m.duration_weeks} weeks
                  </p>
                  {m.deliverables?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.deliverables.map((d, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[11px] text-foreground/80">{d}</span>
                      ))}
                    </div>
                  )}
                  {m.dependencies?.length > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-2">Depends on: {m.dependencies.join(', ')}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {timeline.critical_path?.length > 0 && (
        <motion.div className="glass-panel p-6 rounded-lg" whileHover={{ scale: 1.01 }}>
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg flex items-center gap-2"><Flag className="w-4 h-4 text-primary" /> Critical Path</CardTitle>
            <CardDescription>Longest sequence of dependent milestones</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="text-sm text-foreground">{timeline.critical_path.join('  →  ')}</div>
          </CardContent>
        </motion.div>
      )}
    </motion.div>
  )
}

function Stat({ label, value, sub, valueClass }: { label: string; value: string; sub: string; valueClass: string }) {
  return (
    <motion.div className="glass-panel p-4 rounded-lg" whileHover={{ scale: 1.02 }}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-2 ${valueClass}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </motion.div>
  )
}
