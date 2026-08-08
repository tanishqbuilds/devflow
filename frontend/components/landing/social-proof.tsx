'use client'

import { Quote, TrendingDown, TrendingUp, Zap } from 'lucide-react'
import { Reveal, RevealStagger, RevealItem } from './reveal'

const metrics = [
  {
    icon: TrendingDown,
    label: 'Planning Cycle Time',
    value: '↓ 92%',
    blurb: 'From multi-week scoping marathons to under 2 minutes.',
  },
  {
    icon: TrendingUp,
    label: 'Estimate Confidence',
    value: '↑ 2.4×',
    blurb: 'Defensible story points with transparent assumptions.',
  },
  {
    icon: Zap,
    label: 'First Full Specification',
    value: '~2 min',
    blurb: 'Complete PRD, architecture, and backlog generated.',
  },
] as const

const testimonials = [
  {
    quote: 'Devflow cut our sprint scoping from three weeks to an afternoon. We shipped our MVP architecture before kickoff.',
    name: 'Maya R.',
    role: 'CTO & Co-Founder',
    initials: 'MR',
  },
  {
    quote: 'The security threat modeling and rate-card estimates gave us numbers we could defend directly to our board.',
    name: 'Devon K.',
    role: 'VP of Engineering at Series A Startup',
    initials: 'DK',
  },
  {
    quote: 'I scope client applications in minutes and generate accurate delivery roadmaps with zero guesswork.',
    name: 'Priya S.',
    role: 'Managing Director, Cloud Agency',
    initials: 'PS',
  },
] as const

export function SocialProof() {
  return (
    <section id="social" className="relative px-4 py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <Reveal direction="up" className="text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide shadow-xs">
            Proven Outcomes
          </span>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Engineered for teams that <span className="text-gradient">ship on time.</span>
          </h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
            Less time arguing about scope, more time delivering high-impact features.
          </p>
        </Reveal>

        {/* Metrics Strip */}
        <Reveal direction="up" delay={0.1} className="mt-12">
          <dl className="grid gap-4 sm:grid-cols-3">
            {metrics.map(({ icon: Icon, label, value, blurb }) => (
              <div key={label} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-center sm:text-left">
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <dt className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</dt>
                </div>
                <dd className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
                  {value}
                </dd>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">{blurb}</p>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* Testimonials */}
        <RevealStagger className="mt-8 grid gap-4 sm:grid-cols-3">
          {testimonials.map(({ quote, name, role, initials }) => (
            <RevealItem key={name} className="h-full">
              <figure className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex h-full flex-col">
                <Quote className="h-5 w-5 text-blue-600" />
                <blockquote className="mt-4 flex-1 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  &ldquo;{quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {initials}
                  </span>
                  <span className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900">{name}</span>
                    <span className="text-[11px] text-slate-500">{role}</span>
                  </span>
                </figcaption>
              </figure>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  )
}
