'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { listProjects, getProject, updateProjectTask } from '@/lib/api'
import { useAppUser } from '@/lib/auth-context'
import { Clock, Layers, ListChecks, Link2, Plus, FolderKanban } from 'lucide-react'
import Link from 'next/link'
import { TopNavbar } from '@/components/layout/top-navbar'
import { WorkspaceAuthGate } from '@/components/auth/workspace-auth-gate'

const priorityPill: Record<string, string> = {
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const KANBAN_COLUMNS = ['To Do', 'In Progress', 'In Review', 'Done']

export default function MyTasksPage() {
  return (
    <WorkspaceAuthGate>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
        <TopNavbar />
        <main className="flex-1 relative z-10 pt-24 pb-16 px-6 max-w-7xl mx-auto w-full">
          <TasksContent />
        </main>
      </div>
    </WorkspaceAuthGate>
  )
}

function TasksContent() {
  const { user } = useAppUser()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { projects } = await listProjects()
      let allTasks: any[] = []
      
      for (const p of projects) {
        if (!p.id) continue
        const fullProject = await getProject(p.id)
        const backlog = fullProject?.backlog
        if (backlog && backlog.tasks) {
          const myTasks = backlog.tasks.map((t:any,index:number)=>({...t,_index:index})).filter((t: any) => t.assignee_id === user.id).map((t: any) => ({
             ...t,
             project_id: p.id,
             project_title: p.title || 'Unknown Project',
             status: t.status || 'To Do'
          }))
          allTasks = [...allTasks, ...myTasks]
        }
      }
      setTasks(allTasks)
    } catch (err) {
      console.error("Failed to fetch tasks", err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTasks()
  }, [user])

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault()
    const taskData = e.dataTransfer.getData('application/json')
    if (!taskData) return
    const { title, project_id } = JSON.parse(taskData)
    
    // Optimistic UI
    setTasks(prev => prev.map(t => t.title === title && t.project_id === project_id ? { ...t, status } : t))
    
    try {
      const fullProject = await getProject(project_id)
      if (!fullProject || !fullProject.backlog) return
      
      const task=tasks.find(t=>t.title===title&&t.project_id===project_id)
      if(!task)return
      await updateProjectTask(project_id,task._index,{status,expected_revision:fullProject.revision||0})
    } catch (err) {
      console.error("Failed to update status", err)
      fetchTasks()
    }
  }

  const renderTaskCard = (task: any, idx: number) => {
    return (
      <div
        key={`${task.title}-${idx}`}
        draggable
        onDragStart={(e: any) => e.dataTransfer.setData('application/json', JSON.stringify({ title: task.title, project_id: task.project_id }))}
        className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing shadow-xs"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-xs text-slate-900 leading-snug">{task.title}</p>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 capitalize ${priorityPill[task.priority] || priorityPill.medium}`}>
            {task.priority || 'medium'}
          </span>
        </div>

        <p className="text-[11px] text-blue-600 font-medium mt-1">
          Project: {task.project_title}
        </p>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {task.category && (
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
              {task.category}
            </span>
          )}
          <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
            <Clock className="w-3 h-3 text-slate-400" /> {task.estimated_days}d
          </span>
        </div>

        {task.epic && (
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1 text-[10px] text-slate-500">
            <Layers className="w-3 h-3 text-slate-400" /> {task.epic}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <ListChecks className="w-5 h-5" />
            </div>
            My Assigned Tasks
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Global Kanban board of all tasks assigned to you across Devflow projects.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/my-projects">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-semibold text-xs transition-colors shadow-xs cursor-pointer">
              <FolderKanban className="w-4 h-4 text-slate-500" />
              All Projects
            </button>
          </Link>
          <Link href="/projects/new">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer">
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-16 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
          <ListChecks className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No tasks assigned</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto mb-5">
            You don&apos;t have any tasks assigned to your account yet. Create a project or assign tasks in project sprint boards.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/projects/new">
              <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> New Project
              </button>
            </Link>
            <Link href="/my-projects">
              <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer">
                <FolderKanban className="w-3.5 h-3.5 text-slate-500" /> View Projects
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[500px]">
          {KANBAN_COLUMNS.map((colName) => {
            const colTasks = tasks.filter((t: any) => t.status === colName)
            return (
              <div
                key={colName}
                className="bg-slate-100/70 border border-slate-200 p-4 rounded-2xl flex-shrink-0 w-[290px] flex flex-col h-full min-h-[420px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, colName)}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{colName}</h3>
                  <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-3 flex-1">
                  {colTasks.map((task: any, idx: number) => renderTaskCard(task, idx))}
                  {colTasks.length === 0 && (
                    <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center text-xs text-slate-400">
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
