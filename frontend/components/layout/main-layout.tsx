'use client'

import { motion } from 'framer-motion'
import { TopNavbar } from './top-navbar'
import { Sidebar } from './sidebar'
import { AiPanel } from './ai-panel'
import { AccountPanel } from './account-panel'
import { useAppStore } from '@/lib/store'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { sidebarCollapsed, aiPanelOpen } = useAppStore()

  return (
    <div className="w-screen h-screen bg-background overflow-hidden">
      <TopNavbar />
      <Sidebar />
      <AiPanel />
      <AccountPanel />

      <motion.main
        className="pt-20 transition-all duration-300 h-[calc(100vh-80px)] overflow-y-auto"
        animate={{
          marginLeft: sidebarCollapsed ? '72px' : '240px',
          marginRight: aiPanelOpen ? '384px' : '0px',
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-6">
          {children}
        </div>
      </motion.main>
    </div>
  )
}
