'use client'

import { useEffect, useMemo, useState } from 'react'
import { listProjects, getProject, updateProjectTask } from '@/lib/api'
import { useAppUser } from '@/lib/auth-context'
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  FolderKanban,
  Layers,
  Link2,
  ListChecks,
  Loader2,
  RefreshCw,
  Search,
  Tag,
} from 'lucide-react'
import Link from 'next/link'
import { TopNavbar } from '@/components/layout/top-navbar'
import { AccountPanel } from '@/components/layout/account-panel'
import { WorkspaceAuthGate } from '@/components/auth/workspace-auth-gate'

const STATUSES = ['To Do', 'In Progress', 'In Review', 'Done'] as const
type Status = (typeof STATUSES)[number]

const STATUS_STYLES: Record<Status, { bg: string; text: string; border: string }> = {
  'To Do':       { bg: 'bg-slate-100',   text: 'text-slate-600',   border: 'border-slate-200'   },
  'In Progress': { bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200'    },
  'In Review':   { bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200'   },
  'Done':        { bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200' },
}

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200'    },
  high:     { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200'     },
  medium:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'   },
  low:      { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
}

export default function MyTasksPage() {
  return (
    <WorkspaceAuthGate>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
        <TopNavbar />
        <AccountPanel />
        <main className="flex-1 relative z-10 pt-24 pb-16 px-4 sm:px-6 max-w-7xl mx-auto w-full">
          <TasksContent />
        </main>
      </div>
    </WorkspaceAuthGate>
  )
}

function TasksContent() {
  const { user } = useAppUser()
  const [rawTasks, setRawTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  const fetchTasks = async (uid: string) => {
    setLoading(true)
    setError(null)
    try {
      const { projects } = await listProjects()
      const allTasks: any[] = []
      await Promise.all(
        projects.map(async (p) => {
          if (!p.id) return
          try {
            const full = await getProject(p.id)
            const tasks = full?.backlog?.tasks ?? []
            tasks.forEach((t: any, index: number) => {
              if (t.assignee_id === uid) {
                allTasks.push({
                  ...t,
                  _index: index,
                  project_id: p.id,
                  project_title: p.title || 'Unknown Project',
                  status: t.status || 'To Do',
                  revision: full.revision ?? 0,
                })
              }
            })
          } catch { /* skip */ }
        })
      )
      const statusOrder: Record<string, number> = { 'To Do': 0, 'In Progress': 1, 'In Review': 2, 'Done': 3 }
      const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
      allTasks.sort((a, b) => {
        const sd = statusOrder[a.status] - statusOrder[b.status]
        if (sd !== 0) return sd
        return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
      })
      setRawTasks(allTasks)
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!user?.id) { setRawTasks([]); setLoading(false); return }
    fetchTasks(user.id)
  }, [user?.id])

  const handleStatusChange = async (task: any, newStatus: Status) => {
    setRawTasks(prev =>
      prev.map(t => t._index === task._index && t.project_id === task.project_id ? { ...t, status: newStatus } : t)
    )
    try {
      await updateProjectTask(task.project_id, task._index, { status: newStatus, expected_revision: task.revision ?? 0 })
    } catch {
      setRawTasks(prev =>
        prev.map(t => t._index === task._index && t.project_id === task.project_id ? { ...t, status: task.status } : t)
      )
    }
  }

  const filteredTasks = useMemo(() => rawTasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false
    if (search) {
      const q = search.toLowerCase()
      if (!t.title?.toLowerCase().includes(q) && !t.project_title?.toLowerCase().includes(q) &&
          !t.epic?.toLowerCase().includes(q) && !t.category?.toLowerCase().includes(q)) return false
    }
    return true
  }), [rawTasks, filterStatus, filterPriority, search])

  const grouped = useMemo(() => {
    const map = new Map<string, { project_id: string; project_title: string; tasks: any[] }>()
    for (const t of filteredTasks) {
      if (!map.has(t.project_id)) map.set(t.project_id, { project_id: t.project_id, project_title: t.project_title, tasks: [] })
      map.get(t.project_id)!.tasks.push(t)
    }
    return [...map.values()]
  }, [filteredTasks])

  const stats = useMemo(() => ({
    total:      rawTasks.length,
    projects:   new Set(rawTasks.map(t => t.project_id)).size,
    todo:       rawTasks.filter(t => t.status === 'To Do').length,
    inProgress: rawTasks.filter(t => t.status === 'In Progress').length,
    inReview:   rawTasks.filter(t => t.status === 'In Review').length,
    done:       rawTasks.filter(t => t.status === 'Done').length,
  }), [rawTasks])

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold tracking-wide">
              <ListChecks className="w-3.5 h-3.5" /> Task Inbox
            </span>
            {user?.firstName && <span className="text-xs text-slate-400 font-medium">· {user.firstName}</span>}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">My Assigned Tasks</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">All tasks assigned to you across every project you&apos;re a member of.</p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => user?.id && fetchTasks(user.id)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 font-semibold text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <Link href="/my-projects">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-semibold text-xs transition-colors shadow-xs cursor-pointer">
              <FolderKanban className="w-4 h-4 text-slate-500" /> All Projects
            </button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      {!loading && rawTasks.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { label: 'Total Tasks',  value: stats.total,      color: 'text-slate-900'   },
            { label: 'Projects',     value: stats.projects,   color: 'text-indigo-700'  },
            { label: 'To Do',        value: stats.todo,       color: 'text-slate-600'   },
            { label: 'In Progress',  value: stats.inProgress, color: 'text-blue-700'    },
            { label: 'In Review',    value: stats.inReview,   color: 'text-amber-700'   },
            { label: 'Done',         value: stats.done,       color: 'text-emerald-700' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks, projects, epics…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shrink-0 flex-wrap">
          {(['all', ...STATUSES] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s as any)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${filterStatus === s ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >{s === 'all' ? 'All Status' : s}</button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shrink-0 flex-wrap">
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map(p => (
            <button key={p} onClick={() => setFilterPriority(p)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer capitalize ${filterPriority === p ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >{p === 'all' ? 'All Priority' : p}</button>
          ))}
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-xl bg-white border border-slate-200 animate-pulse" />)}</div>
      ) : error ? (
        <div className="p-8 text-center bg-white border border-rose-200 rounded-2xl shadow-xs">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <p className="text-rose-700 font-bold text-sm">Failed to load tasks</p>
          <p className="text-slate-500 text-xs mt-1">{error}</p>
        </div>
      ) : rawTasks.length === 0 ? (
        <div className="py-20 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto mb-4">
            <ListChecks className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No tasks assigned yet</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto mb-6">Ask a project manager to assign tasks to you from the Sprint Board.</p>
          <Link href="/my-projects">
            <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer">
              <FolderKanban className="w-4 h-4" /> View My Projects
            </button>
          </Link>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-12 text-center bg-white border border-slate-200 rounded-2xl">
          <p className="text-slate-400 text-sm">No tasks match your filters.</p>
          <button onClick={() => { setSearch(''); setFilterStatus('all'); setFilterPriority('all') }}
            className="mt-3 text-xs text-blue-600 font-semibold hover:underline cursor-pointer">Clear filters</button>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(group => (
            <ProjectTaskGroup key={group.project_id} group={group} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectTaskGroup({ group, onStatusChange }: {
  group: { project_id: string; project_title: string; tasks: any[] }
  onStatusChange: (task: any, status: Status) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const doneCount = group.tasks.filter(t => t.status === 'Done').length
  const progress = Math.round((doneCount / group.tasks.length) * 100)

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center gap-3 px-5 py-4 border-b border-slate-100 hover:bg-slate-50/60 transition-colors text-left cursor-pointer"
      >
        {collapsed ? <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
        <FolderKanban className="w-4 h-4 text-blue-500 shrink-0" />
        <span className="font-bold text-sm text-slate-900 flex-1 truncate">{group.project_title}</span>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-[11px] font-semibold text-slate-500">{doneCount}/{group.tasks.length} done</span>
        </div>
        <Link
          href={`/workspace?project=${group.project_id}`}
          onClick={e => e.stopPropagation()}
          className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Sprint Board <ExternalLink className="w-3 h-3" />
        </Link>
      </button>

      {!collapsed && (
        <div className="divide-y divide-slate-100">
          <div className="hidden sm:grid grid-cols-[1fr_130px_90px_72px_64px_140px] gap-3 px-5 py-2.5 bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Task</span>
            <span>Category / Epic</span>
            <span>Priority</span>
            <span>Est.</span>
            <span>Sprint</span>
            <span>Status</span>
          </div>
          {group.tasks.map((task, idx) => (
            <TaskRow key={`${task.project_id}-${task._index}-${idx}`} task={task} onStatusChange={onStatusChange} />
          ))}
        </div>
      )}
    </div>
  )
}

function TaskRow({ task, onStatusChange }: { task: any; onStatusChange: (task: any, status: Status) => void }) {
  const [updating, setUpdating] = useState(false)
  const sStyle = STATUS_STYLES[task.status as Status] ?? STATUS_STYLES['To Do']
  const pStyle = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.medium
  const deps = task.dependencies?.length || 0

  const handleChange = async (newStatus: Status) => { setUpdating(true); await onStatusChange(task, newStatus); setUpdating(false) }

  return (
    <div className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
      {/* Mobile */}
      <div className="sm:hidden space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm text-slate-900 leading-snug">{task.title}</p>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex-shrink-0 ${pStyle.bg} ${pStyle.text} ${pStyle.border}`}>{task.priority || 'medium'}</span>
        </div>
        {task.description && <p className="text-[11px] text-slate-400 line-clamp-2">{task.description}</p>}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {task.category && <span className="flex items-center gap-1 text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded"><Tag className="w-3 h-3" />{task.category}</span>}
          <span className="flex items-center gap-1 text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded"><Clock className="w-3 h-3" />{task.estimated_days ?? '—'}d</span>
          {task.sprint && <span className="text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-semibold">Sprint {task.sprint}</span>}
          {deps > 0 && <span className="flex items-center gap-1 text-slate-400"><Link2 className="w-3 h-3" />{deps} dep{deps > 1 ? 's' : ''}</span>}
        </div>
        {task.epic && <p className="flex items-center gap-1 text-[11px] text-slate-400"><Layers className="w-3 h-3 shrink-0" /><span className="truncate">{task.epic}</span></p>}
        <StatusSelector task={task} updating={updating} sStyle={sStyle} onChange={handleChange} />
      </div>

      {/* Desktop */}
      <div className="hidden sm:grid grid-cols-[1fr_130px_90px_72px_64px_140px] gap-3 items-center">
        <div className="min-w-0">
          <p className="font-semibold text-sm text-slate-900 truncate">{task.title}</p>
          {task.description && <p className="text-[11px] text-slate-400 truncate mt-0.5">{task.description}</p>}
          {deps > 0 && <span className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5"><Link2 className="w-3 h-3" />{deps} dep{deps > 1 ? 's' : ''}</span>}
        </div>
        <div className="min-w-0 space-y-1">
          {task.category && <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded w-full truncate"><Tag className="w-3 h-3 shrink-0" /><span className="truncate">{task.category}</span></span>}
          {task.epic && <span className="flex items-center gap-1 text-[10px] text-slate-400 w-full truncate"><Layers className="w-3 h-3 shrink-0" /><span className="truncate">{task.epic}</span></span>}
        </div>
        <div>
          <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border capitalize ${pStyle.bg} ${pStyle.text} ${pStyle.border}`}>{task.priority || 'medium'}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />{task.estimated_days ?? '—'}d
        </div>
        <div>
          {task.sprint
            ? <span className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">S{task.sprint}</span>
            : <span className="text-[11px] text-slate-300">—</span>
          }
        </div>
        <StatusSelector task={task} updating={updating} sStyle={sStyle} onChange={handleChange} />
      </div>
    </div>
  )
}

function StatusSelector({ task, updating, sStyle, onChange }: {
  task: any; updating: boolean
  sStyle: { bg: string; text: string; border: string }
  onChange: (s: Status) => void
}) {
  return (
    <div className="relative inline-block">
      <select
        value={task.status}
        onChange={e => onChange(e.target.value as Status)}
        disabled={updating}
        className={`appearance-none text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer outline-none transition-colors disabled:opacity-60 pr-7 ${sStyle.bg} ${sStyle.text} ${sStyle.border}`}
      >
        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronDown className="w-3 h-3 opacity-60" />}
      </span>
    </div>
  )
}
