'use client'

import { motion } from 'framer-motion'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useProjectStore } from '@/lib/project-store'
import { GeneratingPanel } from './overview-view'
import { InlineEditable } from './workspace-editor'

const PALETTE = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#0284c7', '#e11d48', '#4f46e5', '#0d9488']

function fmt(n: number): string {
  return `$${Math.round(n).toLocaleString()}`
}

export function CostView() {
  const project = useProjectStore((s) => s.project)
  const cost = project?.cost || null

  if (!cost) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Financial & Cost Estimation</h2>
        <GeneratingPanel label="Cost & Budget Estimation" />
      </div>
    )
  }

  const lines = cost.lines || []
  const barData = lines.map((l) => ({ category: l.category.length > 18 ? l.category.slice(0, 17) + '…' : l.category, monthly: Math.round(l.monthly_usd) }))
  const total = cost.monthly_total_usd || lines.reduce((s, l) => s + l.monthly_usd, 0)
  const pieData = lines
    .map((l, i) => ({ name: l.category, value: Math.round((l.monthly_usd / (total || 1)) * 100), fill: PALETTE[i % PALETTE.length] }))
    .filter((d) => d.value > 0)
  const months = Math.max(1, Math.round(cost.duration_months || 6))
  const timelineData = Array.from({ length: months }, (_, i) => ({ month: `Month ${i + 1}`, cost: Math.round(total * (i + 1)) }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Cost Modeling</h2>
        <p className="text-slate-500 text-sm mt-0.5">
          Budget breakdown derived from engineering rate cards, cloud infrastructure, and timeline duration
        </p>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Monthly Run Rate" value={fmt(total)} sub="All-in Staffing + Cloud" color="text-blue-600" />
        <SummaryCard label="Project Total" value={fmt(cost.project_total_usd)} sub={`Across ${months} Months`} color="text-slate-900" />
        <SummaryCard label="Top Spend Category" value={lines.length ? lines.reduce((a, b) => (a.monthly_usd > b.monthly_usd ? a : b)).category.split(' ')[0] : '—'} sub="Staffing / Engineering" color="text-indigo-600" />
        <SummaryCard label="Tracked Cost Lines" value={String(lines.length)} sub="Budget Categories" color="text-emerald-600" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Cost by Category */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Monthly Cost by Category</h3>
            <p className="text-xs text-slate-500 mt-0.5">Staffing & cloud resource monthly breakdown</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="monthly" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Budget Share */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Budget Share Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">Proportional allocation of monthly burn</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={(e: any) => `${e.value}%`} outerRadius={85} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Cumulative Timeline Spend */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Cumulative Milestone Spend</h3>
            <p className="text-xs text-slate-500 mt-0.5">Projected capital deployment across project lifecycle</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="cost" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Items List */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Detailed Budget Items</h3>
        <div className="space-y-2.5">
          {lines.map((l, i) => (
            <div key={i} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900">
                  <InlineEditable path={`/cost/lines/${i}/category`} value={l.category} />
                </p>
                {l.notes && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    <InlineEditable path={`/cost/lines/${i}/notes`} value={l.notes} multiline />
                  </p>
                )}
              </div>
              <p className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg shrink-0">
                {fmt(l.monthly_usd)}/mo
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
    </div>
  )
}
