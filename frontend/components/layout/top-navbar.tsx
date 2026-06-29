'use client'

import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { useAppUser, useAppAuth } from '@/lib/auth-context'
import { Menu, Bell, Search, LogIn, Sparkles } from 'lucide-react'

export function TopNavbar() {
  const { projectTitle, sidebarCollapsed, setSidebarCollapsed, aiPanelOpen, setAiPanelOpen, accountPanelOpen, setAccountPanelOpen } = useAppStore()
  const { user, isSignedIn } = useAppUser()
  const { signIn } = useAppAuth()

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-40 px-6 py-4 bg-background/40 backdrop-blur-xl border-b border-white/5"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center justify-between gap-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <motion.button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="w-5 h-5 text-muted-foreground" />
          </motion.button>

          <a href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-violet-500 rounded-lg flex items-center justify-center shadow-[0_0_16px_-4px_var(--primary)]">
              <span className="text-black font-bold text-xs">PF</span>
            </div>
            <span className="font-semibold text-foreground hidden sm:inline group-hover:text-primary transition-colors">Plan<span className="text-primary">Forge</span></span>
          </a>
          <span className="hidden sm:inline text-muted-foreground/40">/</span>
          <span className="font-medium text-muted-foreground hidden sm:inline truncate max-w-[200px]">{projectTitle}</span>

          {/* Status Badge */}
          <motion.div
            className="ml-4 px-3 py-1 bg-card/50 border border-white/10 rounded-full text-xs text-muted-foreground flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
            Orchestration Ready
          </motion.div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <motion.button
            className="p-2 hover:bg-white/5 rounded-lg transition-colors hidden md:flex"
            whileHover={{ scale: 1.05 }}
          >
            <Search className="w-5 h-5 text-muted-foreground" />
          </motion.button>

          {/* Notifications */}
          <motion.button
            className="p-2 hover:bg-white/5 rounded-lg transition-colors relative"
            whileHover={{ scale: 1.05 }}
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </motion.button>

          {/* Copilot Toggle */}
          <motion.button
            onClick={() => setAiPanelOpen(!aiPanelOpen)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
              aiPanelOpen
                ? 'bg-primary/20 text-primary border border-primary/50'
                : 'text-muted-foreground hover:bg-white/5 border border-transparent'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Copilot</span>
          </motion.button>

          {/* User Section */}
          {isSignedIn && user ? (
            <motion.button
              onClick={() => setAccountPanelOpen(!accountPanelOpen)}
              className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center bg-card"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img 
                src={user.imageUrl} 
                alt={user.fullName} 
                className="w-full h-full object-cover"
              />
            </motion.button>
          ) : (
            <motion.button
              onClick={signIn}
              className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 text-black text-xs font-semibold rounded-lg hover:bg-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </motion.button>
          )}
        </div>
      </div>
    </motion.nav>
  )
}
