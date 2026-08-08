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
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Integrations & DevOps CI/CD</h2>
        <GeneratingPanel label="Integrations & DevOps Blueprints" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Integrations & DevOps Blueprints</h2>
        <p className="text-slate-500 text-sm mt-0.5">
          Third-party integrations, container orchestration, and CI/CD pipelines defined by the Platform Integration Agent
        </p>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(data.integrations || []).map((integ, idx) => {
          const Icon = categoryIcon[integ.category] || Plug
          return (
            <div key={idx} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{integ.name}</h3>
                  <span className="text-[10px] uppercase font-bold text-slate-400">{integ.category}</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">{integ.purpose}</p>
              
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Integration Steps</span>
                {(integ.steps || []).map((s, i) => (
                  <div key={i} className="text-xs text-slate-700 flex gap-2 items-start">
                    <span className="text-blue-600 font-bold font-mono text-[11px]">{i + 1}.</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Deployment Plan & CI/CD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Rocket className="w-4 h-4 text-emerald-600" /> Deployment Plan & Rollout
          </h3>
          <ol className="space-y-2">
            {(data.deployment_plan || []).map((s, i) => (
              <li key={i} className="text-xs text-slate-700 flex gap-2 items-start">
                <span className="text-emerald-600 font-bold font-mono text-[11px]">{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-purple-600" /> CI/CD Automation Recommendations
          </h3>
          <ul className="space-y-2">
            {(data.cicd_recommendations || []).map((s, i) => (
              <li key={i} className="text-xs text-slate-700 flex gap-2 items-start">
                <span className="text-purple-600 font-bold">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
