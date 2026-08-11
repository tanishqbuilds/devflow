'use client'

import { motion } from 'framer-motion'
import { Users, Briefcase, Zap, ShieldCheck } from 'lucide-react'
import { useProjectStore } from '@/lib/project-store'
import { GeneratingPanel } from './overview-view'
import { InlineEditable } from './workspace-editor'

export function TeamView() {
  const project = useProjectStore((s) => s.project)
  const team = project?.team || null

  if (!team) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Engineering Team Allocation</h2>
        <GeneratingPanel label="Team Composition & Roles" />
      </div>
    )
  }

  const members = team.members || []
  const totalMembers = members.reduce((sum, r) => sum + (r.count || 1), 0)
  const avgAllocation = members.length
    ? Math.round(members.reduce((sum, r) => sum + (r.allocation_pct || 0), 0) / members.length)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Engineering Team Structure</h2>
        <p className="text-slate-500 text-sm mt-0.5">
          Role staffing and ownership modeled by the VP of Engineering Agent
        </p>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Recommended Team Size', value: `${totalMembers} FTEs`, icon: Users, color: 'text-blue-600' },
          { label: 'Average Allocation', value: `${avgAllocation}%`, icon: Zap, color: 'text-indigo-600' },
          { label: 'Distinct Roles', value: `${members.length} Specializations`, icon: Briefcase, color: 'text-emerald-600' },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <item.icon className={`w-4 h-4 ${item.color}`} />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.label}</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Roles List */}
      <div className="space-y-4">
        {members.map((role, idx) => (
          <div key={idx} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
            <div className="flex items-start justify-between mb-4 gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 flex flex-wrap items-center gap-2">
                  <InlineEditable path={`/team/members/${idx}/role`} value={role.role} className="font-bold text-slate-900" />
                  <span className="text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
                    <InlineEditable path={`/team/members/${idx}/seniority`} value={role.seniority} />
                  </span>
                </h3>
                {role.responsibilities?.length > 0 && (
                  <div className="text-xs text-slate-600 mt-2 leading-relaxed space-y-1">
                    {role.responsibilities.map((resp, ridx) => (
                      <div key={ridx} className="flex items-start gap-2">
                        <span className="text-slate-400">•</span>
                        <span className="flex-1">
                          <InlineEditable path={`/team/members/${idx}/responsibilities/${ridx}`} value={resp} multiline />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 shrink-0">
                <p className="text-xl font-bold text-slate-900">
                  <InlineEditable path={`/team/members/${idx}/count`} value={role.count} />
                </p>
                <p className="text-[10px] uppercase font-bold text-slate-400">{role.count === 1 ? 'person' : 'people'}</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-slate-500">Dedicated Allocation</p>
                <span className="text-xs font-bold text-slate-900">
                  <InlineEditable path={`/team/members/${idx}/allocation_pct`} value={role.allocation_pct} />%
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${role.allocation_pct}%` }}
                />
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Required Core Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {(role.skills || []).map((skill, sidx) => (
                  <span key={sidx} className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold">
                    <InlineEditable path={`/team/members/${idx}/skills/${sidx}`} value={skill} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ownership & Accountability */}
      {team.ownership?.length > 0 && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Ownership & Accountability Matrices
          </h3>
          <ul className="space-y-2">
            {team.ownership.map((o, i) => (
              <li key={i} className="text-xs text-slate-700 flex gap-2.5 items-start">
                <span className="text-emerald-600 font-bold">•</span>
                <span className="flex-1">
                  <InlineEditable path={`/team/ownership/${i}`} value={o} multiline />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
