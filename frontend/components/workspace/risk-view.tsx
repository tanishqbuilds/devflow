'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, TrendingDown } from 'lucide-react'

const sampleRisks = [
  {
    id: '1',
    title: 'Resource Availability',
    severity: 'high',
    probability: 80,
    mitigation: 'Hire additional contractors early',
  },
  {
    id: '2',
    title: 'Scope Creep',
    severity: 'high',
    probability: 70,
    mitigation: 'Strict requirements management',
  },
  {
    id: '3',
    title: 'Technical Debt',
    severity: 'medium',
    probability: 60,
    mitigation: 'Regular refactoring sprints',
  },
  {
    id: '4',
    title: 'Third-party API Delays',
    severity: 'medium',
    probability: 45,
    mitigation: 'Early integration testing',
  },
]

const severityColors = {
  critical: 'bg-red-600',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
}

export function RiskView() {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Risk Assessment</h2>
        <p className="text-muted-foreground">Identify and mitigate project risks early</p>
      </div>

      {/* Risk heatmap grid */}
      <motion.div
        className="glass-panel p-8 rounded-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-lg font-semibold text-foreground mb-6">Risk Matrix</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Low', color: 'bg-green-500/20' },
            { label: 'Medium', color: 'bg-yellow-500/20' },
            { label: 'High', color: 'bg-orange-500/20' },
            { label: 'Critical', color: 'bg-red-500/20' },
          ].map((item, idx) => (
            <motion.div
              key={item.label}
              className={`p-4 rounded-lg ${item.color} border border-white/10 text-center`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
            >
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="text-2xl font-bold mt-2">
                {sampleRisks.filter((r) => r.severity === item.label.toLowerCase()).length}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Risk details */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {sampleRisks.map((risk, idx) => (
          <motion.div
            key={risk.id}
            className="glass-panel p-6 rounded-lg border-l-4"
            style={{
              borderLeftColor: risk.severity === 'high' ? '#ff6b6b' : '#ffd93d',
            }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + idx * 0.05 }}
          >
            <div className="flex items-start gap-4">
              <AlertTriangle className={`w-6 h-6 flex-shrink-0 mt-1 ${
                risk.severity === 'high' ? 'text-red-400' : 'text-yellow-400'
              }`} />
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-2">{risk.title}</h4>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Probability</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-card rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-yellow-500 to-red-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${risk.probability}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{risk.probability}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Severity</p>
                    <p className="text-sm font-semibold capitalize mt-1">{risk.severity}</p>
                  </div>
                </div>
                <div className="p-3 bg-card/50 rounded border border-white/5">
                  <p className="text-xs text-muted-foreground flex items-center gap-2 mb-1">
                    <TrendingDown className="w-4 h-4" />
                    Mitigation Strategy
                  </p>
                  <p className="text-sm text-foreground">{risk.mitigation}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
