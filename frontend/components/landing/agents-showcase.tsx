'use client'

import {
  Crown, ClipboardList, Boxes, ListChecks, ShieldAlert, Users, CalendarRange, Plug, ArrowDown,
} from 'lucide-react'
import { Reveal, RevealStagger, RevealItem } from './reveal'

type AgentCard = { icon: any; name: string; role: string; output: string; color: string }

const STAGES: { label: string; agents: AgentCard[] }[] = [
  {
    label: 'Vision',
    agents: [
      { icon: Crown, name: 'CEO', role: 'Chief Vision Officer', output: 'Executive summary, complexity & scope', color: 'text-amber-300' },
    ],
  },
  {
    label: 'Definition',
    agents: [
      { icon: ClipboardList, name: 'Product Manager', role: 'Senior PM', output: 'Requirements & user stories', color: 'text-cyan-300' },
    ],
  },
  {
    label: 'Design',
    agents: [
      { icon: Boxes, name: 'System Architect', role: 'Principal Architect', output: 'Layered architecture + diagram', color: 'text-violet-300' },
    ],
  },
  {
    label: 'Planning (in parallel)',
    agents: [
      { icon: ListChecks, name: 'Sprint Planner', role: 'Agile Lead', output: 'Epics, tasks, estimates, sprints', color: 'text-sky-300' },
      { icon: ShieldAlert, name: 'Risk Analyst', role: 'Risk Analyst', output: 'Ranked risks + mitigations', color: 'text-rose-300' },
      { icon: Users, name: 'Team Allocation', role: 'VP Engineering', output: 'Staffing plan → derived cost', color: 'text-emerald-300' },
    ],
  },
  {
    label: 'Delivery (in parallel)',
    agents: [
      { icon: CalendarRange, name: 'Timeline', role: 'Delivery Manager', output: 'Milestones & roadmap', color: 'text-fuchsia-300' },
      { icon: Plug, name: 'Integration', role: 'Platform / DevOps', output: 'Integrations & CI/CD plan', color: 'text-teal-300' },
    ],
  },
]

export function AgentsShowcase() {
  return (
    <section id="agents" className="relative px-4 py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <Reveal className="text-center max-w-2xl mx-auto">
          <span className="eyebrow">The AI organization</span>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight text-balance">
            Eight specialists. <span className="text-gradient">One coordinated plan.</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Not a single chatbot guess — a sequenced org where each agent builds on the last, and the
            planning specialists work in parallel. Exactly how a senior team would scope it.
          </p>
        </Reveal>

        <div className="mt-14 space-y-3">
          {STAGES.map((stage, si) => (
            <div key={stage.label}>
              <Reveal direction="up" amount={0.4}>
                <div className="mb-2 flex items-center gap-3">
                  <span className="grid place-items-center w-7 h-7 rounded-full border border-primary/30 bg-primary/10 text-xs font-semibold text-primary">
                    {si + 1}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {stage.label}
                  </span>
                </div>
              </Reveal>

              <RevealStagger className="grid gap-3 sm:grid-cols-3">
                {stage.agents.map((a) => (
                  <RevealItem key={a.name} className={stage.agents.length === 1 ? 'sm:col-span-3' : ''}>
                    <div className="surface-card surface-card-hover p-4 h-full flex items-start gap-3">
                      <span className="grid place-items-center w-10 h-10 rounded-xl border border-white/10 bg-white/[0.04] shrink-0">
                        <a.icon className={`w-5 h-5 ${a.color}`} />
                      </span>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <h3 className="font-semibold text-foreground">{a.name}</h3>
                          <span className="text-[11px] text-muted-foreground">{a.role}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{a.output}</p>
                      </div>
                    </div>
                  </RevealItem>
                ))}
              </RevealStagger>

              {si < STAGES.length - 1 && (
                <div className="flex justify-center py-1.5">
                  <ArrowDown className="w-4 h-4 text-primary/40" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
