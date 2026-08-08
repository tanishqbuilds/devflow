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

type Feature = {
  icon: typeof Calculator
  title: string
  body: string
  color: string
  bg: string
  border: string
  span?: string
  hero?: boolean
}

const FEATURES: Feature[] = [
  {
    icon: Calculator,
    title: 'Defensible Financial & Effort Estimates',
    body: 'Granular development days, role compensation rate cards, and cloud infrastructure modeling with full transparency.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    span: 'lg:col-span-2 lg:row-span-2',
    hero: true,
  },
  {
    icon: ListChecks,
    title: "Sprint-Ready Backlog & Epics",
    body: 'User stories structured with MoSCoW priorities, story point weights, and acceptance criteria.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  {
    icon: ShieldAlert,
    title: 'Pre-Emptive Security & Risk Auditing',
    body: 'Automated OWASP Top 10, GDPR/SOC2 compliance threat modeling, and mitigation blueprints.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  {
    icon: Users,
    title: 'Optimized Engineering Staffing',
    body: 'Right-sized FTE roles, seniority distribution, and ownership matrices aligned to scope.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  {
    icon: Workflow,
    title: 'Interactive Distributed Architecture',
    body: 'Visual component topologies, database schemas, and API contracts generated dynamically.',
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
  },
  {
    icon: Share2,
    title: 'Multi-Format Export & Integrations',
    body: 'Seamlessly export to Jira, Linear, Notion, and Markdown specifications with zero lock-in.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    span: 'sm:col-span-2 lg:col-span-1',
  },
]

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon

  return (
    <RevealItem className={feature.span}>
      <div
        className={`bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-slate-300 hover:shadow-md transition-all h-full flex flex-col ${
          feature.hero ? 'p-7 sm:p-9' : 'p-6'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className={`w-11 h-11 rounded-xl ${feature.bg} ${feature.border} border flex items-center justify-center ${feature.color}`}>
            <Icon className="w-5 h-5" />
          </div>

          {feature.hero ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Core Deliverable
            </span>
          ) : (
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          )}
        </div>

        <h3 className={`mt-5 font-bold text-slate-900 tracking-tight ${feature.hero ? 'text-2xl sm:text-3xl' : 'text-base'}`}>
          {feature.title}
        </h3>

        <p className={`mt-2 text-slate-600 leading-relaxed ${feature.hero ? 'text-sm sm:text-base max-w-md' : 'text-xs'}`}>
          {feature.body}
        </p>

        {feature.hero && (
          <div className="mt-auto pt-6 flex flex-wrap gap-2">
            {['Story Point Velocity', 'Role Rate Cards', 'Cloud Compute Sizing', 'Critical Path'].map((chip) => (
              <span
                key={chip}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>
    </RevealItem>
  )
}

export function FeaturesSection() {
  return (
    <section id="features" className="relative px-4 py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <Reveal className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide shadow-xs">
            <Sparkles className="w-3.5 h-3.5" /> Comprehensive SDLC Deliverables
          </span>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Not just documentation. <span className="text-gradient">An executable delivery plan.</span>
          </h2>
          <p className="mt-4 text-slate-600 sm:text-base leading-relaxed">
            Every analysis run produces the exact structured artifacts that engineering teams, product managers, and executives need to start executing immediately.
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
