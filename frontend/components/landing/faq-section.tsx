'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { Reveal, RevealStagger, RevealItem } from './reveal'

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How accurate is an autonomous AI-generated delivery plan?',
    a: 'Every plan explicitly displays its architectural assumptions, story point benchmarks, and rate cards. The 8 agents cross-validate each other sequentially so that architecture informs the backlog, and the backlog directly derives the timeline and budget.',
  },
  {
    q: 'Can I iterate and refine the plan as requirements evolve?',
    a: 'Yes. With persistent PostgreSQL and Redis project memory, agents retain historical database context and seamlessly update specifications without losing previous decisions.',
  },
  {
    q: 'Can I export the delivery plan to Jira, Linear, or Markdown?',
    a: 'Yes. Devflow natively exports user stories, epics, and acceptance criteria to Linear, Jira, Notion, and structured Markdown.',
  },
  {
    q: 'How is data privacy and intellectual property protected?',
    a: 'Your inputs and architecture designs are private and never used for foundation model training. All database records are scoped per user workspace.',
  },
  {
    q: 'Which LLM models power Devflow?',
    a: 'Devflow is natively configured with Groq LLaMA 3.3 70B Versatile for high-speed deterministic structured generation and LangGraph orchestration.',
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="relative px-4 py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-4xl mx-auto">
        <Reveal direction="up" className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide shadow-xs">
            <HelpCircle className="h-3.5 w-3.5" /> Frequently Asked Questions
          </span>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Frequently asked questions.
          </h2>
        </Reveal>

        <RevealStagger className="mt-12 grid gap-3">
          {FAQS.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <RevealItem key={item.q} className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5 cursor-pointer"
                >
                  <span className="text-sm sm:text-base font-bold text-slate-900">
                    {item.q}
                  </span>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 transition-transform ${
                      isOpen ? 'rotate-180 text-blue-600 bg-blue-50' : 'text-slate-500'
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm leading-relaxed text-slate-600 border-t border-slate-100 pt-3">
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
