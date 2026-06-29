'use client'

import { motion } from 'framer-motion'
import { PencilLine, Cpu, Rocket, ArrowDown } from 'lucide-react'
import { Reveal, RevealStagger, RevealItem } from './reveal'

const STEPS = [
  {
    number: '01',
    Icon: PencilLine,
    title: 'Describe it',
    body: 'One sentence or a messy brief — both work. No templates, no forms.',
  },
  {
    number: '02',
    Icon: Cpu,
    title: 'The org gets to work',
    body: 'CEO, PM, architect, sprint, risk, team and timeline agents draft requirements, a backlog, milestones, team shape and a costed risk register.',
  },
  {
    number: '03',
    Icon: Rocket,
    title: 'Review & ship',
    body: 'Edit anything, export to Jira / Linear / GitHub, and build with eyes open.',
  },
] as const

export function HowItWorks() {
  return (
    <section id="how" className="relative px-4 py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center">
          <span className="eyebrow">How it works</span>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight text-balance">
            One idea in. A complete plan out.
          </h2>
        </Reveal>

        <RevealStagger className="mt-12 grid gap-5 sm:grid-cols-3">
          {STEPS.map(({ number, Icon, title, body }) => (
            <RevealItem key={number}>
              <motion.article
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="surface-card surface-card-hover group h-full p-6 sm:p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    aria-hidden="true"
                    className="text-5xl sm:text-6xl font-bold tracking-tight leading-none text-gradient"
                  >
                    {number}
                  </span>
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-primary transition-colors group-hover:border-primary/40">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-semibold tracking-tight text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </motion.article>
            </RevealItem>
          ))}
        </RevealStagger>

        <Reveal delay={0.1} className="mt-10 text-center">
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            Watch the agents plan a real project
            <ArrowDown className="h-4 w-4 text-primary" aria-hidden="true" />
          </p>
        </Reveal>
      </div>
    </section>
  )
}
