'use client'

import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Check } from 'lucide-react'
import { HeroPreview } from './hero-preview'

const TRUST = ['Free to start', 'No credit card', 'First plan in ~2 min']

export function HeroSection() {
  const focusInput = () => {
    document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' })
    setTimeout(() => document.getElementById('idea-input')?.focus(), 600)
  }
  const seePlan = () => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section className="relative px-4 pt-28 sm:pt-32 pb-10">
      <div className="max-w-5xl mx-auto text-center">
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="eyebrow">
            <Sparkles className="w-3.5 h-3.5" />
            Plans your next build in minutes, not sprints
          </span>
        </motion.div>

        <motion.h1
          className="mt-6 text-balance text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08 }}
        >
          Ship the plan before you
          <br className="hidden sm:block" /> write the <span className="text-gradient">first line of code.</span>
        </motion.h1>

        <motion.p
          className="mt-6 mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.16 }}
        >
          Devflow is an AI organization — PM, architect, estimation and risk agents — that turns
          one idea into a complete delivery plan: requirements, backlog, milestones, team, cost and risks.
        </motion.p>

        <motion.div
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.24 }}
        >
          <motion.button
            onClick={focusInput}
            className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-[0_0_30px_-6px_var(--primary)] hover:shadow-[0_0_44px_-4px_var(--primary)] transition-shadow"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Plan my project
            <ArrowRight className="w-4.5 h-4.5 transition-transform group-hover:translate-x-0.5" />
          </motion.button>
          <motion.button
            onClick={seePlan}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-base font-medium text-foreground hover:bg-white/10 hover:border-white/25 transition-colors"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            See a live plan
          </motion.button>
        </motion.div>

        <motion.div
          className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.36 }}
        >
          {TRUST.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <Check className="w-4 h-4 text-primary" /> {t}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Animated product preview */}
      <motion.div
        className="mt-14 sm:mt-16"
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <HeroPreview />
      </motion.div>
    </section>
  )
}
