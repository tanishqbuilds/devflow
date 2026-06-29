'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, TrendingDown } from 'lucide-react'
import { useProjectStore } from '@/lib/project-store'
import { GeneratingPanel } from './overview-view'

const severityBorder: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
}
const severityText: Record<string, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-green-400',
}

export function RiskView() {
  const project = useProjectStore((s) => s.project)
  const riskData = project?.risks || null
  const risks = riskData?.risks || []

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Risk Assessment</h2>
        <p className="text-muted-foreground">
          {riskData ? `Overall risk level: ${riskData.overall_risk_level}` : 'Identify and mitigate project risks early'}
        </p>
      </div>

      {!riskData ? (
        <GeneratingPanel label="Risk analysis" />
      ) : (
        <>
          {riskData.summary && (
            <div className="glass-panel p-6 rounded-xl text-sm text-foreground/90 leading-relaxed">{riskData.summary}</div>
          )}

          <motion.div className="glass-panel p-8 rounded-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <h3 className="text-lg font-semibold text-foreground mb-6">Risk Matrix</h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Low', color: 'bg-green-500/20' },
                { label: 'Medium', color: 'bg-yellow-500/20' },
                { label: 'High', color: 'bg-orange-500/20' },
                { label: 'Critical', color: 'bg-red-500/20' },
              ].map((item, idx) => (
                <motion.div key={item.label} className={`p-4 rounded-lg ${item.color} border border-white/10 text-center`}
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + idx * 0.05 }}>
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-2xl font-bold mt-2">{risks.filter((r) => r.severity === item.label.toLowerCase()).length}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="space-y-3">
            {risks.map((risk, idx) => (
              <motion.div key={idx} className="glass-panel p-6 rounded-lg border-l-4" style={{ borderLeftColor: severityBorder[risk.severity] || '#eab308' }}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}>
                <div className="flex items-start gap-4">
                  <AlertTriangle className={`w-6 h-6 flex-shrink-0 mt-1 ${severityText[risk.severity] || 'text-yellow-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-foreground">{risk.title}</h4>
                      <span className="text-[10px] uppercase tracking-wide bg-white/5 text-muted-foreground px-2 py-0.5 rounded">{risk.category}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{risk.description}</p>
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <Bar label="Probability" value={risk.probability} />
                      <Bar label="Impact" value={risk.impact} />
                      <div>
                        <p className="text-xs text-muted-foreground">Severity</p>
                        <p className={`text-sm font-semibold capitalize mt-1 ${severityText[risk.severity]}`}>{risk.severity}</p>
                      </div>
                    </div>
                    <div className="p-3 bg-card/50 rounded border border-white/5">
                      <p className="text-xs text-muted-foreground flex items-center gap-2 mb-1">
                        <TrendingDown className="w-4 h-4" /> Mitigation Strategy
                      </p>
                      <p className="text-sm text-foreground">{risk.mitigation}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  )
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 mt-1">
        <div className="flex-1 h-2 bg-card rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-yellow-500 to-red-500" initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8 }} />
        </div>
        <span className="text-sm font-semibold">{value}%</span>
      </div>
    </div>
  )
}
