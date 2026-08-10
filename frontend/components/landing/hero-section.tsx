'use client'

import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Check } from 'lucide-react'
import { HeroPreview } from './hero-preview'

const TRUST = ['Free to start', 'No credit card required', 'Full SDLC specification in ~2 min']

export function HeroSection() {
  const focusInput = () => {
    const target = document.getElementById('plan') ?? document.getElementById('idea-input')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.setTimeout(() => {
        const input = document.getElementById('idea-input') as HTMLTextAreaElement | null
        input?.focus()
      }, 700)
    } else {
      window.location.hash = '#plan'
    }
  }
  const seePlan = () => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <section className="relative px-4 pt-28 sm:pt-32 pb-12">
      <div className="max-w-5xl mx-auto text-center">
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            Autonomous AI Multi-Agent SDLC Architecture
          </span>
        </motion.div>

        <motion.h1
          className="mt-6 text-balance text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight text-slate-900"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
        >
          Ship the plan before you
          <br className="hidden sm:block" /> write the <span className="text-gradient">first line of code.</span>
        </motion.h1>

        <motion.p
          className="mt-6 mx-auto max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16 }}
        >
          Devflow is an autonomous AI engineering organization — PM, system architect, sprint planner, risk analyst, and DevOps agents — that converts raw product ideas into production delivery specifications.
        </motion.p>

        <motion.div
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24 }}
        >
          <button
            onClick={focusInput}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            Start Planning Free
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={seePlan}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-700 transition-colors shadow-xs cursor-pointer"
          >
            Explore Interactive Demo
          </button>
        </motion.div>

        <motion.div
          className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.32 }}
        >
          {TRUST.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-blue-600" /> {t}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Product preview card */}
      <motion.div
        className="mt-12 sm:mt-14"
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.38 }}
      >
        <HeroPreview />
      </motion.div>
    </section>
  )
}
