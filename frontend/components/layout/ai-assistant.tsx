'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Sparkles, X, Send, Loader2, Minus, Bot } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useProjectStore } from '@/lib/project-store'
import { askAssistant } from '@/lib/api'

type Msg = { role: 'user' | 'assistant'; content: string }

const QUICK = [
  'Summarize this plan in 3 bullets',
  'What are the top risks and mitigations?',
  'Is the timeline realistic for the team?',
  'Where is most of the budget going?',
]

// Tiny, safe markdown-ish renderer for assistant replies (bold + bullets + paragraphs).
function Rich({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/)
  const fmt = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={i} className="text-foreground">{part.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{part}</span>
      ),
    )
  return (
    <div className="space-y-2">
      {blocks.map((b, i) => {
        const lines = b.split('\n')
        const isList = lines.every((l) => /^\s*[-*+•]\s+/.test(l) || l.trim() === '')
        if (isList) {
          return (
            <ul key={i} className="space-y-1 list-none">
              {lines.filter((l) => l.trim()).map((l, j) => (
                <li key={j} className="flex gap-1.5">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{fmt(l.replace(/^\s*[-*+•]\s+/, ''))}</span>
                </li>
              ))}
            </ul>
          )
        }
        return <p key={i}>{fmt(b)}</p>
      })}
    </div>
  )
}

export function AiAssistant() {
  const { aiPanelOpen, setAiPanelOpen } = useAppStore()
  const projectId = useProjectStore((s) => s.projectId)
  const project = useProjectStore((s) => s.project)
  const status = useProjectStore((s) => s.status)

  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const ready = !!projectId && (status === 'complete' || !!project?.executive_summary)

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content:
            "Hi — I'm your PlanForge copilot. I can read this project's full plan: requirements, backlog, risks, team, cost and timeline. Ask me anything, or tap a suggestion below.",
        },
      ])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  const send = async (text: string) => {
    const q = text.trim()
    if (!q || busy) return
    if (!projectId) {
      setMessages((m) => [...m, { role: 'user', content: q }, { role: 'assistant', content: 'Open a project first — then I can answer from its plan.' }])
      setInput('')
      return
    }
    const history = messages.filter((m) => m.content)
    setMessages((m) => [...m, { role: 'user', content: q }])
    setInput('')
    setBusy(true)
    try {
      const { reply } = await askAssistant(projectId, q, history)
      setMessages((m) => [...m, { role: 'assistant', content: reply || 'No answer returned.' }])
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: 'I hit an error reaching the model. Is the backend running?' }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {/* Floating launcher */}
      <AnimatePresence>
        {!aiPanelOpen && (
          <motion.button
            onClick={() => setAiPanelOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-primary pl-4 pr-5 py-3 text-primary-foreground font-medium shadow-[0_0_40px_-8px_var(--primary)]"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative flex">
              <Sparkles className="w-5 h-5" />
              <span className="absolute -inset-1 rounded-full bg-white/30 blur-md animate-pulse-glow -z-10" />
            </span>
            Ask the copilot
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat popup */}
      <AnimatePresence>
        {aiPanelOpen && (
          <motion.div
            className="fixed bottom-6 right-6 z-40 flex flex-col w-[min(92vw,400px)] h-[min(76vh,620px)] rounded-2xl border border-white/10 bg-card/80 backdrop-blur-2xl shadow-[0_24px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden"
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          >
            {/* header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-primary/15 to-secondary/10">
              <div className="flex items-center gap-2.5">
                <span className="grid place-items-center w-8 h-8 rounded-lg bg-primary/20 border border-primary/30">
                  <Bot className="w-4.5 h-4.5 text-primary" />
                </span>
                <div>
                  <div className="text-sm font-semibold text-foreground leading-none">PlanForge Copilot</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {ready ? 'Grounded in this project' : 'Waiting for the plan…'}
                  </div>
                </div>
              </div>
              <button onClick={() => setAiPanelOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground" aria-label="Minimize">
                <Minus className="w-4 h-4" />
              </button>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-primary/20 text-foreground border border-primary/30 rounded-br-sm'
                        : 'bg-white/5 text-muted-foreground border border-white/10 rounded-bl-sm'
                    }`}
                  >
                    {m.role === 'assistant' ? <Rich text={m.content} /> : m.content}
                  </div>
                </motion.div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> Thinking…
                  </div>
                </div>
              )}
            </div>

            {/* quick actions */}
            {messages.length <= 1 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                {QUICK.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* input */}
            <div className="p-3 border-t border-white/10">
              <div className="flex items-end gap-2 rounded-xl border border-white/12 bg-background/60 px-3 py-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      send(input)
                    }
                  }}
                  rows={1}
                  placeholder="Ask about this plan…"
                  className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none max-h-24"
                />
                <button
                  onClick={() => send(input)}
                  disabled={busy || !input.trim()}
                  className="grid place-items-center w-8 h-8 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
