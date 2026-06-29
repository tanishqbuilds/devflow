'use client'

import { FileStack, Users, Timer, Gauge } from 'lucide-react'
import { Reveal, RevealStagger, RevealItem } from './reveal'

interface Stat {
  icon: typeof FileStack
  value: string
  label: string
}

const stats: Stat[] = [
  { icon: FileStack, value: '4,200+', label: 'plans generated' },
  { icon: Users, value: '8', label: 'AI specialists per plan' },
  { icon: Timer, value: '~2 min', label: 'to first plan' },
  { icon: Gauge, value: '92%', label: 'less planning time' },
]

export function TrustBar() {
  return (
    <section id="trust" className="relative px-4 py-8 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <Reveal direction="up" className="text-center">
          <p className="text-xs sm:text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Trusted by builders shipping faster
          </p>
        </Reveal>

        <RevealStagger className="mt-6 grid grid-cols-2 gap-y-8 gap-x-4 sm:grid-cols-4 sm:gap-x-0">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <RevealItem
                key={stat.label}
                className={
                  'flex flex-col items-center text-center px-2 sm:px-6 ' +
                  (i > 0 ? 'sm:border-l sm:border-white/10' : '')
                }
              >
                <Icon
                  className="mb-2 h-4 w-4 text-primary/70"
                  aria-hidden="true"
                />
                <span className="text-3xl sm:text-4xl font-bold tracking-tight text-gradient tabular-nums">
                  {stat.value}
                </span>
                <span className="mt-1 text-xs sm:text-sm text-muted-foreground text-balance">
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
