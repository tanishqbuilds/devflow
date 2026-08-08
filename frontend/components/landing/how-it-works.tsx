'use client'

import { motion } from 'framer-motion'
import { PencilLine, Cpu, Rocket, ArrowDown } from 'lucide-react'
import { Reveal, RevealStagger, RevealItem } from './reveal'

const STEPS = [
  {
    number: '01',
    Icon: PencilLine,
    title: 'Input Project Concept',
    body: 'Provide a single sentence or a raw PRD brief. No complex forms or rigid templates required.',
  },
  {
    number: '02',
    Icon: Cpu,
    title: 'Multi-Agent Collaboration',
    body: '8 specialist AI agents collaborate, cross-validating technical feasibility, security threats, and sprint velocities.',
  },
  {
    number: '03',
    Icon: Rocket,
    title: 'Ship Specifications & Sync',
    body: 'Review interactive diagrams, export directly to Jira/Linear/Markdown, and kickoff development immediately.',
  },
] as const

export function HowItWorks() {
  return (
    <section id="how" className="relative px-4 py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide shadow-xs">
            Three Step Workflow
          </span>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Raw Idea in. <span className="text-gradient">Production Blueprint out.</span>
          </h2>
        </Reveal>

        <RevealStagger className="mt-12 grid gap-5 sm:grid-cols-3">
          {STEPS.map(({ number, Icon, title, body }) => (
            <RevealItem key={number}>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs hover:border-slate-300 hover:shadow-md transition-all h-full">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-4xl sm:text-5xl font-bold tracking-tight leading-none text-slate-200">
                    {number}
                  </span>
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>

                <h3 className="mt-6 text-base font-bold tracking-tight text-slate-900">
                  {title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {body}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  )
}
