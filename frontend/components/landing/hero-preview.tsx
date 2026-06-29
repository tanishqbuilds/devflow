'use client'

import { motion } from 'framer-motion'
import {
  Crown, ClipboardList, Boxes, ListChecks, ShieldAlert, Users, CalendarRange, Plug,
  FileText, GitBranch, DollarSign, TriangleAlert,
} from 'lucide-react'

const AGENTS = [
  { icon: Crown, label: 'CEO' },
  { icon: ClipboardList, label: 'PM' },
  { icon: Boxes, label: 'Architect' },
  { icon: ListChecks, label: 'Sprints' },
  { icon: ShieldAlert, label: 'Risk' },
  { icon: Users, label: 'Team' },
  { icon: CalendarRange, label: 'Timeline' },
  { icon: Plug, label: 'Integrations' },
]

const TILES = [
  { icon: FileText, label: 'Requirements', value: '24', tint: 'text-cyan-300' },
  { icon: GitBranch, label: 'Backlog tasks', value: '38', tint: 'text-violet-300' },
  { icon: CalendarRange, label: 'Timeline', value: '18 wks', tint: 'text-sky-300' },
  { icon: DollarSign, label: 'Est. cost', value: '$214k', tint: 'text-emerald-300' },
]

const CYCLE = 6 // seconds per loop

export function HeroPreview() {
  return (
    <div className="relative max-w-4xl mx-auto">
      {/* glow */}
      <div className="absolute -inset-x-10 -top-10 h-40 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />

      <div className="surface-card overflow-hidden shadow-[0_30px_120px_-30px_rgba(0,0,0,0.8)]">
        {/* window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/[0.03]">
          <span className="w-3 h-3 rounded-full bg-red-400/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
          <span className="w-3 h-3 rounded-full bg-green-400/70" />
          <div className="ml-3 flex-1 max-w-sm rounded-md bg-white/5 border border-white/10 px-3 py-1 text-[11px] text-muted-foreground">
            planforge.ai / workspace
          </div>
        </div>

        <div className="p-5 sm:p-7">
          {/* prompt */}
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-background/60 px-4 py-3 text-sm">
            <span className="text-primary">⌁</span>
            <span className="text-foreground/90">Build an AI-powered recruitment platform for startups</span>
            <motion.span
              className="ml-0.5 inline-block w-1.5 h-4 bg-primary"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>

          {/* agent pipeline */}
          <div className="mt-6 grid grid-cols-4 sm:grid-cols-8 gap-2.5">
            {AGENTS.map((a, i) => {
              const start = (i / AGENTS.length) * 0.7
              return (
                <motion.div
                  key={a.label}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] py-2.5"
                  animate={{
                    borderColor: ['rgba(255,255,255,0.08)', 'rgba(0,217,255,0.55)', 'rgba(124,58,237,0.4)', 'rgba(255,255,255,0.08)'],
                    backgroundColor: ['rgba(255,255,255,0.02)', 'rgba(0,217,255,0.10)', 'rgba(124,58,237,0.06)', 'rgba(255,255,255,0.02)'],
                  }}
                  transition={{ duration: CYCLE, times: [start, start + 0.06, start + 0.16, 1], repeat: Infinity, ease: 'easeInOut' }}
                >
                  <a.icon className="w-4 h-4 text-primary" />
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground">{a.label}</span>
                </motion.div>
              )
            })}
          </div>

          {/* progress */}
          <div className="mt-5 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
              animate={{ width: ['0%', '100%'] }}
              transition={{ duration: CYCLE * 0.82, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* result tiles */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TILES.map((t, i) => (
              <motion.div
                key={t.label}
                className="surface-card surface-card-hover p-3.5"
                animate={{ opacity: [0.25, 0.25, 1, 1], y: [8, 8, 0, 0] }}
                transition={{ duration: CYCLE, times: [0, 0.55 + i * 0.06, 0.68 + i * 0.06, 1], repeat: Infinity }}
              >
                <t.icon className={`w-4 h-4 ${t.tint}`} />
                <div className="mt-2 text-xl font-semibold text-foreground">{t.value}</div>
                <div className="text-[11px] text-muted-foreground">{t.label}</div>
              </motion.div>
            ))}
          </div>

          {/* footer hint */}
          <div className="mt-5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <TriangleAlert className="w-3.5 h-3.5 text-amber-300/80" />
            8 risks identified, each with a mitigation — costed and ranked.
          </div>
        </div>
      </div>
    </div>
  )
}
