'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Wand2 } from 'lucide-react'
import { analyzeProject } from '@/lib/api'
import { Reveal } from './reveal'

const EXAMPLES = [
  'AI-powered recruitment platform that screens candidates for startups',
  'Real-time collaborative whiteboard for remote design teams',
  'Subscription analytics dashboard for SaaS founders',
  'Marketplace connecting local farmers with restaurants',
]

export function InputSection() {
  const [input, setInput] = useState('')
  const [placeholder, setPlaceholder] = useState('')
  const [exampleIdx, setExampleIdx] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Rotating typewriter placeholder
  useEffect(() => {
    if (input) return
    const phrase = EXAMPLES[exampleIdx]
    let i = 0
    setPlaceholder('')
    const type = setInterval(() => {
      if (i < phrase.length) {
        setPlaceholder((p) => p + phrase[i])
        i++
      } else {
        clearInterval(type)
      }
    }, 28)
    const next = setTimeout(() => setExampleIdx((e) => (e + 1) % EXAMPLES.length), 5200)
    return () => {
      clearInterval(type)
      clearTimeout(next)
    }
  }, [exampleIdx, input])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const idea = input.trim()
    if (idea.length < 8 || submitting) {
      if (idea.length < 8) setError('Add a little more detail (at least 8 characters).')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const { project_id } = await analyzeProject(idea)
      router.push(`/workspace?project=${project_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start. Is the backend running?')
      setSubmitting(false)
    }
  }

  return (
    <section id="plan" className="relative px-4 py-16 sm:py-20 scroll-mt-24">
      <div className="max-w-3xl mx-auto">
        <Reveal className="text-center">
          <span className="eyebrow"><Wand2 className="w-3.5 h-3.5" /> Try it now — free</span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
            Type an idea. Watch a plan <span className="text-gradient">build itself.</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            One sentence or a messy brief — both work. The AI org takes it from there.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-8">
          <form onSubmit={handleSubmit} className="relative group">
            <motion.div
              className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-cyan-500/40 via-violet-500/40 to-cyan-500/40 opacity-40 blur-lg group-focus-within:opacity-80 transition-opacity"
              animate={{ opacity: [0.25, 0.5, 0.25] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <div className="relative rounded-2xl border border-white/12 bg-card/70 backdrop-blur-xl p-2">
              <textarea
                id="idea-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
                }}
                placeholder={input ? '' : placeholder || 'Describe what you want to build…'}
                rows={3}
                className="w-full resize-none bg-transparent px-4 pt-3 pb-12 text-base sm:text-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              />
              <div className="absolute bottom-3 left-4 right-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground/70 hidden sm:block">
                  Press <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">⌘</kbd>
                  <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">↵</kbd> to plan
                </span>
                <motion.button
                  type="submit"
                  disabled={submitting}
                  className="ml-auto inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60 hover:shadow-[0_0_24px_-4px_var(--primary)] transition-shadow"
                  whileHover={{ scale: submitting ? 1 : 1.04 }}
                  whileTap={{ scale: submitting ? 1 : 0.97 }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Assembling the org…
                    </>
                  ) : (
                    <>
                      Plan my project <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </form>
          {error && (
            <p className="mt-3 text-sm text-red-400 text-center" role="alert">
              {error}
            </p>
          )}
        </Reveal>

        <Reveal delay={0.2} className="mt-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground">Try:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => {
                  setInput(ex)
                  setError(null)
                }}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
              >
                {ex.length > 38 ? ex.slice(0, 38) + '…' : ex}
              </button>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
