'use client'

import { LandingNavbar } from './navbar'
import { HeroSection } from './hero-section'
import { InputSection } from './input-section'
import { motion } from 'framer-motion'

export function LandingPageContent() {
  return (
    <div className="min-h-screen bg-background">
      {/* Gradient background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
          animate={{ y: [0, 50, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"
          animate={{ y: [0, -50, 0] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <LandingNavbar />
        
        <div className="pt-20">
          <HeroSection />
          <InputSection />
        </div>

        {/* Footer CTA Section */}
        <motion.section
          className="py-20 px-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <div className="max-w-3xl mx-auto glass-panel p-12 rounded-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to transform your project planning?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join teams that are shipping faster with AI-powered project orchestration.
            </p>
            <motion.button
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Your First Project
            </motion.button>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
