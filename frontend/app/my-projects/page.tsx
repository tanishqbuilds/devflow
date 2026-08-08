'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FolderKanban, Plus, LayoutDashboard, Clock, AlertCircle } from 'lucide-react'
import { listProjects } from '@/lib/api'
import type { ProjectDoc } from '@/lib/project-types'
import { TopNavbar } from '@/components/layout/top-navbar'
import { WorkspaceAuthGate } from '@/components/auth/workspace-auth-gate'

type ProjectSummary = Partial<ProjectDoc>

export default function MyProjectsPage() {
  return (
    <WorkspaceAuthGate>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
        <TopNavbar />

        <main className="flex-1 relative z-10 pt-24 pb-16 px-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                  <FolderKanban className="w-5 h-5" />
                </div>
                My Projects
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Access your AI-generated delivery specifications, architecture diagrams, and backlogs.
              </p>
            </div>
            <Link href="/">
              <button
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>
            </Link>
          </div>

          <ProjectsList />
        </main>
      </div>
    </WorkspaceAuthGate>
  )
}

function ProjectsList() {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    listProjects()
      .then((res) => {
        if (mounted) {
          setProjects(res.projects || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Failed to load projects')
          setLoading(false)
        }
      })
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-44 rounded-2xl bg-white border border-slate-200 animate-pulse shadow-xs" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-white border border-rose-200 rounded-2xl shadow-xs">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-3" />
        <h3 className="text-rose-700 font-bold text-sm">Failed to load projects</h3>
        <p className="text-slate-500 text-xs mt-1">{error}</p>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="py-20 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
        <LayoutDashboard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">No projects yet</h3>
        <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
          Start your first autonomous AI orchestration from the landing page.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((p) => (
        <div
          key={p.id}
          onClick={() => router.push(`/workspace?project=${p.id}`)}
          className="group flex flex-col p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md cursor-pointer transition-all duration-200"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <h3 className="font-bold text-sm leading-snug line-clamp-2 text-slate-900 group-hover:text-blue-600 transition-colors">
              {p.title || 'Untitled Project'}
            </h3>
            <StatusBadge status={p.status} />
          </div>

          <div className="mt-auto space-y-3 pt-3 border-t border-slate-100">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span>Orchestration Progress</span>
                <span className="font-bold text-slate-900">{Math.floor(p.progress || 0)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/60">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                  style={{ width: `${p.progress || 0}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{p.created_at ? new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string | undefined }) {
  if (status === 'complete') {
    return (
      <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full shrink-0">
        Ready
      </span>
    )
  }
  if (status === 'failed') {
    return (
      <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 rounded-full shrink-0">
        Failed
      </span>
    )
  }
  return (
    <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 rounded-full shrink-0 flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
      Active
    </span>
  )
}
