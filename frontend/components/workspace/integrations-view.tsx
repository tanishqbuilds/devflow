'use client'

import { motion } from 'framer-motion'
import { Github, Calendar, Rocket, CreditCard, MessageSquare, BarChart3, Plug, GitBranch } from 'lucide-react'
import { useProjectStore } from '@/lib/project-store'
import { GeneratingPanel } from './overview-view'

const categoryIcon: Record<string, any> = {
  github: Github,
  calendar: Calendar,
  deployment: Rocket,
  payments: CreditCard,
  communication: MessageSquare,
  analytics: BarChart3,
  other: Plug,
}

export function IntegrationsView() {
  const project = useProjectStore((s) => s.project)
  const data = project?.integrations || null

  if (!data) {
    return (
      <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-3xl font-bold text-foreground">Integrations & Deployment</h2>
        <GeneratingPanel label="Integration plan" />
      </motion.div>
    )
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <div>
        <h2 className="text-3xl font-bold text-foreground">Integrations & Deployment</h2>
        <p className="text-muted-foreground mt-1">Third-party integrations, deployment plan and CI/CD</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(data.integrations || []).map((integ, idx) => {
          const Icon = categoryIcon[integ.category] || Plug
          return (
            <motion.div key={idx} className="glass-panel p-6 rounded-xl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">{integ.name}</h3>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{integ.category}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{integ.purpose}</p>
              <ol className="space-y-1.5">
                {(integ.steps || []).map((s, i) => (
                  <li key={i} className="text-xs text-foreground/90 flex gap-2">
                    <span className="text-cyan-400 font-mono">{i + 1}.</span>
                    {s}
                  </li>
                ))}
              </ol>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2"><Rocket className="w-5 h-5 text-emerald-400" /> Deployment Plan</h3>
          <ol className="space-y-2">
            {(data.deployment_plan || []).map((s, i) => (
              <li key={i} className="text-sm text-foreground/90 flex gap-2"><span className="text-emerald-400 font-mono">{i + 1}.</span>{s}</li>
            ))}
          </ol>
        </div>
        <div className="glass-panel p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2"><GitBranch className="w-5 h-5 text-purple-400" /> CI/CD Recommendations</h3>
          <ul className="space-y-2">
            {(data.cicd_recommendations || []).map((s, i) => (
              <li key={i} className="text-sm text-foreground/90 flex gap-2"><span className="text-purple-400">•</span>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  )
}
