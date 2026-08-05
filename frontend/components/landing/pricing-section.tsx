'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ArrowRight, Sparkles } from 'lucide-react'
import { Reveal, RevealStagger, RevealItem } from './reveal'

type Tier = {
  name: string
  tagline: string
  monthly: number | null
  annual: number | null
  unit?: string
  cta: string
  featured?: boolean
  features: string[]
  note?: string
}

const TIERS: Tier[] = [
  {
    name: 'Spark',
    tagline: 'See the full magic, free.',
    monthly: 0,
    annual: 0,
    cta: 'Start free',
    features: [
      'All 8 agents run on a real idea',
      'Full in-app plan view',
      '1 migration import',
      'Community support',
    ],
    note: '3 full plans, no card required',
  },
  {
    name: 'Founder',
    tagline: 'For solo builders who ship.',
    monthly: 19,
    annual: 15,
    cta: 'Start 14-day trial',
    features: [
      'Unlimited plans & re-runs',
      'Editable plans + file uploads',
      'Export to Linear / Jira / Notion / Markdown',
      'Full migration wizard',
      'Cost & risk modules',
    ],
  },
  {
    name: 'Studio',
    tagline: 'For teams planning together.',
    monthly: 39,
    annual: 32,
    unit: '/seat',
    cta: 'Start 14-day trial',
    featured: true,
    features: [
      'Everything in Founder',
      'Shared workspace & plan library',
      'Comments & collaboration',
      'Priority models & templates',
      'Admin controls',
    ],
    note: '2-seat minimum',
  },
  {
    name: 'Org',
    tagline: 'For scale and compliance.',
    monthly: null,
    annual: null,
    cta: 'Talk to us',
    features: [
      'SSO / SAML & SCIM',
      'Data residency & audit logs',
      'Custom agent roles',
      'SLA & dedicated support',
    ],
  },
]

export function PricingSection() {
  const [annual, setAnnual] = useState(true)

  const start = () => document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section id="pricing" className="relative px-4 py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center max-w-2xl mx-auto">
          <span className="eyebrow"><Sparkles className="w-3.5 h-3.5" /> Pricing</span>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight">
            Start free. <span className="text-gradient">Upgrade when it pays for itself.</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            One blown sprint costs more than a year of Devflow. Pricing scales with plans, not friction.
          </p>

          {/* toggle */}
          <div className="mt-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${!annual ? 'bg-white/10 text-foreground' : 'text-muted-foreground'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${annual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              Annual <span className="text-[10px] opacity-80">· 2 months free</span>
            </button>
          </div>
        </Reveal>

        <RevealStagger className="mt-12 grid gap-5 lg:grid-cols-4 sm:grid-cols-2 items-stretch">
          {TIERS.map((t) => {
            const price = annual ? t.annual : t.monthly
            return (
              <RevealItem key={t.name} className="h-full">
                <motion.div
                  whileHover={{ y: -6 }}
                  className={`relative h-full flex flex-col rounded-2xl border p-6 ${
                    t.featured
                      ? 'border-primary/50 bg-gradient-to-b from-primary/[0.10] to-card/40 shadow-[0_0_50px_-16px_var(--primary)]'
                      : 'border-white/10 bg-card/40'
                  } backdrop-blur-xl`}
                >
                  {t.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-foreground">{t.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t.tagline}</p>

                  <div className="mt-5 flex items-end gap-1">
                    {price === null ? (
                      <span className="text-3xl font-bold">Custom</span>
                    ) : price === 0 ? (
                      <span className="text-4xl font-bold">$0</span>
                    ) : (
                      <>
                        {annual && t.monthly !== null && (
                          <span className="mb-1 mr-1 text-sm text-muted-foreground line-through">${t.monthly}</span>
                        )}
                        <span className="text-4xl font-bold">${price}</span>
                        <span className="mb-1 text-sm text-muted-foreground">{t.unit ?? ''}/mo</span>
                      </>
                    )}
                  </div>
                  {annual && t.monthly && t.annual ? (
                    <p className="mt-1 text-xs text-primary">Save ${(t.monthly - t.annual) * 12}/yr</p>
                  ) : (
                    <p className="mt-1 text-xs text-transparent select-none">.</p>
                  )}

                  <button
                    onClick={start}
                    className={`mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      t.featured
                        ? 'bg-primary text-primary-foreground hover:shadow-[0_0_24px_-4px_var(--primary)]'
                        : 'border border-white/15 bg-white/5 text-foreground hover:bg-white/10'
                    }`}
                  >
                    {t.cta} <ArrowRight className="w-4 h-4" />
                  </button>

                  <ul className="mt-6 space-y-2.5">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {t.note && <p className="mt-4 text-xs text-muted-foreground/70">{t.note}</p>}
                </motion.div>
              </RevealItem>
            )
          })}
        </RevealStagger>

        <Reveal className="mt-8 text-center text-xs text-muted-foreground">
          Cancel anytime · No card to start · Runs on efficient open models, so the free tier is genuinely free.
        </Reveal>
      </div>
    </section>
  )
}
