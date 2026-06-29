'use client'

import { useState } from 'react'
import { FileText, Upload, GitBranch, ArrowRight, RefreshCw, Lock, Eye } from 'lucide-react'
import { Reveal, RevealStagger, RevealItem } from './reveal'
import { MigrationModal } from './migration-modal'

const TILES = [
  { icon: FileText, title: 'Paste a spec / PRD', body: 'A PRD, meeting notes, or a ticket list — the AI edge that turns prose into a plan.' },
  { icon: Upload, title: 'Upload CSV / Jira export', body: 'Drop a Jira or Linear export. We cluster tickets into epics, milestones and sprints.' },
  { icon: GitBranch, title: 'Connect a repo', body: 'Point us at a GitHub repo and we ground scope and estimates in what already exists.' },
]

const REASSURE = [
  { icon: Eye, text: 'See your reconstructed plan before you commit' },
  { icon: RefreshCw, text: 'Keep your old tool in sync while you transition' },
  { icon: Lock, text: 'Export back to CSV / JSON anytime — no lock-in' },
]

export function MigrationSection() {
  const [open, setOpen] = useState(false)

  return (
    <section id="migrate" className="relative px-4 py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <div className="surface-card overflow-hidden p-8 sm:p-12 bg-gradient-to-b from-violet-500/[0.06] to-transparent">
          <Reveal className="max-w-2xl">
            <span className="eyebrow"><RefreshCw className="w-3.5 h-3.5" /> Already mid-project?</span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-balance">
              Bring your existing project into PlanForge in <span className="text-gradient-warm">2 minutes.</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Paste a spec, drop a Jira/Linear CSV, or connect your repo. PlanForge reconstructs your full
              plan and shows it side-by-side with what you already have. Nothing gets lost, nothing gets locked in.
            </p>
          </Reveal>

          <RevealStagger className="mt-8 grid gap-4 sm:grid-cols-3">
            {TILES.map((t) => (
              <RevealItem key={t.title}>
                <button
                  onClick={() => setOpen(true)}
                  className="surface-card surface-card-hover text-left p-5 h-full w-full group"
                >
                  <span className="grid place-items-center w-11 h-11 rounded-xl border border-white/10 bg-white/[0.04]">
                    <t.icon className="w-5 h-5 text-primary" />
                  </span>
                  <h3 className="mt-3 font-semibold text-foreground flex items-center gap-1.5">
                    {t.title}
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{t.body}</p>
                </button>
              </RevealItem>
            ))}
          </RevealStagger>

          <Reveal delay={0.1} className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:shadow-[0_0_24px_-4px_var(--primary)] transition-shadow"
            >
              Reconstruct my project <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex flex-col gap-1.5">
              {REASSURE.map((r) => (
                <span key={r.text} className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <r.icon className="w-3.5 h-3.5 text-primary" /> {r.text}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      <MigrationModal open={open} onClose={() => setOpen(false)} />
    </section>
  )
}
