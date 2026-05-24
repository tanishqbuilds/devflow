'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { X, Send, Sparkles } from 'lucide-react'
import { useState } from 'react'

const quickActions = [
  { label: 'Refine Architecture', description: 'Improve system design' },
  { label: 'Optimize Sprint', description: 'Better task distribution' },
  { label: 'Mitigate Risks', description: 'Address identified risks' },
  { label: 'Cut Costs', description: 'Reduce project expenses' },
]

export function AiPanel() {
  const { aiPanelOpen, setAiPanelOpen } = useAppStore()
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'I\'m your AI orchestration assistant. I can help refine your project plan, identify risks, optimize your sprint, and much more.',
    },
  ])
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { role: 'user', content: input }])
      setInput('')
      // Simulate AI response
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'I\'m analyzing your request. This is a demo response, but in production I\'d provide detailed insights based on your project context.',
          },
        ])
      }, 500)
    }
  }

  return (
    <AnimatePresence>
      {aiPanelOpen && (
        <motion.div
          className="fixed right-0 top-0 h-screen w-96 bg-background/40 backdrop-blur-xl border-l border-white/5 z-30 flex flex-col"
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="pt-20 px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">AI Assistant</h3>
            </div>
            <motion.button
              onClick={() => setAiPanelOpen(false)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
            {messages.map((message, idx) => (
              <motion.div
                key={idx}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div
                  className={`max-w-xs px-4 py-3 rounded-lg text-sm ${
                    message.role === 'user'
                      ? 'bg-primary/20 text-primary border border-primary/50'
                      : 'bg-card/50 text-foreground border border-white/10'
                  }`}
                >
                  {message.content}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="px-6 py-4 border-t border-white/5">
            <p className="text-xs text-muted-foreground mb-3 font-medium">Quick Actions</p>
            <div className="space-y-2 mb-4">
              {quickActions.map((action, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => setInput(action.label)}
                  className="w-full p-3 bg-card/50 border border-white/10 rounded-lg hover:border-primary/50 hover:bg-card/75 transition-all text-left text-xs"
                  whileHover={{ x: 4 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <p className="font-semibold text-foreground">{action.label}</p>
                  <p className="text-muted-foreground text-xs mt-1">{action.description}</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-6 border-t border-white/5">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 bg-card/50 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-foreground placeholder-muted-foreground"
              />
              <motion.button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
