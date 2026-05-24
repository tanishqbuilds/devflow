'use client'

import { motion } from 'framer-motion'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const costData = [
  { phase: 'Planning', cost: 15000, actual: 12000 },
  { phase: 'Development', cost: 80000, actual: 82000 },
  { phase: 'Testing', cost: 25000, actual: 23000 },
  { phase: 'Deployment', cost: 10000, actual: 11000 },
]

const budgetBreakdown = [
  { name: 'Engineering', value: 65, fill: '#00d9ff' },
  { name: 'Infrastructure', value: 20, fill: '#7c3aed' },
  { name: 'Operations', value: 10, fill: '#06b6d4' },
  { name: 'Contingency', value: 5, fill: '#a78bfa' },
]

const timelineData = [
  { month: 'Jan', cost: 5000 },
  { month: 'Feb', cost: 12000 },
  { month: 'Mar', cost: 28000 },
  { month: 'Apr', cost: 35000 },
  { month: 'May', cost: 42000 },
  { month: 'Jun', cost: 50000 },
]

export function CostView() {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Cost Estimation</h2>
        <p className="text-muted-foreground mt-1">Budget allocation and financial tracking</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          className="glass-panel p-4 rounded-lg"
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-sm text-muted-foreground">Total Budget</p>
          <p className="text-2xl font-bold text-primary mt-2">$130,000</p>
          <p className="text-xs text-muted-foreground mt-1">Allocated</p>
        </motion.div>
        
        <motion.div
          className="glass-panel p-4 rounded-lg"
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-sm text-muted-foreground">Spent</p>
          <p className="text-2xl font-bold text-accent mt-2">$128,000</p>
          <p className="text-xs text-green-400 mt-1">98.5% utilized</p>
        </motion.div>

        <motion.div
          className="glass-panel p-4 rounded-lg"
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-sm text-muted-foreground">Remaining</p>
          <p className="text-2xl font-bold text-cyan-400 mt-2">$2,000</p>
          <p className="text-xs text-muted-foreground mt-1">Contingency</p>
        </motion.div>

        <motion.div
          className="glass-panel p-4 rounded-lg"
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-sm text-muted-foreground">ROI</p>
          <p className="text-2xl font-bold text-secondary mt-2">3.2x</p>
          <p className="text-xs text-muted-foreground mt-1">Expected return</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget vs Actual */}
        <motion.div
          className="glass-panel p-6 rounded-lg"
          whileHover={{ scale: 1.01 }}
        >
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg">Budget vs Actual</CardTitle>
            <CardDescription>Cost comparison by phase</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="phase" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f1428', border: '1px solid #1e293b' }} />
                <Legend />
                <Bar dataKey="cost" fill="#00d9ff" />
                <Bar dataKey="actual" fill="#7c3aed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </motion.div>

        {/* Budget Breakdown */}
        <motion.div
          className="glass-panel p-6 rounded-lg"
          whileHover={{ scale: 1.01 }}
        >
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg">Budget Breakdown</CardTitle>
            <CardDescription>Resource allocation distribution</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={budgetBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name} ${entry.value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {budgetBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f1428', border: '1px solid #1e293b' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </motion.div>

        {/* Cumulative Cost Timeline */}
        <motion.div
          className="glass-panel p-6 rounded-lg lg:col-span-2"
          whileHover={{ scale: 1.01 }}
        >
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg">Cost Timeline</CardTitle>
            <CardDescription>Cumulative spending over time</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f1428', border: '1px solid #1e293b' }} />
                <Line type="monotone" dataKey="cost" stroke="#00d9ff" dot={{ fill: '#7c3aed' }} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </motion.div>
      </div>
    </motion.div>
  )
}
