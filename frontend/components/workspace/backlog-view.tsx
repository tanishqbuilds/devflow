'use client'

import { motion } from 'framer-motion'
import { GripVertical, CheckCircle2, Circle, Clock } from 'lucide-react'

const sampleTasks = [
  { id: '1', title: 'Setup authentication system', sprint: 1, days: 3, confidence: 95, status: 'complete' },
  { id: '2', title: 'Build user dashboard', sprint: 1, days: 5, confidence: 88, status: 'in-progress' },
  { id: '3', title: 'Implement real-time sync', sprint: 2, days: 8, confidence: 75, status: 'todo' },
  { id: '4', title: 'API rate limiting', sprint: 2, days: 2, confidence: 92, status: 'todo' },
  { id: '5', title: 'Database optimization', sprint: 3, days: 4, confidence: 70, status: 'todo' },
]

export function BacklogView() {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">Backlog</h2>
        <div className="text-sm text-muted-foreground">
          {sampleTasks.filter((t) => t.status === 'complete').length}/{sampleTasks.length} complete
        </div>
      </div>

      {/* Sprint grouping */}
      {[1, 2, 3].map((sprint) => (
        <motion.div
          key={sprint}
          className="glass-panel p-6 rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: sprint * 0.1 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Sprint {sprint}</h3>
          <div className="space-y-3">
            {sampleTasks
              .filter((task) => task.sprint === sprint)
              .map((task, idx) => (
                <motion.div
                  key={task.id}
                  className="p-4 bg-card/50 border border-white/10 rounded-lg hover:border-primary/50 transition-all group cursor-grab"
                  whileHover={{ x: 4 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                    </div>
                    {task.status === 'complete' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : task.status === 'in-progress' ? (
                      <motion.div
                        className="w-5 h-5 border-2 border-cyan-500 rounded-full mt-0.5 flex items-center justify-center"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <div className="w-2 h-2 bg-cyan-500 rounded-full" />
                      </motion.div>
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{task.title}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {task.days}d
                        </div>
                        <div className="text-xs">
                          <span className="text-muted-foreground">Confidence: </span>
                          <span className="text-cyan-400 font-semibold">{task.confidence}%</span>
                        </div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${
                      task.status === 'complete' ? 'bg-green-500/20 text-green-400' :
                      task.status === 'in-progress' ? 'bg-cyan-500/20 text-cyan-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {task.status.replace('-', ' ')}
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
