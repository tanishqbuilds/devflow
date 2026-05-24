'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type WorkspaceMode } from '@/lib/store'
import {
  LayoutDashboard,
  CheckSquare2,
  FileText,
  Zap,
  Backpack,
  Flame,
  DollarSign,
  Users,
  Settings,
  Link2,
  Flag,
  Calendar,
  BookOpen,
  Lightbulb,
  BarChart3,
} from 'lucide-react'

interface SidebarItem {
  mode: WorkspaceMode
  label: string
  icon: React.ReactNode
}

const sidebarItems: SidebarItem[] = [
  { mode: 'overview', label: 'Overview', icon: <LayoutDashboard /> },
  { mode: 'prerequisites', label: 'Pre-Requisites', icon: <CheckSquare2 /> },
  { mode: 'requirements', label: 'Requirements', icon: <FileText /> },
  { mode: 'architecture', label: 'Architecture', icon: <Zap /> },
  { mode: 'backlog', label: 'Backlog', icon: <Backpack /> },
  { mode: 'sprint', label: 'Sprint Planning', icon: <Flag /> },
  { mode: 'risks', label: 'Risks', icon: <Flame /> },
  { mode: 'cost', label: 'Cost Estimation', icon: <DollarSign /> },
  { mode: 'team', label: 'Team Planning', icon: <Users /> },
  { mode: 'tech-stack', label: 'Tech Stack', icon: <BarChart3 /> },
  { mode: 'integrations', label: 'Integrations', icon: <Link2 /> },
  { mode: 'milestones', label: 'Milestones', icon: <Calendar /> },
  { mode: 'timeline', label: 'Timeline', icon: <Calendar /> },
  { mode: 'documentation', label: 'Documentation', icon: <BookOpen /> },
  { mode: 'insights', label: 'AI Insights', icon: <Lightbulb /> },
]

export function Sidebar() {
  const { sidebarCollapsed, activeWorkspaceMode, setActiveWorkspaceMode } = useAppStore()

  return (
    <motion.aside
      className="fixed left-0 top-0 h-screen pt-20 bg-[#050816]/40 backdrop-blur-xl border-r border-white/5 z-30 flex flex-col justify-between"
      animate={{ width: sidebarCollapsed ? '72px' : '240px' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Upper Navigation - Fixed no-scroll layout */}
      <div className="flex-1 overflow-hidden p-3 flex flex-col justify-between h-full">
        <nav className="space-y-1">
          {sidebarItems.map((item, idx) => (
            <motion.button
              key={item.mode}
              onClick={() => setActiveWorkspaceMode(item.mode)}
              className={`w-full px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-2.5 text-left text-xs font-medium ${
                activeWorkspaceMode === item.mode
                  ? 'bg-primary/10 text-primary border border-primary/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02, duration: 0.2 }}
              whileHover={{ x: sidebarCollapsed ? 0 : 3 }}
            >
              <span className="flex-shrink-0">
                {React.cloneElement(item.icon as React.ReactElement, { 
                  className: `w-4 h-4 transition-colors duration-200 ${
                    activeWorkspaceMode === item.mode ? 'text-primary' : 'text-muted-foreground'
                  }` 
                })}
              </span>
              <AnimatePresence mode="wait">
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="whitespace-nowrap overflow-hidden text-[13px]"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </nav>

        <div>
          {/* Divider */}
          <div className="my-2 border-t border-white/5" />

          {/* Bottom Settings Button */}
          <nav className="space-y-1">
            <motion.button
              className="w-full px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-2.5 text-left text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/5"
              whileHover={{ x: sidebarCollapsed ? 0 : 3 }}
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              <AnimatePresence mode="wait">
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="whitespace-nowrap overflow-hidden text-[13px]"
                  >
                    Settings
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </nav>
        </div>
      </div>
    </motion.aside>
  )
}
