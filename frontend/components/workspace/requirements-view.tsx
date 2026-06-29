'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, BookOpen } from 'lucide-react'
import { useProjectStore } from '@/lib/project-store'
import { GeneratingPanel } from './overview-view'
import type { RequirementItem } from '@/lib/project-types'

const priorityClass: Record<string, string> = {
  high: 'bg-red-500/20 text-red-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-green-500/20 text-green-400',
}

function RequirementRow({ req, idx }: { req: RequirementItem; idx: number }) {
  return (
    <motion.div
      className="p-4 bg-card/50 border border-white/10 rounded-lg hover:border-primary/50 transition-all"
      whileHover={{ x: 4 }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.04 }}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{req.title}</p>
          {req.description && <p className="text-xs text-muted-foreground mt-1">{req.description}</p>}
          <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] uppercase tracking-wide bg-white/5 text-muted-foreground">
            {req.category}
          </span>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-semibold ${priorityClass[req.priority] || priorityClass.medium}`}>
          {req.priority}
        </div>
      </div>
    </motion.div>
  )
}

export function RequirementsView() {
  const project = useProjectStore((s) => s.project)
  const reqs = project?.requirements || null

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <div>
        <h2 className="text-3xl font-bold text-foreground">Requirements</h2>
        <p className="text-muted-foreground mt-1">Functional & non-functional requirements with user stories</p>
      </div>

      {!reqs ? (
        <GeneratingPanel label="Requirements" />
      ) : (
        <>
          <div className="glass-panel p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-foreground mb-4">Functional Requirements</h3>
            <div className="space-y-3">
              {reqs.functional_requirements.map((req, idx) => (
                <RequirementRow key={`f-${idx}`} req={req} idx={idx} />
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-foreground mb-4">Non-Functional Requirements</h3>
            <div className="space-y-3">
              {reqs.non_functional_requirements.map((req, idx) => (
                <RequirementRow key={`n-${idx}`} req={req} idx={idx} />
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> User Stories
            </h3>
            <div className="space-y-4">
              {reqs.user_stories.map((story, idx) => (
                <motion.div key={idx} className="p-4 bg-card/50 border border-white/10 rounded-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.04 }}>
                  <p className="text-sm text-foreground">
                    <span className="text-cyan-400">As a</span> {story.as_a},{' '}
                    <span className="text-cyan-400">I want</span> {story.i_want},{' '}
                    <span className="text-cyan-400">so that</span> {story.so_that}.
                  </p>
                  {story.acceptance_criteria?.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {story.acceptance_criteria.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel p-6 rounded-xl">
              <h3 className="text-sm font-semibold text-emerald-400 mb-3 uppercase tracking-wide">In Scope</h3>
              <ul className="space-y-2">
                {reqs.scope_in.map((s, i) => (
                  <li key={i} className="text-sm text-foreground/90 flex gap-2"><span className="text-emerald-400">+</span>{s}</li>
                ))}
              </ul>
            </div>
            <div className="glass-panel p-6 rounded-xl">
              <h3 className="text-sm font-semibold text-red-400 mb-3 uppercase tracking-wide">Out of Scope</h3>
              <ul className="space-y-2">
                {reqs.scope_out.map((s, i) => (
                  <li key={i} className="text-sm text-foreground/90 flex gap-2"><span className="text-red-400">−</span>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}
