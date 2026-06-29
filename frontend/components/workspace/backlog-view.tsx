'use client'

import { motion } from 'framer-motion'
import { Clock, Layers, Flag } from 'lucide-react'
import { useProjectStore } from '@/lib/project-store'
import { GeneratingPanel } from './overview-view'

const priorityClass: Record<string, string> = {
  high: 'bg-red-500/20 text-red-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-green-500/20 text-green-400',
}

export function BacklogView() {
  const project = useProjectStore((s) => s.project)
  const backlog = project?.backlog || null

  if (!backlog) {
    return (
      <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-foreground">Backlog & Sprint Plan</h2>
        <GeneratingPanel label="Backlog" />
      </motion.div>
    )
  }

  const sprints = [...(backlog.sprints || [])].sort((a, b) => a.number - b.number)
  const tasks = backlog.tasks || []
  const totalDays = tasks.reduce((s, t) => s + (t.estimated_days || 0), 0)

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Backlog & Sprint Plan</h2>
          <p className="text-muted-foreground mt-1">
            {backlog.methodology} · {sprints.length} sprints · {tasks.length} tasks · ~{Math.round(totalDays)} dev-days
          </p>
        </div>
      </div>

      {backlog.epics?.length > 0 && (
        <div className="glass-panel p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" /> Epics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {backlog.epics.map((epic, idx) => (
              <div key={idx} className="p-4 bg-card/50 border border-white/10 rounded-lg">
                <p className="font-medium text-foreground">{epic.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{epic.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {sprints.map((sprint) => {
        const sprintTasks = tasks.filter((t) => t.sprint === sprint.number)
        return (
          <motion.div key={sprint.number} className="glass-panel p-6 rounded-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Flag className="w-4 h-4 text-cyan-400" /> Sprint {sprint.number}: {sprint.name}
              </h3>
              <span className="text-xs text-muted-foreground">{sprintTasks.length} tasks</span>
            </div>
            {sprint.goal && <p className="text-sm text-muted-foreground mb-4">{sprint.goal}</p>}
            <div className="space-y-3">
              {sprintTasks.map((task, idx) => (
                <motion.div key={idx} className="p-4 bg-card/50 border border-white/10 rounded-lg hover:border-primary/50 transition-all"
                  whileHover={{ x: 4 }} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" /> {task.estimated_days}d
                        </span>
                        {task.category && <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-white/5 px-2 py-0.5 rounded">{task.category}</span>}
                        {task.epic && <span className="text-[10px] text-cyan-400/80">{task.epic}</span>}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${priorityClass[task.priority] || priorityClass.medium}`}>
                      {task.priority}
                    </div>
                  </div>
                </motion.div>
              ))}
              {sprintTasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks assigned to this sprint.</p>}
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
