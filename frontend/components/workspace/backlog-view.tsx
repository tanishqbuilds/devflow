'use client'

import { motion } from 'framer-motion'
import { Clock, Layers, Flag, Calendar } from 'lucide-react'
import { useProjectStore } from '@/lib/project-store'
import { GeneratingPanel } from './overview-view'

const priorityClass: Record<string, string> = {
  high: 'bg-rose-50 text-rose-700 border-rose-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export function BacklogView() {
  const project = useProjectStore((s) => s.project)
  const backlog = project?.backlog || null

  if (!backlog) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Backlog & Sprint Plan</h2>
        <GeneratingPanel label="Backlog & Sprints" />
      </div>
    )
  }

  const sprints = [...(backlog.sprints || [])].sort((a, b) => a.number - b.number)
  const tasks = backlog.tasks || []
  const totalDays = tasks.reduce((s, t) => s + (t.estimated_days || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Backlog & Sprint Plan</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {backlog.methodology} Methodology · {sprints.length} Sprints · {tasks.length} User Stories · ~{Math.round(totalDays)} Dev-Days
          </p>
        </div>
      </div>

      {/* Epics */}
      {backlog.epics?.length > 0 && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" /> Backlog Epics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {backlog.epics.map((epic, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="font-semibold text-xs text-slate-900">{epic.title}</p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{epic.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sprints & Tasks */}
      {sprints.map((sprint) => {
        const sprintTasks = tasks.filter((t) => t.sprint === sprint.number)
        return (
          <div key={sprint.number} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Flag className="w-4 h-4 text-blue-600" /> Sprint {sprint.number}: {sprint.name}
              </h3>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {sprintTasks.length} tasks
              </span>
            </div>
            {sprint.goal && (
              <p className="text-xs text-slate-600 mb-4 bg-slate-50 border border-slate-200/80 rounded-lg p-3">
                <strong className="text-slate-900">Sprint Goal:</strong> {sprint.goal}
              </p>
            )}

            <div className="space-y-3">
              {sprintTasks.map((task, idx) => (
                <div key={idx} className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl hover:border-slate-300 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{task.description}</p>
                      <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                        <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {task.estimated_days} dev-days
                        </span>
                        {task.category && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                            {task.category}
                          </span>
                        )}
                        {task.epic && (
                          <span className="text-[11px] font-medium text-blue-600">
                            Epic: {task.epic}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0 ${priorityClass[task.priority] || priorityClass.medium}`}>
                      {task.priority.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
              {sprintTasks.length === 0 && (
                <p className="text-xs text-slate-400 italic">No tasks assigned to this sprint.</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
