'use client'

import {
  Crown, ClipboardList, Boxes, ListChecks, ShieldAlert, Users, CalendarRange, Plug, ArrowDown,
} from 'lucide-react'
import { Reveal, RevealStagger, RevealItem } from './reveal'

type AgentCard = { icon: any; name: string; role: string; output: string; color: string; bg: string; border: string }

const STAGES: { label: string; agents: AgentCard[] }[] = [
  {
    label: 'Stage 1: Executive Vision',
    agents: [
      { icon: Crown, name: 'CEO Agent', role: 'Chief Vision Officer', output: 'Business goals, monetization model, and complexity analysis', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    ],
  },
  {
    label: 'Stage 2: Product Definition',
    agents: [
      { icon: ClipboardList, name: 'Product Manager Agent', role: 'Senior Product Manager', output: 'Functional & non-functional requirements and user stories', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    ],
  },
  {
    label: 'Stage 3: Technical Architecture',
    agents: [
      { icon: Boxes, name: 'System Architect Agent', role: 'Principal Architect', output: 'Distributed component design, data models, and cloud infrastructure', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    ],
  },
  {
    label: 'Stage 4: Parallel Sprint & Delivery Planning',
    agents: [
      { icon: ListChecks, name: 'Sprint Planner', role: 'Agile Delivery Lead', output: 'Epics, story points, and task dependency DAG', color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200' },
      { icon: ShieldAlert, name: 'Risk Analyst', role: 'Risk & Security Analyst', output: 'Ranked threat vectors and actionable mitigations', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
      { icon: Users, name: 'Team Allocation', role: 'VP of Engineering', output: 'Engineering headcount modeling and financial rate cards', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    ],
  },
  {
    label: 'Stage 5: Parallel Delivery & DevOps Roadmap',
    agents: [
      { icon: CalendarRange, name: 'Timeline Agent', role: 'Delivery Director', output: 'Milestones, release gates, and critical path schedules', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
      { icon: Plug, name: 'DevOps Agent', role: 'Platform Architect', output: 'GitHub Actions CI/CD workflows and Docker configurations', color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
    ],
  },
]

export function AgentsShowcase() {
  return (
    <section id="agents" className="relative px-4 py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <Reveal className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide shadow-xs">
            Autonomous Multi-Agent Organization
          </span>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Eight specialist agents. <span className="text-gradient">One coordinated delivery plan.</span>
          </h2>
          <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
            Not a generic one-shot prompt — a choreographed multi-agent pipeline where each specialist cross-validates upstream artifacts and executes peer-to-peer consultations.
          </p>
        </Reveal>

        <div className="mt-14 space-y-4">
          {STAGES.map((stage, si) => (
            <div key={stage.label}>
              <Reveal direction="up" amount={0.3}>
                <div className="mb-2 flex items-center gap-2.5">
                  <span className="grid place-items-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                    {si + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {stage.label}
                  </span>
                </div>
              </Reveal>

              <RevealStagger className="grid gap-3 sm:grid-cols-3">
                {stage.agents.map((a) => (
                  <RevealItem key={a.name} className={stage.agents.length === 1 ? 'sm:col-span-3' : ''}>
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-slate-300 hover:shadow-md transition-all h-full flex items-start gap-3.5">
                      <div className={`w-10 h-10 rounded-xl ${a.bg} ${a.border} border flex items-center justify-center shrink-0 ${a.color}`}>
                        <a.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900">{a.name}</h3>
                          <span className="text-[11px] font-medium text-slate-400">{a.role}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">{a.output}</p>
                      </div>
                    </div>
                  </RevealItem>
                ))}
              </RevealStagger>

              {si < STAGES.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowDown className="w-4 h-4 text-slate-300" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
