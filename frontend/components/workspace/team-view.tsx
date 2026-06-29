'use client'

import { motion } from 'framer-motion'
import { Users, Briefcase, Zap, ShieldCheck } from 'lucide-react'
import { useProjectStore } from '@/lib/project-store'
import { GeneratingPanel } from './overview-view'

export function TeamView() {
  const project = useProjectStore((s) => s.project)
  const team = project?.team || null

  if (!team) {
    return (
      <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-foreground">Team Planning</h2>
        <GeneratingPanel label="Team plan" />
      </motion.div>
    )
  }

  const members = team.members || []
  const totalMembers = members.reduce((sum, r) => sum + (r.count || 1), 0)
  const avgAllocation = members.length
    ? Math.round(members.reduce((sum, r) => sum + (r.allocation_pct || 0), 0) / members.length)
    : 0

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Team Planning</h2>
        <p className="text-muted-foreground">Resource allocation and team composition</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Team Size', value: totalMembers, icon: Users },
          { label: 'Avg Allocation', value: `${avgAllocation}%`, icon: Zap },
          { label: 'Roles', value: members.length, icon: Briefcase },
        ].map((item, idx) => (
          <motion.div key={item.label} className="glass-panel p-6 rounded-xl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
            <div className="flex items-center gap-3 mb-2">
              <item.icon className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{item.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="space-y-4">
        {members.map((role, idx) => (
          <motion.div key={idx} className="glass-panel p-6 rounded-lg" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {role.role} <span className="text-sm text-muted-foreground">· {role.seniority}</span>
                </h3>
                {role.responsibilities?.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">{role.responsibilities.join(' · ')}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{role.count}</p>
                <p className="text-xs text-muted-foreground">{role.count === 1 ? 'person' : 'people'}</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Allocation</p>
                <span className="text-sm font-semibold text-foreground">{role.allocation_pct}%</span>
              </div>
              <div className="h-2 bg-card rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${role.allocation_pct > 85 ? 'bg-red-500' : role.allocation_pct > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  initial={{ width: 0 }} animate={{ width: `${role.allocation_pct}%` }} transition={{ duration: 0.8 }} />
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Key Skills</p>
              <div className="flex flex-wrap gap-2">
                {(role.skills || []).map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">{skill}</span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {team.ownership?.length > 0 && (
        <div className="glass-panel p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" /> Ownership
          </h3>
          <ul className="space-y-2">
            {team.ownership.map((o, i) => (
              <li key={i} className="text-sm text-foreground/90 flex gap-2"><span className="text-emerald-400">•</span>{o}</li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}
