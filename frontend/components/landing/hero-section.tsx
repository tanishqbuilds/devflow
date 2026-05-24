'use client'

import { motion } from 'framer-motion'

export function HeroSection() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[50vh] px-4 py-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <motion.div
        className="text-center max-w-4xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
            Turn Ideas Into
          </span>
          <br />
          <span className="text-white">Executable Plans</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed max-w-2xl mx-auto">
          AI-powered project intelligence platform that orchestrates your entire development lifecycle—from concept to execution.
        </p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <button className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 hover:-translate-y-1">
            Start Planning
          </button>
          <button className="px-8 py-4 border border-primary/50 text-primary rounded-lg font-semibold hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-1">
            Watch Demo
          </button>
        </motion.div>
      </motion.div>

      {/* Decorative glowing circles */}
      <motion.div
        className="absolute top-20 right-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-20"
        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-20"
        animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
        transition={{ duration: 10, repeat: Infinity, delay: 1 }}
      />
    </motion.div>
  )
}
