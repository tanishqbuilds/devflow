'use client'

import { motion } from 'framer-motion'
import { Quote, TrendingDown, TrendingUp, Zap } from 'lucide-react'

import { Reveal, RevealStagger, RevealItem } from './reveal'

const metrics = [
  {
    icon: TrendingDown,
    label: 'Planning time',
    value: '↓ 92%',
    blurb: 'From multi-week scoping marathons to a single sitting.',
  },
  {
    icon: TrendingUp,
    label: 'Estimate confidence',
    value: '↑ 2.4×',
    blurb: 'Teams commit to dates they actually believe in.',
  },
  {
    icon: Zap,
    label: 'Zero to full plan',
    value: '~2 min',
    blurb: 'A complete, structured plan before the coffee cools.',
  },
] as const

const testimonials = [
  {
    quote: 'Cut our scoping from three weeks to an afternoon. We shipped the roadmap before the sprint even started.',
    name: 'Maya R.',
    role: 'Technical Founder',
    initials: 'MR',
    gradient: 'from-[#00d9ff] to-[#7c3aed]',
  },
  {
    quote: 'Our estimates went from hopeful guesses to numbers we could defend in front of the board.',
    name: 'Devon K.',
    role: 'Eng Lead at a seed startup',
    initials: 'DK',
    gradient: 'from-[#7c3aed] to-[#00d9ff]',
  },
  {
    quote: 'I now scope client projects in minutes and bill with confidence. It paid for itself the first week.',
    name: 'Priya S.',
    role: 'Agency Owner',
    initials: 'PS',
    gradient: 'from-[#00d9ff] via-[#38bdf8] to-[#7c3aed]',
  },
] as const

export function SocialProof() {
  return (
    <section id="social" className="relative px-4 py-20 sm:py-28 scroll-mt-20">
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-40" aria-hidden="true" />

      <div className="max-w-6xl mx-auto">
        <Reveal direction="up" className="text-center">
          <span className="eyebrow">Loved by builders</span>
          <h2 className="mt-5 text-3xl sm:text-5xl font-bold tracking-tight text-balance">
            Teams stopped guessing.{' '}
            <span className="text-gradient">Then they shipped.</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-balance">
            The same outcome, again and again: less time arguing about scope, more
            time building the thing.
          </p>
        </Reveal>

        {/* Metrics strip */}
        <Reveal direction="up" delay={0.1} className="mt-12">
          <dl className="grid gap-4 sm:grid-cols-3">
            {metrics.map(({ icon: Icon, label, value, blurb }) => (
              <div key={label} className="surface-card p-6 text-center sm:text-left">
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-primary">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                </div>
                <dd className="mt-4 text-4xl font-bold tracking-tight text-gradient">
                  {value}
                </dd>
                <p className="mt-2 text-sm text-muted-foreground">{blurb}</p>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* Testimonials */}
        <RevealStagger className="mt-8 grid gap-4 sm:grid-cols-3">
          {testimonials.map(({ quote, name, role, initials, gradient }) => (
            <RevealItem key={name} className="h-full">
              <motion.figure
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="surface-card surface-card-hover flex h-full flex-col p-6"
              >
                <Quote
                  className="h-6 w-6 text-primary/70"
                  aria-hidden="true"
                />
                <blockquote className="mt-4 flex-1 text-foreground/90 text-balance">
                  &ldquo;{quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                  <span
                    className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-sm font-semibold text-background`}
                    aria-hidden="true"
                  >
                    {initials}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{name}</span>
                    <span className="text-xs text-muted-foreground">{role}</span>
                  </span>
                </figcaption>
              </motion.figure>
            </RevealItem>
          ))}
        </RevealStagger>

        <Reveal direction="up" delay={0.15} className="mt-6 text-center">
          <p className="text-xs text-muted-foreground/70">
            Illustrative — design-partner feedback.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
