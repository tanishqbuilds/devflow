'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProjectStore } from '@/lib/project-store'
import {
  Lightbulb,
  Search,
  Network,
  ListChecks,
  CalendarDays,
  ShieldAlert,
  DollarSign,
  Play,
  BrainCircuit,
  CheckCircle2,
  TrendingUp,
  Activity,
  Cpu,
} from 'lucide-react'

// Orchestration graph nodes (ids match the backend graph) with layout coords (%).
const AGENT_NODES = [
  { id: 'idea', label: 'Idea Intake', icon: <Lightbulb />, x: 6, y: 50, color: '#22d3ee' },
  { id: 'requirements', label: 'Product Manager', icon: <Search />, x: 19, y: 50, color: '#3b82f6' },
  { id: 'architecture', label: 'System Architect', icon: <Network />, x: 33, y: 50, color: '#a855f7' },
  { id: 'tasks', label: 'Sprint Planner', icon: <ListChecks />, x: 50, y: 18, color: '#6366f1' },
  { id: 'risk', label: 'Risk Analyst', icon: <ShieldAlert />, x: 50, y: 50, color: '#eab308' },
  { id: 'cost', label: 'Team & Cost', icon: <DollarSign />, x: 50, y: 82, color: '#10b981' },
  { id: 'sprint', label: 'Sprint Board', icon: <CalendarDays />, x: 68, y: 18, color: '#f43f5e' },
  { id: 'execution', label: 'Delivery & Integration', icon: <Play />, x: 84, y: 50, color: '#ec4899' },
]

const CONNECTIONS = [
  { from: 'idea', to: 'requirements' },
  { from: 'requirements', to: 'architecture' },
  { from: 'architecture', to: 'tasks' },
  { from: 'architecture', to: 'risk' },
  { from: 'architecture', to: 'cost' },
  { from: 'tasks', to: 'sprint' },
  { from: 'sprint', to: 'execution' },
  { from: 'risk', to: 'execution' },
  { from: 'cost', to: 'execution' },
]

type VisualState = 'idle' | 'active' | 'complete'

function toVisual(status: string | undefined): VisualState {
  if (status === 'complete') return 'complete'
  if (status === 'thinking' || status === 'analyzing' || status === 'generating') return 'active'
  return 'idle'
}

