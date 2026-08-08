'use client'

import { useState } from 'react'
import { FileText, Upload, GitBranch, ArrowRight, RefreshCw, Lock, Eye } from 'lucide-react'
import { Reveal, RevealStagger, RevealItem } from './reveal'
import { MigrationModal } from './migration-modal'

const TILES = [
  { icon: FileText, title: 'Paste a Spec / PRD', body: 'Paste existing PRD text, tickets, or meeting notes to convert prose into structured specs.' },
  { icon: Upload, title: 'Import Jira / Linear CSV', body: 'Drop ticket exports. We automatically cluster tasks into epics, milestones, and sprints.' },
  { icon: GitBranch, title: 'Connect a GitHub Repo', body: 'Point us at an existing codebase to ground architecture and scope in existing services.' },
]

const REASSURE = [
  { icon: Eye, text: 'Review full reconstructed plan before committing' },
  { icon: RefreshCw, text: 'Two-way export to your existing issue tracker' },
  { icon: Lock, text: 'Zero vendor lock-in with Markdown & JSON exports' },
]

export function MigrationSection() {
  const [open, setOpen] = useState(false)

  return (
    <section id="migrate" className="relative px-4 py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm">
          <Reveal className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide shadow-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Existing Project Migration
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Migrate existing codebases into Devflow in <span className="text-gradient">2 minutes.</span>
            </h2>
            <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
              Paste an existing PRD, import a CSV export, or link your repository. Devflow reconstructs full architecture diagrams, sprint backlogs, and risk registers.
            </p>
          </Reveal>

          <RevealStagger className="mt-8 grid gap-4 sm:grid-cols-3">
            {TILES.map((t) => (
              <RevealItem key={t.title}>
                <button
                  onClick={() => setOpen(true)}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left h-full w-full hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <span className="grid place-items-center w-10 h-10 rounded-xl bg-white border border-slate-200 text-blue-600 shadow-2xs">
                    <t.icon className="w-5 h-5" />
                  </span>
                  <h3 className="mt-3 font-bold text-xs sm:text-sm text-slate-900 flex items-center justify-between">
                    {t.title}
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{t.body}</p>
                </button>
              </RevealItem>
            ))}
          </RevealStagger>

          <Reveal delay={0.1} className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between pt-6 border-t border-slate-100">
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all cursor-pointer"
            >
              Reconstruct Existing Project <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex flex-col gap-1.5">
              {REASSURE.map((r) => (
                <span key={r.text} className="inline-flex items-center gap-2 text-xs text-slate-500">
                  <r.icon className="w-3.5 h-3.5 text-blue-600" /> {r.text}
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
