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
      { mode: 'cost', label: 'Cost', icon: <DollarSign /> },
      { mode: 'team', label: 'Team', icon: <Users /> },
      { mode: 'integrations', label: 'Integrations', icon: <Plug /> },
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
    <motion.aside
      className="fixed left-0 top-0 h-screen pt-20 bg-[#050816]/40 backdrop-blur-xl border-r border-white/5 z-30 flex flex-col justify-between"
      animate={{ width: sidebarCollapsed ? '72px' : '240px' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <div className="flex-1 overflow-y-auto scrollbar-hide p-3 flex flex-col">
        <nav className="space-y-3">
          {groups.map((group) => (
            <div key={group.label}>
              <AnimatePresence mode="wait">
                {!sidebarCollapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60"
                  >
                    {group.label}
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = activeWorkspaceMode === item.mode
                  return (
                    <motion.button
                      key={item.mode}
                      onClick={() => setActiveWorkspaceMode(item.mode)}
                      title={item.label}
                      className={`w-full px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2.5 text-left text-[13px] font-medium ${
                        active
                          ? 'bg-primary/10 text-primary border border-primary/30 shadow-[0_0_15px_rgba(0,217,255,0.15)]'
                          : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
                      }`}
                      whileHover={{ x: sidebarCollapsed ? 0 : 3 }}
                    >
                      <span className="flex-shrink-0">
                        {React.cloneElement(item.icon, {
                          className: `w-4 h-4 transition-colors duration-200 ${active ? 'text-primary' : 'text-muted-foreground'}`,
                        })}
                      </span>
                      <AnimatePresence mode="wait">
                        {!sidebarCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.15 }}
                            className="whitespace-nowrap overflow-hidden"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto pt-2">
          <div className="my-2 border-t border-white/5" />
          <button
            className="w-full px-3 py-2 rounded-lg flex items-center gap-2.5 text-left text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            <AnimatePresence mode="wait">
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  Settings
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </motion.aside>
  )
}
