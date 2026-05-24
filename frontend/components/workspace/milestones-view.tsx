'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Circle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const milestones = [
  {
    id: 1,
    title: 'Project Kickoff',
    description: 'Team alignment and planning',
    date: '2024-01-15',
    status: 'complete',
    completion: 100,
  },
  {
    id: 2,
    title: 'Requirements Review',
    description: 'Stakeholder approval on specs',
    date: '2024-02-01',
    status: 'complete',
    completion: 100,
  },
  {
    id: 3,
    title: 'Design Phase',
    description: 'Architecture and UI/UX design',
    date: '2024-02-20',
    status: 'active',
    completion: 75,
  },
  {
    id: 4,
    title: 'Development Sprint 1',
    description: 'Core feature implementation',
    date: '2024-03-15',
    status: 'pending',
    completion: 0,
  },
  {
    id: 5,
    title: 'Quality Assurance',
    description: 'Testing and bug fixes',
    date: '2024-04-20',
    status: 'pending',
    completion: 0,
  },
  {
    id: 6,
    title: 'Launch',
    description: 'Production deployment',
    date: '2024-05-15',
    status: 'pending',
    completion: 0,
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'complete':
      return 'text-green-400'
    case 'active':
      return 'text-primary'
    case 'pending':
      return 'text-muted-foreground'
    default:
      return 'text-muted-foreground'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'complete':
      return <CheckCircle className="w-5 h-5 text-green-400" />
    case 'active':
      return <AlertCircle className="w-5 h-5 text-primary animate-pulse-glow" />
    case 'pending':
      return <Circle className="w-5 h-5 text-muted-foreground" />
    default:
      return <Circle className="w-5 h-5 text-muted-foreground" />
  }
}

export function MilestonesView() {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Project Milestones</h2>
        <p className="text-muted-foreground mt-1">Timeline and key deliverables tracking</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          className="glass-panel p-4 rounded-lg"
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-sm text-muted-foreground">Total Milestones</p>
          <p className="text-2xl font-bold text-primary mt-2">6</p>
          <p className="text-xs text-muted-foreground mt-1">Tracked</p>
        </motion.div>

        <motion.div
          className="glass-panel p-4 rounded-lg"
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold text-green-400 mt-2">2</p>
          <p className="text-xs text-muted-foreground mt-1">On schedule</p>
        </motion.div>

        <motion.div
          className="glass-panel p-4 rounded-lg"
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-sm text-muted-foreground">Overall Progress</p>
          <p className="text-2xl font-bold text-accent mt-2">33%</p>
          <p className="text-xs text-muted-foreground mt-1">Of project</p>
        </motion.div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {milestones.map((milestone, index) => (
          <motion.div
            key={milestone.id}
            className="glass-panel p-4 rounded-lg border-l-4 border-primary/30"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.01, borderLeftColor: '#00d9ff' }}
          >
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-2 min-w-[50px]">
                {getStatusIcon(milestone.status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-foreground">{milestone.title}</h3>
                  <span className={`text-xs font-medium whitespace-nowrap ${getStatusColor(milestone.status)}`}>
                    {milestone.status === 'complete' ? 'Complete' : 
                     milestone.status === 'active' ? 'In Progress' : 'Pending'}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                
                {milestone.status !== 'complete' && milestone.status !== 'pending' && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Progress</span>
                      <span className="text-xs font-medium text-primary">{milestone.completion}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${milestone.completion}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                      />
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground mt-2">
                  Due: {new Date(milestone.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Key Dates */}
      <motion.div
        className="glass-panel p-6 rounded-lg"
        whileHover={{ scale: 1.01 }}
      >
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-lg">Critical Path</CardTitle>
          <CardDescription>Longest sequence of dependent activities</CardDescription>
        </CardHeader>
        <CardContent className="px-0 space-y-2">
          <div className="text-sm text-foreground">
            Design Phase (Feb 20) → Dev Sprint 1 (Mar 15) → QA (Apr 20) → Launch (May 15)
          </div>
          <div className="text-xs text-muted-foreground">
            Total duration: 90 days | Slack: 0 days
          </div>
        </CardContent>
      </motion.div>
    </motion.div>
  )
}
