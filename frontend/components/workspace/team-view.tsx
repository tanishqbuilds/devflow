'use client'

import { motion } from 'framer-motion'
import { Users, Briefcase, Zap } from 'lucide-react'

const sampleTeam = [
  {
    id: '1',
    name: 'Product Lead',
    description: 'Project planning and roadmap',
    count: 1,
    workload: 85,
    skills: ['Planning', 'Strategy', 'Communication'],
  },
  {
    id: '2',
    name: 'Backend Engineers',
    description: 'API and database development',
    count: 3,
    workload: 92,
    skills: ['Node.js', 'PostgreSQL', 'System Design'],
  },
  {
    id: '3',
    name: 'Frontend Engineers',
    description: 'UI/UX implementation',
    count: 2,
    workload: 78,
    skills: ['React', 'TypeScript', 'Tailwind CSS'],
  },
  {
    id: '4',
    name: 'DevOps Engineer',
    description: 'Infrastructure and deployment',
    count: 1,
    workload: 65,
    skills: ['Kubernetes', 'AWS', 'CI/CD'],
  },
]

export function TeamView() {
  const totalMembers = sampleTeam.reduce((sum, role) => sum + role.count, 0)

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Team Planning</h2>
        <p className="text-muted-foreground">Resource allocation and team composition</p>
      </div>

      {/* Team summary */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {[
          { label: 'Total Team Size', value: totalMembers, icon: Users },
          { label: 'Avg Workload', value: `${Math.round(sampleTeam.reduce((sum, r) => sum + r.workload, 0) / sampleTeam.length)}%`, icon: Zap },
          { label: 'Roles', value: sampleTeam.length, icon: Briefcase },
        ].map((item, idx) => (
          <motion.div
            key={item.label}
            className="glass-panel p-6 rounded-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <item.icon className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{item.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Team roles */}
      <div className="space-y-4">
        {sampleTeam.map((role, idx) => (
          <motion.div
            key={role.id}
            className="glass-panel p-6 rounded-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + idx * 0.05 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{role.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{role.count}</p>
                <p className="text-xs text-muted-foreground">members</p>
              </div>
            </div>

            {/* Workload */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Workload</p>
                <span className="text-sm font-semibold text-foreground">{role.workload}%</span>
              </div>
              <motion.div
                className="h-2 bg-card rounded-full overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className={`h-full ${
                    role.workload > 85
                      ? 'bg-red-500'
                      : role.workload > 70
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${role.workload}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </motion.div>
            </div>

            {/* Skills */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Key Skills</p>
              <div className="flex flex-wrap gap-2">
                {role.skills.map((skill) => (
                  <motion.span
                    key={skill}
                    className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
