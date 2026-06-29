'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Reveal } from './reveal'

export function FinalCta() {
  const handlePlan = () => {
    document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' })
    // Defer focus so it lands after the smooth scroll begins.
    window.setTimeout(() => {
      const input = document.getElementById('idea-input') as HTMLTextAreaElement | null
      input?.focus()
    }, 600)
  }

  return (
    <section id="cta" className="relative px-4 py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <Reveal direction="up">
          <div className="surface-card surface-card-hover relative isolate overflow-hidden rounded-2xl px-6 py-16 text-center sm:px-12 sm:py-20">
            {/* Blueprint grid backdrop */}
            <div
              aria-hidden
              className="bg-grid pointer-events-none absolute inset-0 opacity-[0.18]"
            />

            {/* Radial glow core */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(60% 70% at 50% 0%, rgba(0,217,255,0.22), transparent 70%), radial-gradient(55% 65% at 50% 110%, rgba(124,58,237,0.22), transparent 70%)',
              }}
            />

            {/* Animated breathing aura behind the card content */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
              style={{
                background:
                  'conic-gradient(from 90deg at 50% 50%, rgba(0,217,255,0.18), rgba(124,58,237,0.18), rgba(0,217,255,0.18))',
              }}
              animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.04, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Top hairline gradient */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent"
            />

            <div className="relative">
              <span className="eyebrow">
                <Sparkles className="h-3.5 w-3.5" />
                One sentence. One plan.
              </span>

              <h2 className="mt-5 text-3xl font-bold tracking-tight text-balance sm:text-5xl">
                Stop scoping. <span className="text-gradient">Start shipping.</span>
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-balance text-muted-foreground sm:text-lg">
                Give PlanForge one sentence. Get a plan your whole team can build
                from — today.
              </p>

              <div className="mt-9 flex justify-center">
                <motion.button
                  type="button"
                  onClick={handlePlan}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative inline-flex items-center gap-2.5 rounded-xl bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-[0_0_40px_-6px_var(--primary)] transition-shadow hover:shadow-[0_0_60px_-4px_var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Plan my project — free
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </motion.button>
              </div>

              <p className="mt-5 text-sm text-muted-foreground">
                First plan in ~2 minutes · No credit card
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
