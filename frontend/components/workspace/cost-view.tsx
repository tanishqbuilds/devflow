'use client'

import { motion } from 'framer-motion'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useProjectStore } from '@/lib/project-store'
import { GeneratingPanel } from './overview-view'

const PALETTE = ['#00d9ff', '#7c3aed', '#06b6d4', '#a78bfa', '#10b981', '#f43f5e', '#eab308', '#3b82f6']

function fmt(n: number): string {
  return `$${Math.round(n).toLocaleString()}`
}

export function CostView() {
  const project = useProjectStore((s) => s.project)
  const cost = project?.cost || null

  if (!cost) {
    return (
      <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-2xl font-bold text-foreground">Cost Estimation</h2>
        <GeneratingPanel label="Cost estimate" />
      </motion.div>
    )
  }

  const lines = cost.lines || []
  const barData = lines.map((l) => ({ category: l.category.length > 18 ? l.category.slice(0, 17) + '…' : l.category, monthly: Math.round(l.monthly_usd) }))
  const total = cost.monthly_total_usd || lines.reduce((s, l) => s + l.monthly_usd, 0)
  const pieData = lines
    .map((l, i) => ({ name: l.category, value: Math.round((l.monthly_usd / (total || 1)) * 100), fill: PALETTE[i % PALETTE.length] }))
    .filter((d) => d.value > 0)
  const months = Math.max(1, Math.round(cost.duration_months || 6))
  const timelineData = Array.from({ length: months }, (_, i) => ({ month: `M${i + 1}`, cost: Math.round(total * (i + 1)) }))

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      <div>
        <h2 className="text-2xl font-bold text-foreground">Cost Estimation</h2>
        <p className="text-muted-foreground mt-1">Budget allocation derived from the staffing plan & architecture</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard label="Monthly Burn" value={fmt(total)} sub="All-in" valueClass="text-primary" />
        <SummaryCard label="Project Total" value={fmt(cost.project_total_usd)} sub={`Over ${months} months`} valueClass="text-accent" />
        <SummaryCard label="Largest Cost" value={lines.length ? lines.reduce((a, b) => (a.monthly_usd > b.monthly_usd ? a : b)).category.split(' ')[0] : '—'} sub="Category" valueClass="text-cyan-400" />
        <SummaryCard label="Cost Lines" value={String(lines.length)} sub="Tracked" valueClass="text-secondary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div className="glass-panel p-6 rounded-lg" whileHover={{ scale: 1.01 }}>
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg">Monthly Cost by Category</CardTitle>
            <CardDescription>Where the budget goes each month</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#94a3b8" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f1428', border: '1px solid #1e293b' }} />
                <Bar dataKey="monthly" fill="#00d9ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </motion.div>

        <motion.div className="glass-panel p-6 rounded-lg" whileHover={{ scale: 1.01 }}>
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg">Budget Breakdown</CardTitle>
            <CardDescription>Share of monthly spend</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={(e: any) => `${e.value}%`} outerRadius={90} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f1428', border: '1px solid #1e293b' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </motion.div>

        <motion.div className="glass-panel p-6 rounded-lg lg:col-span-2" whileHover={{ scale: 1.01 }}>
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg">Cumulative Spend</CardTitle>
            <CardDescription>Projected spend over the delivery timeline</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <ResponsiveContainer width="100%" height={280}>
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

      <div className="glass-panel p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-foreground mb-4">Line Items</h3>
        <div className="space-y-2">
          {lines.map((l, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-card/50 border border-white/5 rounded-lg">
              <div>
                <p className="text-sm text-foreground">{l.category}</p>
                {l.notes && <p className="text-xs text-muted-foreground">{l.notes}</p>}
              </div>
              <p className="text-sm font-semibold text-primary">{fmt(l.monthly_usd)}/mo</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function SummaryCard({ label, value, sub, valueClass }: { label: string; value: string; sub: string; valueClass: string }) {
  return (
    <motion.div className="glass-panel p-4 rounded-lg" whileHover={{ scale: 1.02 }}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-2 ${valueClass}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </motion.div>
  )
}
