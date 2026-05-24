'use client'

import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'

export function OverviewView() {
  const { projectTitle, projectDescription } = useAppStore()

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        className="glass-panel p-8 rounded-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-bold mb-2 text-foreground">{projectTitle}</h1>
        <p className="text-muted-foreground text-lg">
          {projectDescription || 'Your AI-powered project execution platform'}
        </p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {[
          { label: 'Requirements', value: '0', color: 'from-blue-500 to-cyan-500' },
          { label: 'Tasks', value: '0', color: 'from-purple-500 to-pink-500' },
          { label: 'Risks', value: '0', color: 'from-orange-500 to-red-500' },
          { label: 'Team Members', value: '0', color: 'from-green-500 to-emerald-500' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            className="glass-panel p-6 rounded-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
          >
            <p className="text-muted-foreground text-sm mb-2">{stat.label}</p>
            <p className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
              {stat.value}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Orchestration Status */}
      <motion.div
        className="glass-panel p-8 rounded-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Orchestration Status</h2>
          <div className="w-3 h-3 bg-primary rounded-full animate-pulse-glow" />
        </div>
        <p className="text-muted-foreground mb-6">
          The orchestration engine is ready to process your project. Navigate through the workspace modules to define requirements, plan architecture, and execute your vision.
        </p>
        <div className="space-y-3">
          {['Idea Intake', 'Requirements Analysis', 'Architecture Planning', 'Task Generation'].map(
            (step, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-card/50 rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span className="text-foreground text-sm">{step}</span>
              </div>
            ),
          )}
        </div>
      </motion.div>
    </div>
  )
}
