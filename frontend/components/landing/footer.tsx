'use client'

import { motion } from 'framer-motion'
import { Hexagon, ShieldCheck, Lock, Download } from 'lucide-react'
import { Reveal } from './reveal'

const TRUST_BADGES = [
  { icon: ShieldCheck, label: 'SOC 2 (in progress)' },
  { icon: Lock, label: 'GDPR-ready' },
  { icon: Download, label: 'No-lock-in export' },
] as const

type FooterLink = { label: string; href: string }

const LINK_COLUMNS: { heading: string; links: FooterLink[] }[] = [
  {
    heading: 'Product',
    links: [
      { label: 'How it works', href: '#how' },
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Migrate', href: '#migrate' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Changelog', href: '#' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Docs', href: '#' },
      { label: 'Status', href: '#' },
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
    ],
  },
]

export function LandingFooter() {
  const handleNav = (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href === '#') return
    const el = document.querySelector(href)
    if (el) {
      e.preventDefault()
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer
      id="footer"
      className="relative px-4 pt-16 pb-10 border-t border-white/10"
    >
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-8">
            {/* Brand + tagline + trust badges */}
            <div>
              <div className="flex items-center gap-2">
                <motion.span
                  whileHover={{ rotate: 90 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                  className="inline-flex"
                >
                  <Hexagon
                    className="w-7 h-7 text-primary"
                    aria-hidden="true"
                    strokeWidth={2.25}
                  />
                </motion.span>
                <span className="text-xl font-bold tracking-tight text-foreground">
                  Plan<span className="text-gradient">Forge</span>
                </span>
              </div>

              <p className="mt-4 max-w-sm text-sm text-muted-foreground">
                An AI organization that plans your software, before you build it.
              </p>

              <ul className="mt-6 flex flex-wrap gap-2">
                {TRUST_BADGES.map(({ icon: Icon, label }) => (
                  <li key={label}>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground">
                      <Icon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Link columns */}
            <nav
              aria-label="Footer"
              className="grid grid-cols-2 gap-8 sm:grid-cols-3"
            >
              {LINK_COLUMNS.map((column) => (
                <div key={column.heading}>
                  <h3 className="text-sm font-semibold text-foreground">
                    {column.heading}
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          onClick={handleNav(link.href)}
                          className="text-sm text-muted-foreground transition-colors hover:text-primary"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              © 2026 Devflow. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground/70">
              Built with an AI organization.
            </p>
          </div>
        </Reveal>
      </div>
    </footer>
  )
}
