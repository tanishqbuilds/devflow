'use client'

import { AlertTriangle, Hourglass, TrendingDown } from 'lucide-react'
import { Reveal, RevealStagger, RevealItem } from './reveal'

const PAINS = [
  {
    icon: Hourglass,
    title: 'Weeks of Scoping Meetings',
    line: 'Static specification documents that go obsolete before the first sprint starts.',
  },
  {
    icon: TrendingDown,
    title: '2× Timeline & Effort Misses',
    line: 'Unverified estimates that fail to account for technical debt and dependencies.',
  },
  {
    icon: AlertTriangle,
    title: 'Silent Budget Escalation',
    line: 'Cost overruns discovered only after months of committed engineering payroll.',
  },
] as const

export function ProblemSection() {
  return (
    <section id="problem" className="relative px-4 py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <Reveal direction="up" className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold tracking-wide shadow-xs">
            <AlertTriangle className="w-3.5 h-3.5" /> The High Cost of Unstructured Planning
          </span>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Most software projects fail before the first line of code.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
            Lengthy scoping meetings produce documents nobody reads. Technical debt, hidden dependencies, and cloud architecture bottlenecks derail delivery schedules.
          </p>
        </Reveal>

        <RevealStagger className="mt-12 grid gap-4 sm:grid-cols-3">
          {PAINS.map(({ icon: Icon, title, line }) => (
            <RevealItem key={title}>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-slate-300 hover:shadow-md transition-all h-full">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-sm font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">{line}</p>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>

        <Reveal direction="up" delay={0.1} className="mt-12">
          <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Devflow plans software the way a senior staff engineering team would —{' '}
            <span className="text-gradient">in under two minutes.</span>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
