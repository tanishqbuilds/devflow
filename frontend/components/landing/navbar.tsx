'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Hexagon, Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { label: 'How it works', href: '#how' },
  { label: 'Features', href: '#features' },
  { label: 'Migrate', href: '#migrate' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (href: string) => {
    setMobileOpen(false)
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }

  const startPlanning = () => {
    setMobileOpen(false)
    document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' })
    setTimeout(() => document.getElementById('idea-input')?.focus(), 600)
  }

  return (
    <motion.nav
      className="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 pt-3"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div
        className={`max-w-6xl mx-auto flex items-center justify-between rounded-2xl px-4 sm:px-5 py-2.5 transition-all duration-300 ${
          scrolled
            ? 'bg-background/70 backdrop-blur-xl border border-white/10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]'
            : 'bg-transparent border border-transparent'
        }`}
      >
        {/* Logo */}
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5 group">
          <div className="relative">
            <Hexagon className="w-9 h-9 text-primary fill-primary/15 transition-transform group-hover:rotate-90 duration-500" strokeWidth={1.5} />
            <span className="absolute inset-0 grid place-items-center text-[11px] font-bold text-primary">PF</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            Plan<span className="text-gradient">Forge</span>
          </span>
        </button>

        {/* Center links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <button
              key={l.href}
              onClick={() => scrollTo(l.href)}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5 transition-colors"
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Right */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => router.push('/workspace')}
            className="px-3.5 py-1.5 text-sm text-foreground/80 hover:text-foreground transition-colors"
          >
            Sign in
          </button>
          <motion.button
            onClick={startPlanning}
            className="px-4 py-1.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:shadow-[0_0_24px_-4px_var(--primary)] transition-shadow"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            Start free
          </motion.button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2 text-foreground" onClick={() => setMobileOpen((o) => !o)} aria-label="Menu">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="md:hidden max-w-6xl mx-auto mt-2 rounded-2xl bg-background/90 backdrop-blur-xl border border-white/10 p-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {NAV_LINKS.map((l) => (
              <button
                key={l.href}
                onClick={() => scrollTo(l.href)}
                className="block w-full text-left px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg"
              >
                {l.label}
              </button>
            ))}
            <button
              onClick={startPlanning}
              className="mt-2 w-full px-4 py-2.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground"
            >
              Start free
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
