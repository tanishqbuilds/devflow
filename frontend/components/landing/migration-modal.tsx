'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { X, FileText, Upload, GitBranch, ArrowRight, Loader2 } from 'lucide-react'
import { migrateProject, type MigrationSource } from '@/lib/api'
import { useAppAuth, useAppUser } from '@/lib/auth-context'

const TABS: { id: MigrationSource; label: string; icon: any }[] = [
  { id: 'spec', label: 'Paste Spec / Tickets', icon: FileText },
  { id: 'file', label: 'Upload CSV', icon: Upload },
  { id: 'repo', label: 'Connect Repo', icon: GitBranch },
]

export function MigrationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<MigrationSource>('spec')
  const [spec, setSpec] = useState('')
  const [repo, setRepo] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAppUser()
  const { signIn } = useAppAuth()

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open, onClose])

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const text = await f.text()
    setFileName(f.name)
    setSpec(text.slice(0, 16000))
    setError(null)
  }

  const submit = async () => {
    if (!isLoaded) return
    if (!isSignedIn) {
      signIn()
      return
    }
    let content = spec.trim()
    if (tab === 'repo') {
      content = `Existing repository to reconstruct a plan from: ${repo.trim()}\n\n${content}`.trim()
    }
    if (content.length < 12) {
      setError('Add a bit more detail about the existing project.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const { project_id } = await migrateProject({ source: tab, content })
      onClose()
      router.push(`/workspace?project=${project_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed.')
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative z-10 w-full max-w-xl rounded-2xl bg-white border border-slate-200 p-6 sm:p-7 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Reconstruct Existing Project</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Import PRD specs, tickets, or repos to build a structured delivery plan.
                </p>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-5 grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              {TABS.map((t) => {
                const Icon = t.icon
                const active = tab === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTab(t.id)
                      setError(null)
                    }}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      active ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Inputs */}
            <div className="mt-4 space-y-3">
              {tab === 'repo' && (
                <input
                  type="text"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="https://github.com/org/repo"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              {tab === 'file' && (
                <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-blue-400 cursor-pointer">
                  <Upload className="w-6 h-6 text-blue-600 mb-2" />
                  <span className="text-xs font-semibold text-slate-900">
                    {fileName || 'Drop CSV, Markdown, or JSON export here'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">Up to 2 MB</span>
                  <input type="file" accept=".csv,.json,.md,.txt" onChange={onFile} className="hidden" />
                </label>
              )}

              {(tab === 'spec' || tab === 'repo' || fileName) && (
                <textarea
                  value={spec}
                  onChange={(e) => setSpec(e.target.value)}
                  rows={6}
                  placeholder="Paste existing PRD, user stories, or architecture notes here…"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              {error && (
                <p className="text-xs font-medium text-rose-600" role="alert">
                  {error}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Reconstructing…
                  </>
                ) : (
                  <>
                    Reconstruct Plan <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
