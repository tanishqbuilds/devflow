'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Reveal } from './reveal'

export function FinalCta() {
  const handlePlan = () => {
    document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' })
    window.setTimeout(() => {
      const input = document.getElementById('idea-input') as HTMLTextAreaElement | null
      input?.focus()
    }, 600)
  }

  return (
    <section id="cta" className="relative px-4 py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <Reveal direction="up">
          <div className="relative isolate overflow-hidden rounded-3xl bg-slate-900 text-white px-6 py-16 text-center sm:px-12 sm:py-20 shadow-2xl">
            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold tracking-wide mb-4">
                <Sparkles className="h-3.5 w-3.5" /> Start With One Idea
              </span>

              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
                Stop scoping in silos. <br /><span className="text-blue-400">Start shipping with clarity.</span>
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-slate-300 text-sm sm:text-base leading-relaxed">
                Provide Devflow a single product prompt and receive an actionable delivery specification your whole engineering team can execute from immediately.
              </p>

              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={handlePlan}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all cursor-pointer"
                >
                  Generate Free Project Blueprint
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Complete delivery specification in ~2 minutes · Zero setup required
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
