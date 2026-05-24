'use client'

import { motion } from 'framer-motion'

export function LandingNavbar() {
  const handleGetStarted = () => {
    const inputSection = document.getElementById('input-section')
    inputSection?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="glass-panel px-6 py-3 rounded-full flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">FF</span>
            </div>
            <span className="text-xl font-bold text-white">FreshFlow</span>
          </motion.div>

          {/* Center - Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <motion.a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              Features
            </motion.a>
            <motion.a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              Docs
            </motion.a>
            <motion.a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              Pricing
            </motion.a>
          </div>

          {/* Right - Auth */}
          <div className="flex items-center gap-3">
            <motion.button
              className="px-4 py-2 text-sm text-foreground hover:text-primary transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              Sign In
            </motion.button>
            <motion.button
              onClick={handleGetStarted}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
