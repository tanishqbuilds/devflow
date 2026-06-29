'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Hourglass, TrendingDown } from 'lucide-react'
import { Reveal, RevealStagger, RevealItem } from './reveal'

const PAINS = [
  {
    icon: Hourglass,
    title: 'Three weeks of scoping',
    line: 'Docs that are stale before the first sprint starts.',
  },
  {
    icon: TrendingDown,
    title: '2× estimate misses',
    line: "Gut-feel numbers you can't defend to stakeholders.",
  },
  {
    icon: AlertTriangle,
    title: 'Budgets blown silently',
    line: "You learn the cost overrun only once it's too late.",
  },
] as const

export function ProblemSection() {
  return (
    <section id="problem" className="relative px-4 py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <Reveal direction="up" className="max-w-3xl">
          <span className="eyebrow">
            <AlertTriangle className="w-3.5 h-3.5" /> The cost of bad planning
          </span>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight text-balance">
            Planning is where projects quietly go wrong.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground text-balance">
            Weeks of scoping docs nobody reads. Estimates that miss by 2×. Scope
            creep, mystery dependencies, and a budget you discover is blown only
            after the sprint. The plan is the most expensive thing to get wrong —
            and the easiest to rush.
          </p>
        </Reveal>

        <RevealStagger className="mt-12 grid gap-4 sm:grid-cols-3">
          {PAINS.map(({ icon: Icon, title, line }) => (
            <RevealItem key={title}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="surface-card surface-card-hover h-full p-6"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{line}</p>
              </motion.div>
            </RevealItem>
          ))}
        </RevealStagger>

        <Reveal direction="up" delay={0.1} className="mt-14">
          <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-balance">
            PlanForge does the planning the way a senior team would —{' '}
            <span className="text-gradient">in minutes.</span>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
