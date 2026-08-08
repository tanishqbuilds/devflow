'use client'

import { FileStack, Users, Timer, Gauge } from 'lucide-react'
import { Reveal, RevealStagger, RevealItem } from './reveal'

interface Stat {
  icon: typeof FileStack
  value: string
  label: string
}

const stats: Stat[] = [
  { icon: FileStack, value: '4,200+', label: 'Specifications Generated' },
  { icon: Users, value: '8', label: 'AI Specialists Collaborating' },
  { icon: Timer, value: '~2 min', label: 'To Complete Blueprint' },
  { icon: Gauge, value: '92%', label: 'Less Scoping Cycle Time' },
]

export function TrustBar() {
  return (
    <section id="trust" className="relative px-4 py-8 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <RevealStagger className="grid grid-cols-2 gap-y-6 gap-x-4 sm:grid-cols-4 sm:gap-x-0 bg-white border border-slate-200 rounded-2xl py-6 shadow-xs">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <RevealItem
                key={stat.label}
                className={
                  'flex flex-col items-center text-center px-4 ' +
                  (i > 0 ? 'sm:border-l sm:border-slate-200' : '')
                }
              >
                <Icon className="mb-2 h-4 w-4 text-blue-600" />
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {stat.value}
                </span>
                <span className="mt-1 text-xs font-medium text-slate-500">
                  {stat.label}
                </span>
              </RevealItem>
            )
          })}
        </RevealStagger>
      </div>
    </section>
  )
}
