'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Wand2 } from 'lucide-react'
import { analyzeProject } from '@/lib/api'
import { Reveal } from './reveal'
import { useAppUser, useAppAuth } from '@/lib/auth-context'
import { useAppStore } from '@/lib/store'

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
  const { isLoaded, isSignedIn, user, isClerk } = useAppUser()
  const { signIn } = useAppAuth()

  useEffect(() => {
    if (input) return
    const phrase = EXAMPLES[exampleIdx]
    let i = 0
    setPlaceholder('')
    const timer = setInterval(() => {
      if (i <= phrase.length) {
        setPlaceholder(phrase.slice(0, i))
        i++
      } else {
        clearInterval(timer)
        setTimeout(() => setExampleIdx((e) => (e + 1) % EXAMPLES.length), 2200)
      }
    }, 28)
    return () => clearInterval(timer)
  }, [exampleIdx, input])

  if (isClerk && user?.role === 'developer') {
    return (
      <section id="plan" className="relative px-4 py-16 sm:py-20 flex justify-center scroll-mt-24">
        <div className="bg-white border border-slate-200 p-8 text-center max-w-md rounded-2xl shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Welcome back!</h2>
          <p className="text-slate-500 mt-2 text-sm">Head over to your workspace to view your assigned tasks across all projects.</p>
          <button
            onClick={() => router.push('/my-tasks')}
            className="mt-6 bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
          >
            Go to My Tasks
          </button>
        </div>
      </section>
    )
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const idea = input.trim()
    if (idea.length < 8 || submitting) {
      if (idea.length < 8) setError('Add a little more detail (at least 8 characters).')
      return
    }
    if (!isLoaded) return
    if (!isSignedIn) {
      signIn()
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const { project_id } = await analyzeProject(idea)
      useAppStore.getState().setActiveWorkspaceMode('track-live')
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide shadow-xs">
            <Wand2 className="w-3.5 h-3.5" /> Try it now — free
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Type an idea. Watch a plan <span className="text-gradient">build itself.</span>
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            One sentence or a brief description — the AI multi-agent organization compiles the entire architecture and roadmap.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-8">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative rounded-2xl border border-slate-300 bg-white shadow-lg p-2.5">
              <textarea
                id="idea-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
                }}
                placeholder={input ? '' : placeholder || 'Describe what you want to build…'}
                rows={3}
                className="w-full resize-none bg-transparent px-3 pt-2 pb-12 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <div className="absolute bottom-3 left-4 right-3 flex items-center justify-between">
                <span className="text-xs text-slate-400 hidden sm:block">
                  Press <kbd className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-mono text-slate-600">⌘</kbd>{' '}
                  <kbd className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-mono text-slate-600">↵</kbd> to plan
                </span>
                <button
                  type="submit"
                  disabled={submitting}
                  className="ml-auto inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white disabled:opacity-60 shadow-md transition-all cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Orchestrating Agents…
                    </>
                  ) : (
                    <>
                      Plan My Project <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
          {error && (
            <p className="mt-3 text-xs font-medium text-rose-600 text-center" role="alert">
              {error}
            </p>
          )}
        </Reveal>

        <Reveal delay={0.2} className="mt-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Quick Prompts:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => {
                  setInput(ex)
                  setError(null)
                }}
                className="rounded-full border border-slate-200 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 hover:border-blue-200 px-3 py-1 text-xs font-medium transition-colors shadow-2xs cursor-pointer"
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
