'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { listProjects, getProject, updateBacklog, getUsers } from '@/lib/api'
import { useAppUser } from '@/lib/auth-context'
import { Clock, Layers, Link2, Target, ListChecks, Gauge } from 'lucide-react'
import Link from 'next/link'

const priorityPill: Record<string, string> = {
  critical: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
  high: 'bg-red-500/20 text-red-400 border border-red-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  low: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
}

const KANBAN_COLUMNS = ['To Do', 'In Progress', 'In Review', 'Done']

export default function MyTasksPage() {
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
          const myTasks = backlog.tasks.filter((t: any) => t.assignee_id === user.id).map((t: any) => ({
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
      // Find the project and update the task inside it
      const fullProject = await getProject(project_id)
      if (!fullProject || !fullProject.backlog) return
      
      const newTasks = fullProject.backlog.tasks.map((t: any) => t.title === title ? { ...t, status } : t)
      await updateBacklog(project_id, { ...fullProject.backlog, tasks: newTasks })
    } catch (err) {
      console.error("Failed to update status", err)
      // Rollback on fail
      fetchTasks()
    }
  }

  const renderTaskCard = (task: any, idx: number) => {
    return (
      <motion.div
        key={`${task.project_id}-${task.title}-${idx}`}
        draggable
        onDragStart={(e: any) => e.dataTransfer.setData('application/json', JSON.stringify({ title: task.title, project_id: task.project_id }))}
        className="p-3 bg-card/60 border border-white/10 rounded-lg hover:border-primary/50 hover:bg-card/80 transition-colors cursor-grab active:cursor-grabbing"
        whileHover={{ y: -3 }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm text-foreground leading-snug">{task.title}</p>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 capitalize ${priorityPill[task.priority] || priorityPill.medium}`}>
            {task.priority || 'medium'}
          </span>
        </div>

        <Link href={`/workspace?project=${task.project_id}`} className="text-xs text-primary hover:underline mt-1 block truncate">
          {task.project_title}
        </Link>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {task.category && (
            <span className="text-[10px] uppercase tracking-wide text-secondary bg-[#7c3aed]/15 border border-[#7c3aed]/25 px-2 py-0.5 rounded">
              {task.category}
            </span>
          )}
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded">
            <Clock className="w-3 h-3" /> {task.estimated_days}d
          </span>
        </div>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[600px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto mt-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">My Tasks</h1>
        <p className="text-muted-foreground mt-2">All tasks assigned to you across every project.</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[500px]">
        {KANBAN_COLUMNS.map((colName) => {
          const colTasks = tasks.filter((t: any) => t.status === colName)
          return (
            <div
              key={colName}
              className="glass-panel-dark p-4 rounded-xl flex-shrink-0 w-[300px] flex flex-col h-full min-h-[400px]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, colName)}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">{colName}</h3>
                <span className="text-xs font-mono text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>
              <div className="space-y-3 flex-1">
                {colTasks.map((task: any, idx: number) => renderTaskCard(task, idx))}
                {colTasks.length === 0 && (
                  <div className="border border-dashed border-white/10 rounded-lg p-4 text-center text-xs text-muted-foreground opacity-50">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
