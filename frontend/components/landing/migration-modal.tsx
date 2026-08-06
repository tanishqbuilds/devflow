'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { X, FileText, Upload, GitBranch, ArrowRight, Loader2, ShieldCheck } from 'lucide-react'
import { migrateProject, type MigrationSource } from '@/lib/api'
import { useAppAuth, useAppUser } from '@/lib/auth-context'

const TABS: { id: MigrationSource; label: string; icon: any }[] = [
  { id: 'spec', label: 'Paste spec / tickets', icon: FileText },
  { id: 'file', label: 'Upload file', icon: Upload },
  { id: 'repo', label: 'Connect repo', icon: GitBranch },
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
      router.push(`/workspace?project=${project_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed. Is the backend running?')
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="migration-dialog-title"
            className="relative w-full max-w-xl surface-card p-6 shadow-2xl"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          >
            <button aria-label="Close migration dialog" onClick={onClose} className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground">
              <X className="w-5 h-5" />
            </button>

            <h3 id="migration-dialog-title" className="text-xl font-bold">Bring your existing project into Devflow</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              We reconstruct your full plan — milestones, backlog, risks and cost — from what you already have.
            </p>

            {/* tabs */}
            <div className="mt-5 grid grid-cols-3 gap-2">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                    tab === t.id
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-4">
              {tab === 'spec' && (
                <textarea
                  value={spec}
                  onChange={(e) => setSpec(e.target.value)}
                  rows={6}
                  placeholder="Paste a PRD, a spec, meeting notes, or a list of existing tickets / epics…"
                  className="w-full resize-none rounded-xl border border-white/12 bg-background/60 px-4 py-3 text-sm focus:outline-none focus:border-primary/50"
                />
              )}
              {tab === 'file' && (
                <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 cursor-pointer hover:border-primary/40">
                  <Upload className="w-6 h-6 text-primary" />
                  <span className="text-sm text-foreground">{fileName ?? 'Click to upload a CSV, .md, .txt or export'}</span>
                  <span className="text-xs text-muted-foreground">{fileName ? `${spec.length} chars loaded` : 'Jira/Linear CSV, PRD, README…'}</span>
                  <input type="file" accept=".csv,.md,.txt,.json,.tsv,text/*" className="hidden" onChange={onFile} />
                </label>
              )}
              {tab === 'repo' && (
                <div className="space-y-3">
                  <input
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    placeholder="https://github.com/your-org/your-repo"
                    className="w-full rounded-xl border border-white/12 bg-background/60 px-4 py-3 text-sm focus:outline-none focus:border-primary/50"
                  />
                  <textarea
                    value={spec}
                    onChange={(e) => setSpec(e.target.value)}
                    rows={3}
                    placeholder="Optional: paste the README or a short description of the project…"
                    className="w-full resize-none rounded-xl border border-white/12 bg-background/60 px-4 py-3 text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
              )}
            </div>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            <button
              onClick={submit}
              disabled={submitting}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 hover:shadow-[0_0_24px_-4px_var(--primary)] transition-shadow"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Reconstructing your plan…</>
              ) : (
                <>Reconstruct my plan <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              See the plan before you commit · Export back to CSV/JSON anytime · No lock-in
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
