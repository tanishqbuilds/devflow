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
      <div className="min-h-screen bg-[#050816] text-[#f8fafc] font-sans overflow-hidden flex flex-col">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        <TopNavbar />

        <main className="flex-1 relative z-10 pt-28 pb-16 px-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                <FolderKanban className="w-8 h-8 text-cyan-400" />
                My Projects
              </h1>
              <p className="text-muted-foreground mt-2">Resume your past AI-generated plans or start a new one.</p>
            </div>
            <Link href="/">
              <motion.button
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl text-white font-semibold text-sm hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-4 h-4" />
                New Project
              </motion.button>
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
          <div key={i} className="h-48 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-white/5 border border-red-500/20 rounded-2xl">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <h3 className="text-red-400 font-semibold">Failed to load projects</h3>
        <p className="text-muted-foreground text-sm mt-1">{error}</p>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="py-20 text-center bg-black/20 border border-white/5 rounded-2xl backdrop-blur-sm">
        <LayoutDashboard className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-medium text-white">No projects yet</h3>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          You haven&apos;t generated any projects. Head back to the landing page to start your first AI orchestration.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((p, idx) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: idx * 0.05 }}
          onClick={() => router.push(`/workspace?project=${p.id}`)}
          className="group relative flex flex-col p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md cursor-pointer overflow-hidden transition-all duration-300 hover:border-cyan-500/50 hover:bg-black/60"
        >
          {/* Hover glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-cyan-500/0 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 text-white group-hover:text-cyan-300 transition-colors">
              {p.title || 'Untitled Project'}
            </h3>
            <StatusBadge status={p.status} />
          </div>

          <div className="mt-auto space-y-4 relative z-10">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>Progress</span>
                <span>{Math.floor(p.progress || 0)}%</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 rounded-full transition-all duration-500" 
                  style={{ width: `${p.progress || 0}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>{p.created_at ? new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string | undefined }) {
  if (status === 'complete') {
    return (
      <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full shrink-0">
        Complete
      </span>
    )
  }
  if (status === 'failed') {
    return (
      <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 rounded-full shrink-0">
        Failed
      </span>
    )
  }
  return (
    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full shrink-0 flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
      Active
    </span>
  )
}