export function OrchestrationLoader() {
  const nodes = useProjectStore((s) => s.nodes)
  const logs = useProjectStore((s) => s.logs)
  const progress = useProjectStore((s) => s.progress)
  const status = useProjectStore((s) => s.status)
  const error = useProjectStore((s) => s.error)

  const [elapsedTime, setElapsedTime] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const terminalEndRef = useRef<HTMLDivElement | null>(null)

  const completed = status === 'complete'
  const failed = status === 'failed'

  // Derived telemetry from real progress.
  const fidelity = Math.min(60 + Math.round(progress * 0.38), 99)
  const synergy = Math.min(50 + Math.round(progress * 0.49), 99)
  const riskIndex = Math.max(82 - Math.round(progress * 0.7), 11)

  // Local clock (cosmetic).
  useEffect(() => {
    const start = Date.now()
    const timer = setInterval(() => setElapsedTime(Date.now() - start), 100)
    return () => clearInterval(timer)
  }, [])

  // Particle field.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)
    const onResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.15,
      speedY: (Math.random() - 0.5) * 0.15,
      alpha: Math.random() * 0.5 + 0.2,
      color: Math.random() > 0.5 ? '#22d3ee' : '#a855f7',
    }))
    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      particles.forEach((p) => {
        p.x += p.speedX
        p.y += p.speedY
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.fill()
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf)
    }
  }, [])

  // Visible log feed.
  const visibleLogs = useMemo(() => logs.slice(-60), [logs])
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [visibleLogs.length])

  const latestInsight = useMemo(() => {
    const info = [...logs].reverse().find((l) => l.level !== 'error')
    return info?.message || 'Booting the autonomous AI organization...'
  }, [logs])

  const visualState = (id: string): VisualState => toVisual(nodes[id]?.status)
  const nodeStatusText = (id: string): string => {
    const v = visualState(id)
    if (v === 'complete') return 'Complete'
    if (v === 'active') return 'Working…'
    return 'Awaiting…'
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#050816] text-[#f8fafc] font-sans flex flex-col justify-between overflow-hidden select-none">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[130px] pointer-events-none animate-pulse-slow" />

      {/* Header */}
      <div className="w-full px-8 py-6 flex items-center justify-between border-b border-white/5 bg-black/10 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 rounded-xl flex items-center justify-center p-[1px] animate-spin-slow">
            <div className="w-full h-full bg-[#050816] rounded-xl flex items-center justify-center">
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider uppercase text-foreground">
              Devflow Autonomous Planning Engine
            </h1>
            <p className="text-[10px] text-muted-foreground font-mono">
              VER_1.0 // {completed ? 'ORCHESTRATION_COMPLETE' : failed ? 'DEGRADED' : 'ACTIVE_ORCHESTRATION'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-cyan-400">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>Telemetry online</span>
          </div>
          <span className="text-muted-foreground">Elapsed: {(elapsedTime / 1000).toFixed(1)}s</span>
        </div>
      </div>

      {/* Graph + telemetry */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 relative z-10 max-w-7xl mx-auto w-full h-[calc(100vh-180px)] overflow-hidden">
        <div className="lg:col-span-8 bg-black/20 border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center h-full">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.03),transparent_60%)] pointer-events-none" />

          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minHeight: '100%' }}>
            <defs>
              <linearGradient id="cyan-purple" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {CONNECTIONS.map((conn, idx) => {
              const fromNode = AGENT_NODES.find((n) => n.id === conn.from)
              const toNode = AGENT_NODES.find((n) => n.id === conn.to)
              if (!fromNode || !toNode) return null
              const isSourceActive = visualState(conn.from) !== 'idle'
              const isFlowing = visualState(conn.from) === 'complete' && visualState(conn.to) !== 'idle'
              return (
                <g key={idx}>
                  <line x1={`${fromNode.x}%`} y1={`${fromNode.y}%`} x2={`${toNode.x}%`} y2={`${toNode.y}%`} stroke="#1e293b" strokeWidth="1.5" strokeDasharray="4 4" />
                  {isSourceActive && (
                    <motion.line
                      x1={`${fromNode.x}%`} y1={`${fromNode.y}%`} x2={`${toNode.x}%`} y2={`${toNode.y}%`}
                      stroke="url(#cyan-purple)" strokeWidth="2" filter="url(#glow)"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeInOut' }}
                    />
                  )}
                  {isFlowing && (
                    <motion.line
                      x1={`${fromNode.x}%`} y1={`${fromNode.y}%`} x2={`${toNode.x}%`} y2={`${toNode.y}%`}
                      stroke="#22d3ee" strokeWidth="3" strokeDasharray="6 30" filter="url(#glow)"
                      animate={{ strokeDashoffset: [100, 0] }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    />
                  )}
                </g>
              )
            })}
          </svg>

          {AGENT_NODES.map((node) => {
            const v = visualState(node.id)
            const isActive = v === 'active'
            const isCompleted = v === 'complete'
            return (
              <div key={node.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: `${node.x}%`, top: `${node.y}%` }}>
                <div className="relative">
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        className="absolute inset-[-8px] rounded-full border border-cyan-500/50"
                        style={{ boxShadow: '0 0 15px rgba(34, 211, 238, 0.4)' }}
                        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        layoutId={`glow-${node.id}`}
                      />
                    )}
                  </AnimatePresence>
                  <motion.div
                    className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-500 backdrop-blur-xl relative z-10 ${
                      isActive
                        ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                        : isCompleted
                        ? 'bg-purple-500/10 border-purple-500 text-purple-400'
                        : 'bg-slate-950/80 border-white/5 text-slate-500'
                    }`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {isActive && (
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="24" cy="24" r="22" fill="transparent" stroke="#22d3ee" strokeWidth="2"
                          strokeDasharray={2 * Math.PI * 22}
                          strokeDashoffset={2 * Math.PI * 22 * (1 - (elapsedTime % 3000) / 3000)} />
                      </svg>
                    )}
                    {isCompleted ? <CheckCircle2 className="w-5 h-5 text-purple-400" /> : node.icon}
                  </motion.div>
                </div>
                <span className={`text-[11px] font-semibold mt-2.5 transition-colors duration-300 ${isActive ? 'text-cyan-400' : isCompleted ? 'text-purple-300' : 'text-muted-foreground'}`}>
                  {node.label}
                </span>
                <span className="text-[9px] font-mono text-muted-foreground mt-0.5 max-w-[100px] text-center overflow-hidden whitespace-nowrap text-ellipsis">
                  {isActive && <span className="inline-block w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping mr-1" />}
                  {nodeStatusText(node.id)}
                </span>
              </div>
            )
          })}

          <motion.div
            className="absolute left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent pointer-events-none filter blur-[1px]"
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
          />
        </div>

        {/* Telemetry + insight + log */}
        <div className="lg:col-span-4 flex flex-col gap-5 h-full overflow-hidden">
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Consensus Telemetry
            </h3>
            <div className="space-y-3.5 font-mono text-xs">
              <Meter label="PLANNING FIDELITY" value={fidelity} barClass="bg-cyan-500" valueClass="text-cyan-400" />
              <Meter label="RISK INTEGRITY" value={riskIndex}
                barClass={riskIndex < 30 ? 'bg-emerald-500' : 'bg-yellow-500'}
                valueClass={riskIndex < 30 ? 'text-emerald-400' : 'text-yellow-400'}
                suffix={riskIndex < 30 ? ' (LOW)' : ' (EVALUATING)'} />
              <Meter label="AGENT SYNERGY INDEX" value={synergy} barClass="bg-purple-500" valueClass="text-purple-400" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex-1 flex flex-col justify-between overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BrainCircuit className="w-4 h-4 text-purple-400" />
                Live AI Insight
              </h3>
              <div className="text-[12px] text-foreground leading-relaxed font-mono min-h-24 bg-black/30 border border-white/5 rounded-xl p-3.5">
                {latestInsight}
                {!completed && !failed && <span className="inline-block w-1.5 h-3.5 bg-cyan-400 ml-1 animate-pulse" />}
              </div>
            </div>
            <div className="text-[9px] text-muted-foreground font-mono flex items-center gap-1.5 mt-2 bg-white/5 border border-white/5 rounded-lg px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
              <span>{error ? 'Recovering from a degraded agent…' : 'Streaming agent reasoning…'}</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/5 h-48 flex flex-col overflow-hidden">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-glow" />
              Planning Stream Log
            </h3>
            <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[10px] text-slate-300 pr-1 custom-scrollbar">
              {visibleLogs.length === 0 && <div className="text-slate-500">&gt; Awaiting first agent…</div>}
              {visibleLogs.map((log, idx) => (
                <div key={idx} className={`transition-all duration-300 ${log.level === 'error' ? 'text-red-400' : 'text-slate-300'}`}>
                  <span className="text-slate-500 select-none mr-1.5">&gt;</span>
                  {log.message}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full px-8 py-6 border-t border-white/5 bg-black/10 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-2/3">
            <span className="text-xs font-bold tracking-widest font-mono text-cyan-400 whitespace-nowrap">PLAN COMPILATION</span>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden relative">
              <motion.div className="bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 h-full rounded-full"
                animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
            </div>
            <span className="text-xs font-bold font-mono text-foreground w-12 text-right">{Math.floor(progress)}%</span>
          </div>
          <div className="text-xs font-mono text-muted-foreground text-center sm:text-right w-full sm:w-auto">
            {completed ? (
              <span className="text-purple-400 font-bold animate-pulse">Orchestration complete. Provisioning workspace…</span>
            ) : failed ? (
              <span className="text-red-400 font-bold">Run degraded — opening available results…</span>
            ) : (
              <span>Orchestrating agents dynamically…</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Meter({
  label,
  value,
  barClass,
  valueClass,
  suffix = '',
}: {
  label: string
  value: number
  barClass: string
  valueClass: string
  suffix?: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className={`${valueClass} font-bold`}>
          {value}%{suffix}
        </span>
      </div>
      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
        <motion.div className={`h-full ${barClass}`} animate={{ width: `${value}%` }} transition={{ ease: 'easeOut', duration: 0.5 }} />
      </div>
    </div>
  )
}
