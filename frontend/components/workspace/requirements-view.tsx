'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Plus } from 'lucide-react'

const sampleRequirements = [
  {
    id: '1',
    title: 'User Authentication',
    category: 'backend',
    priority: 'high',
    completed: true,
  },
  {
    id: '2',
    title: 'Real-time Collaboration',
    category: 'backend',
    priority: 'high',
    completed: false,
  },
  {
    id: '3',
    title: 'Dashboard UI',
    category: 'frontend',
    priority: 'high',
    completed: false,
  },
  {
    id: '4',
    title: 'API Documentation',
    category: 'integrations',
    priority: 'medium',
    completed: false,
  },
]

export function RequirementsView() {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">Requirements</h2>
        <motion.button
          className="px-4 py-2 bg-primary/20 text-primary rounded-lg border border-primary/50 hover:bg-primary/30 transition-colors flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-5 h-5" />
          Add Requirement
        </motion.button>
      </div>

      {/* Categories */}
      {['Frontend', 'Backend', 'Security', 'Integrations'].map((category) => (
        <motion.div
          key={category}
          className="glass-panel p-6 rounded-xl"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">{category}</h3>
          <div className="space-y-3">
            {sampleRequirements
              .filter((req) => req.category.toLowerCase() === category.toLowerCase())
              .map((req, idx) => (
                <motion.div
                  key={req.id}
                  className="p-4 bg-card/50 border border-white/10 rounded-lg hover:border-primary/50 transition-all cursor-pointer"
                  whileHover={{ x: 4 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="flex items-center gap-3">
                    {req.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${req.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {req.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Priority: {req.priority.charAt(0).toUpperCase() + req.priority.slice(1)}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${
                      req.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {req.priority}
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
