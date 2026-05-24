'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const examplePrompts = [
  'Build a real-time collaboration SaaS platform',
  'Create an AI-powered customer support chatbot',
  'Develop a mobile fitness tracking app',
  'Launch a decentralized finance protocol',
  'Design a team project management tool',
]

export function InputSection() {
  const [input, setInput] = useState('')
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const router = useRouter()

  // Rotating example text animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExampleIndex((prev) => (prev + 1) % examplePrompts.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Typewriter animation for example text
  useEffect(() => {
    const prompt = examplePrompts[currentExampleIndex]
    let i = 0
    setDisplayedText('')

    const typeInterval = setInterval(() => {
      if (i < prompt.length) {
        setDisplayedText((prev) => prev + prompt[i])
        i++
      } else {
        clearInterval(typeInterval)
      }
    }, 30)

    return () => clearInterval(typeInterval)
  }, [currentExampleIndex])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      // Store the project idea and navigate to workspace
      router.push(`/workspace?idea=${encodeURIComponent(input)}`)
    }
  }

  return (
    <motion.div
      className="w-full max-w-2xl mx-auto px-4 py-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
    >
      <form onSubmit={handleSubmit} className="relative group">
        {/* Animated glow background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`e.g., ${displayedText}`}
            className="w-full px-6 py-4 bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl text-foreground placeholder-muted-foreground/60 resize-none focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 min-h-24 text-lg"
          />

          <motion.button
            type="submit"
            disabled={!input.trim()}
            className="absolute bottom-4 right-4 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 disabled:hover:shadow-none"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Plan
          </motion.button>
        </div>
      </form>

      {/* Example prompts display */}
      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <p className="text-sm text-muted-foreground mb-4">Try these examples:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {examplePrompts.slice(0, 3).map((prompt, idx) => (
            <motion.button
              key={idx}
              onClick={() => setInput(prompt)}
              className="px-3 py-1 text-xs bg-card/50 border border-white/10 rounded-full text-muted-foreground hover:text-primary hover:border-primary/50 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {prompt.substring(0, 30)}...
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
