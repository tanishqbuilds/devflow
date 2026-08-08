'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type WorkspaceMode } from '@/lib/store'
import {
  LayoutDashboard,
  FileText,
  Network,
  ListChecks,
  KanbanSquare,
  ShieldAlert,
  CalendarRange,
  DollarSign,
  Users,
  Plug,
  Sparkles,
  BookOpen,
  Settings,
} from 'lucide-react'

interface SidebarItem {
  mode: WorkspaceMode
  label: string
  icon: React.ReactElement<{ className?: string }>
}

interface SidebarGroup {
  label: string
  items: SidebarItem[]
}

const groups: SidebarGroup[] = [
  {
    label: 'Plan',
    items: [
      { mode: 'overview', label: 'Overview', icon: <LayoutDashboard /> },
      { mode: 'requirements', label: 'Requirements', icon: <FileText /> },
      { mode: 'architecture', label: 'Architecture', icon: <Network /> },
    ],
  },
  {
    label: 'Build',
    items: [
      { mode: 'backlog', label: 'Backlog', icon: <ListChecks /> },
      { mode: 'sprint', label: 'Sprint Board', icon: <KanbanSquare /> },
      { mode: 'risks', label: 'Risks', icon: <ShieldAlert /> },
    ],
  },
  {
    label: 'Deliver',
    items: [
      { mode: 'milestones', label: 'Timeline', icon: <CalendarRange /> },
      { mode: 'cost', label: 'Cost & Budget', icon: <DollarSign /> },
      { mode: 'team', label: 'Team Roles', icon: <Users /> },
      { mode: 'integrations', label: 'DevOps & CI/CD', icon: <Plug /> },
    ],
  },
  {
    label: 'Manage',
    items: [
      { mode: 'insights', label: 'AI Insights', icon: <Sparkles /> },
      { mode: 'documentation', label: 'Docs & Export', icon: <BookOpen /> },
    ],
  },
]

export function Sidebar() {
  const { sidebarCollapsed, activeWorkspaceMode, setActiveWorkspaceMode } = useAppStore()

  return (
    <aside
      className={`fixed left-0 top-0 h-screen pt-16 bg-white border-r border-slate-200 z-30 flex flex-col justify-between transition-all duration-200 ${
        sidebarCollapsed ? 'w-[70px]' : 'w-[230px]'
      }`}
    >
      <div className="flex-1 overflow-y-auto scrollbar-hide p-3 flex flex-col">
        <nav className="space-y-3 mt-1">
          {groups.map((group) => (
            <div key={group.label}>
              {!sidebarCollapsed && (
                <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = activeWorkspaceMode === item.mode
                  return (
                    <button
                      key={item.mode}
                      onClick={() => setActiveWorkspaceMode(item.mode)}
                      title={item.label}
                      className={`w-full px-3 py-2 rounded-lg transition-all flex items-center gap-2.5 text-left text-xs font-medium ${
                        active
                          ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                      }`}
                    >
                      <span className="flex-shrink-0">
                        {React.cloneElement(item.icon, {
                          className: `w-4 h-4 transition-colors ${active ? 'text-blue-600' : 'text-slate-500'}`,
                        })}
                      </span>
                      {!sidebarCollapsed && (
                        <span className="whitespace-nowrap overflow-hidden truncate">{item.label}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto pt-2">
          <div className="my-2 border-t border-slate-200" />
          <button
            className="w-full px-3 py-2 rounded-lg flex items-center gap-2.5 text-left text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4 flex-shrink-0 text-slate-400" />
            {!sidebarCollapsed && <span className="whitespace-nowrap">Settings</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}
