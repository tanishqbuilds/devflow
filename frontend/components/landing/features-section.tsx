'use client'

import { motion } from 'framer-motion'
import {
  Calculator,
  ListChecks,
  ShieldAlert,
  Users,
  Workflow,
  Share2,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react'
import { Reveal, RevealStagger, RevealItem } from './reveal'

type Accent = {
  /** icon foreground tint */
  text: string
  /** icon chip background tint */
  chip: string
  /** subtle radial glow color (rgba) layered behind the card */
  glow: string
}

const ACCENTS: Record<string, Accent> = {
  cyan: {
    text: 'text-cyan-300',
    chip: 'bg-cyan-400/10 ring-1 ring-cyan-400/20',
    glow: 'rgba(0,217,255,0.16)',
  },
  violet: {
    text: 'text-violet-300',
    chip: 'bg-violet-400/10 ring-1 ring-violet-400/20',
    glow: 'rgba(124,58,237,0.18)',
  },
  emerald: {
    text: 'text-emerald-300',
    chip: 'bg-emerald-400/10 ring-1 ring-emerald-400/20',
    glow: 'rgba(16,185,129,0.16)',
  },
  amber: {
    text: 'text-amber-300',
    chip: 'bg-amber-400/10 ring-1 ring-amber-400/20',
    glow: 'rgba(245,158,11,0.16)',
  },
  sky: {
    text: 'text-sky-300',
    chip: 'bg-sky-400/10 ring-1 ring-sky-400/20',
    glow: 'rgba(56,189,248,0.16)',
  },
  fuchsia: {
    text: 'text-fuchsia-300',
    chip: 'bg-fuchsia-400/10 ring-1 ring-fuchsia-400/20',
    glow: 'rgba(217,70,239,0.16)',
  },
}

type Feature = {
  icon: typeof Calculator
  title: string
  body: string
  accent: keyof typeof ACCENTS
  /** grid span classes for the bento layout (lg breakpoint) */
  span?: string
  hero?: boolean
}

const FEATURES: Feature[] = [
  {
    icon: Calculator,
    title: 'Estimates you can actually defend.',
    body: 'Effort and cost ranges with the assumptions shown — not a magic number.',
    accent: 'cyan',
    span: 'lg:col-span-2 lg:row-span-2',
    hero: true,
  },
  {
    icon: ListChecks,
    title: "A backlog that's ready to assign.",
    body: 'Epics → stories → tasks, each with acceptance criteria and dependencies.',
    accent: 'violet',
  },
  {
    icon: ShieldAlert,
    title: 'See the risks before they bill you.',
    body: 'A costed risk register, ranked, each with a concrete mitigation.',
    accent: 'emerald',
  },
  {
    icon: Users,
    title: 'Right-sized team, on day one.',
    body: 'Roles, seniority and headcount derived from real scope.',
    accent: 'amber',
  },
  {
    icon: Workflow,
    title: 'A live architecture diagram.',
    body: 'A component diagram generated from the chosen stack.',
    accent: 'sky',
  },
  {
    icon: Share2,
    title: 'Export to the tools you use.',
    body: 'Linear, Jira, Notion, Markdown. Your plan, your tools, no lock-in.',
    accent: 'fuchsia',
    span: 'sm:col-span-2 lg:col-span-1',
  },
]

function FeatureCard({ feature }: { feature: Feature }) {
  const accent = ACCENTS[feature.accent]
  const Icon = feature.icon

  return (
    <RevealItem className={feature.span}>
      <motion.article
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className={`surface-card surface-card-hover group relative h-full overflow-hidden ${
          feature.hero ? 'p-7 sm:p-9' : 'p-6'
        }`}
      >
        {/* accent glow that warms up on hover */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full opacity-60 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: `radial-gradient(circle, ${accent.glow}, transparent 70%)` }}
        />

        <div className="relative flex h-full flex-col">
          <div className="flex items-start justify-between">
            <span
              className={`inline-flex items-center justify-center rounded-xl ${accent.chip} ${
                feature.hero ? 'h-12 w-12' : 'h-11 w-11'
              }`}
            >
              <Icon
                className={`${accent.text} ${feature.hero ? 'h-6 w-6' : 'h-5 w-5'}`}
                strokeWidth={1.75}
                aria-hidden
              />
            </span>

            {feature.hero && (
              <span className="eyebrow">
                <Sparkles className="h-3.5 w-3.5" aria-hidden /> Core output
              </span>
            )}

            {!feature.hero && (
              <ArrowUpRight
                className="h-4 w-4 text-muted-foreground/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground/70"
                aria-hidden
              />
            )}
          </div>

          <h3
            className={`mt-5 font-semibold tracking-tight text-balance text-foreground ${
              feature.hero ? 'text-2xl sm:text-3xl' : 'text-lg'
            }`}
          >
            {feature.title}
          </h3>

          <p
            className={`mt-2.5 text-muted-foreground ${
              feature.hero ? 'text-base sm:text-lg max-w-md' : 'text-sm'
            }`}
          >
            {feature.body}
          </p>

          {feature.hero && (
            <div className="mt-auto pt-7">
              <div className="flex flex-wrap gap-2">
                {['Effort range', 'Cost band', 'Assumptions', 'Confidence'].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.article>
    </RevealItem>
  )
}

export function FeaturesSection() {
  return (
    <section id="features" className="relative px-4 py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <Reveal className="max-w-2xl">
          <span className="eyebrow">
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> What you get
          </span>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight text-balance">
            Not a doc. <span className="text-gradient">A plan you can build from.</span>
          </h2>
          <p className="mt-4 text-muted-foreground sm:text-lg">
            Every run produces the artifacts a real delivery team needs — estimated, ranked,
            and ready to hand off.
          </p>
        </Reveal>

        <RevealStagger className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 auto-rows-fr">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </RevealStagger>
      </div>
    </section>
  )
}
