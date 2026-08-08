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
    name: 'Starter',
    tagline: 'Experience autonomous multi-agent planning.',
    monthly: 0,
    annual: 0,
    cta: 'Start Free',
    features: [
      '8 specialist AI agents per run',
      'Interactive architecture & DAG',
      'Sprint backlog with story points',
      '1 migration import',
    ],
    note: '3 full project specifications, no credit card required',
  },
  {
    name: 'Professional',
    tagline: 'For engineering leads and product builders.',
    monthly: 29,
    annual: 24,
    cta: 'Start 14-Day Free Trial',
    features: [
      'Unlimited project analyses & iterations',
      'Interactive Jira & Linear export',
      'Full security risk & OWASP auditing',
      'PostgreSQL & Redis database context',
      'AI Copilot project chat',
    ],
  },
  {
    name: 'Team / Studio',
    tagline: 'For fast-shipping product squads.',
    monthly: 59,
    annual: 49,
    unit: '/seat',
    cta: 'Start Team Trial',
    featured: true,
    features: [
      'Everything in Professional',
      'Multi-seat workspace collaboration',
      'Kanban drag-and-drop task assignment',
      'Custom rate cards & staffing benchmarks',
      'Priority Groq LLaMA 3.3 concurrency',
    ],
    note: '2-seat minimum',
  },
  {
    name: 'Enterprise',
    tagline: 'For scale, compliance, and custom LLMs.',
    monthly: null,
    annual: null,
    cta: 'Contact Sales',
    features: [
      'Custom LLM models (Private Cloud / Ollama)',
      'SSO / SAML & SCIM directory sync',
      'Dedicated compliance audit logging',
      'SLA & dedicated solution architect',
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide shadow-xs">
            <Sparkles className="w-3.5 h-3.5" /> Transparent Pricing
          </span>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Start free. <span className="text-gradient">Upgrade when it accelerates your sprints.</span>
          </h2>
          <p className="mt-4 text-slate-600 text-sm sm:text-base">
            One miscalculated delivery timeline costs more than an annual subscription.
          </p>

          {/* Toggle */}
          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                !annual ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                annual ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Annual Billing <span className="opacity-90 font-normal">· Save 20%</span>
            </button>
          </div>
        </Reveal>

        <RevealStagger className="mt-12 grid gap-5 lg:grid-cols-4 sm:grid-cols-2 items-stretch">
          {TIERS.map((t) => {
            const price = annual ? t.annual : t.monthly
            return (
              <RevealItem key={t.name} className="h-full">
                <div
                  className={`relative h-full flex flex-col rounded-2xl border p-6 bg-white transition-all ${
                    t.featured
                      ? 'border-2 border-blue-600 shadow-lg'
                      : 'border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  {t.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-[11px] font-bold text-white shadow-xs">
                      MOST POPULAR
                    </span>
                  )}
                  <h3 className="text-base font-bold text-slate-900">{t.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">{t.tagline}</p>

                  <div className="mt-5 flex items-baseline gap-1">
                    {price === null ? (
                      <span className="text-3xl font-bold text-slate-900">Custom</span>
                    ) : price === 0 ? (
                      <span className="text-4xl font-bold text-slate-900">$0</span>
                    ) : (
                      <>
                        {annual && t.monthly !== null && (
                          <span className="text-sm text-slate-400 line-through">${t.monthly}</span>
                        )}
                        <span className="text-3xl font-bold text-slate-900">${price}</span>
                        <span className="text-xs text-slate-500 font-medium">{t.unit ?? ''}/mo</span>
                      </>
                    )}
                  </div>
                  {annual && t.monthly && t.annual ? (
                    <p className="mt-1 text-[11px] font-semibold text-emerald-600">Save ${(t.monthly - t.annual) * 12}/year</p>
                  ) : (
                    <p className="mt-1 text-[11px] text-transparent select-none">.</p>
                  )}

                  <button
                    onClick={start}
                    className={`mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                      t.featured
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                        : 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    {t.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <ul className="mt-6 space-y-2.5 flex-1">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                        <Check className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {t.note && <p className="mt-4 text-[11px] text-slate-400 italic">{t.note}</p>}
                </div>
              </RevealItem>
            )
          })}
        </RevealStagger>

        <Reveal className="mt-8 text-center text-xs text-slate-400">
          Cancel anytime · Zero credit card required to start · Enterprise volume discounts available.
        </Reveal>
      </div>
    </section>
  )
}
