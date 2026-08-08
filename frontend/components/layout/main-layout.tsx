'use client'

import { motion } from 'framer-motion'
import { TopNavbar } from './top-navbar'
import { Sidebar } from './sidebar'
import { AiAssistant } from './ai-assistant'
import { AccountPanel } from './account-panel'
import { useAppStore } from '@/lib/store'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { sidebarCollapsed } = useAppStore()

  return (
    <div className="w-screen h-screen bg-background overflow-hidden">
      <TopNavbar />
      <Sidebar />
      <AccountPanel />

      <motion.main
        className="pt-16 transition-all duration-200 h-[calc(100vh-64px)] overflow-y-auto bg-slate-50"
        animate={{ marginLeft: sidebarCollapsed ? '70px' : '230px' }}
        transition={{ duration: 0.2 }}
      >
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </motion.main>

      {/* Floating, collapsible AI copilot (grounded in the active project). */}
      <AiAssistant />
    </div>
  )
}
