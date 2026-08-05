'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { Reveal, RevealStagger, RevealItem } from './reveal'

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Is an AI-made plan actually accurate?',
    a: 'Every plan shows its assumptions and is fully editable — treat it as a senior first draft you refine, not gospel. The agents work in sequence so each builds on a reviewed foundation.',
  },
  {
    q: 'Can I edit everything?',
    a: 'Yes. Requirements, backlog, estimates, team, risks — all editable. You own the plan.',
  },
  {
    q: 'Does it export to my tools?',
    a: 'Export to Linear, Jira, Notion and Markdown. We feed the tools you already use.',
  },
  {
    q: 'What about my data and IP?',
    a: "Your inputs are yours. We don't train on your data, and you can export and delete anytime.",
  },
  {
    q: 'How is it free?',
    a: 'Devflow runs on fast, efficient open models (Groq), so the free tier is genuinely free — no trial trap.',
  },
  {
    q: "What if I'm already mid-project?",
    a: 'Use migration: paste a spec or drop a Jira/Linear export and we reconstruct your full plan in minutes.',
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="relative px-4 py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <Reveal direction="up" className="flex flex-col items-center text-center">
          <span className="eyebrow">
            <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Questions
          </span>
          <h2 className="mt-5 text-3xl sm:text-5xl font-bold tracking-tight text-balance">
            Everything you&rsquo;re about to <span className="text-gradient">ask.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground text-balance">
            No fine print, no surprises. Here&rsquo;s what teams want to know before they
            forge their first plan.
          </p>
        </Reveal>

        <RevealStagger className="mt-12 sm:mt-16 grid gap-4">
          {FAQS.map((item, index) => {
            const isOpen = openIndex === index
            const panelId = `faq-panel-${index}`
            const buttonId = `faq-button-${index}`

            return (
              <RevealItem key={item.q} className="surface-card surface-card-hover overflow-hidden">
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6 sm:py-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl"
                  >
                    <span className="text-base sm:text-lg font-semibold text-foreground">
                      {item.q}
                    </span>
                    <motion.span
                      aria-hidden="true"
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors ${
                        isOpen ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.span>
                  </button>
                </h3>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm sm:text-base leading-relaxed text-muted-foreground">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </RevealItem>
            )
          })}
        </RevealStagger>
      </div>
    </section>
  )
}
