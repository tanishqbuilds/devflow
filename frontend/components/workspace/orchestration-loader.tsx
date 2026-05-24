'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { 
  Lightbulb, 
  Search, 
  Network, 
  CalendarDays, 
  ShieldAlert, 
  DollarSign, 
  Play, 
  BrainCircuit,
  CheckCircle2,
  TrendingUp,
  Activity,
  Cpu
} from 'lucide-react'

// Nodes definition with position in percentage coordinates
const AGENT_NODES = [
  { id: 'idea', label: 'Idea Intake Agent', icon: <Lightbulb />, x: 8, y: 50, color: '#22d3ee' },
  { id: 'requirements', label: 'Requirement Analyzer', icon: <Search />, x: 24, y: 50, color: '#3b82f6' },
  { id: 'architecture', label: 'Architecture Planner', icon: <Network />, x: 42, y: 50, color: '#a855f7' },
  { id: 'sprint', label: 'Sprint AI', icon: <CalendarDays />, x: 62, y: 24, color: '#f43f5e' },
  { id: 'risk', label: 'Risk AI', icon: <ShieldAlert />, x: 62, y: 50, color: '#eab308' },
  { id: 'cost', label: 'Cost Estimator', icon: <DollarSign />, x: 62, y: 76, color: '#10b981' },
  { id: 'execution', label: 'Execution Planner', icon: <Play />, x: 82, y: 50, color: '#ec4899' },
]

// Connections between nodes
const CONNECTIONS = [
  { from: 'idea', to: 'requirements' },
  { from: 'requirements', to: 'architecture' },
  { from: 'architecture', to: 'sprint' },
  { from: 'architecture', to: 'risk' },
  { from: 'architecture', to: 'cost' },
  { from: 'sprint', to: 'execution' },
  { from: 'risk', to: 'execution' },
  { from: 'cost', to: 'execution' },
]

// Log feed events
const LOG_EVENTS = [
  { time: 0.1, text: '[System] Booting orchestration engines...', agent: 'sys' },
  { time: 0.8, text: '[Intake Agent] Ingesting product concept and goals...', agent: 'idea' },
  { time: 1.5, text: '[Intake Agent] Conceptual scope mapped to Web SaaS framework.', agent: 'idea' },
  { time: 2.2, text: '[Requirement Analyzer] Commencing functional decomposition...', agent: 'requirements' },
  { time: 3.0, text: '[Requirement Analyzer] Extracting core entities: Auth, Billing, WebSockets...', agent: 'requirements' },
  { time: 3.8, text: '[Requirement Analyzer] Cross-referencing dependencies between database models.', agent: 'requirements' },
  { time: 4.6, text: '[Architecture Planner] Initializing topology mapping...', agent: 'architecture' },
  { time: 5.4, text: '[Architecture Planner] Selected tech stack: NextJS 16, TailwindCSS, PostgreSQL.', agent: 'architecture' },
  { time: 6.2, text: '[Architecture Planner] Simulating Edge caching and latency optimizations.', agent: 'architecture' },
  { time: 7.0, text: '[Sprint AI] Generating detailed issue backlog...', agent: 'sprint' },
  { time: 7.4, text: '[Risk AI] Running 10,000 Monte Carlo deployment scenarios...', agent: 'risk' },
  { time: 7.8, text: '[Cost Estimator] Fetching global cloud resource estimates...', agent: 'cost' },
  { time: 8.5, text: '[Sprint AI] Calculated velocity & task sizing (Sprint load optimized).', agent: 'sprint' },
  { time: 9.0, text: '[Risk AI] Risk detected: High data locking frequency. Adding retry strategies.', agent: 'risk' },
  { time: 9.5, text: '[Cost Estimator] Estimated database monthly cost: $32.40 (Scales on demand).', agent: 'cost' },
  { time: 10.2, text: '[Execution Planner] Merging sub-plans into unified execution sequence...', agent: 'execution' },
  { time: 11.0, text: '[Execution Planner] Aligning milestones with architectural stages.', agent: 'execution' },
  { time: 11.8, text: '[System] Performing final integrity check and model consensus...', agent: 'sys' },
  { time: 12.5, text: '[System] Consensus reached. Plan synergy at 98.4%.', agent: 'sys' },
  { time: 13.2, text: '[System] Project orchestration successfully compiled. Provisioning workspace.', agent: 'sys' },
]

// Real-time AI insights
const INSIGHTS = [
  'Optimized socket connection pools: Switched real-time components to unified event loop, dropping projected server overhead by 24%.',
  'Architecture mitigation: Added a Redis transaction queue to resolve race conditions on simultaneous document edits.',
  'Estimated infrastructure: Recommended serverless edge execution routes, minimizing cold starts to under 45ms.',
]

export function OrchestrationLoader() {
  const { setOrchestrationRunning } = useAppStore()
  
  // Timer & progress tracking
  const [elapsedTime, setElapsedTime] = useState(0)
  const [globalProgress, setGlobalProgress] = useState(0)
  const [completed, setCompleted] = useState(false)
  
  // Node states: 'idle' | 'active' | 'complete'
  const [nodeStates, setNodeStates] = useState<Record<string, 'idle' | 'active' | 'complete'>>({
    idea: 'idle',
    requirements: 'idle',
    architecture: 'idle',
    sprint: 'idle',
    risk: 'idle',
    cost: 'idle',
    execution: 'idle',
  })

  const [nodeStatuses, setNodeStatuses] = useState<Record<string, string>>({
    idea: 'Awaiting...',
    requirements: 'Awaiting...',
    architecture: 'Awaiting...',
    sprint: 'Awaiting...',
    risk: 'Awaiting...',
    cost: 'Awaiting...',
    execution: 'Awaiting...',
  })

  // Dynamic telemetry scores
  const [fidelity, setFidelity] = useState(64)
  const [riskIndex, setRiskIndex] = useState(82)
  const [synergy, setSynergy] = useState(55)

  // Insights sliding indices
  const [currentInsightIdx, setCurrentInsightIdx] = useState(0)
  const [insightText, setInsightText] = useState('')
  const [insightCharIdx, setInsightCharIdx] = useState(0)

  // Particles canvas reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Total Duration: 14.5 seconds
  const totalDuration = 14500

  // Particle Effect loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    const particles: Array<{
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      alpha: number
      color: string
    }> = []

    // Populate stars
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: (Math.random() - 0.5) * 0.15,
        alpha: Math.random() * 0.5 + 0.2,
        color: Math.random() > 0.5 ? '#22d3ee' : '#a855f7',
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      particles.forEach((p) => {
        p.x += p.speedX
        p.y += p.speedY

        // Wrap boundaries
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
      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  // Core orchestration timeline clock
  useEffect(() => {
    const startTime = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      setElapsedTime(elapsed)
      
      const progress = Math.min((elapsed / totalDuration) * 100, 100)
      setGlobalProgress(progress)

      if (elapsed >= totalDuration) {
        clearInterval(timer)
        setCompleted(true)
        // Auto transition out after completion
        setTimeout(() => {
          setOrchestrationRunning(false)
        }, 1500)
      }
    }, 50)

    return () => clearInterval(timer)
  }, [setOrchestrationRunning])

  // Map progress to agent statuses
  useEffect(() => {
    const timeSec = elapsedTime / 1000

    // Idea Intake Agent: 0s - 2.5s
    if (timeSec >= 0 && timeSec < 2.5) {
      setNodeStates(prev => ({ ...prev, idea: 'active' }))
      setNodeStatuses(prev => ({
        ...prev,
        idea: timeSec < 1.2 ? 'Thinking...' : 'Mapping Scope...',
      }))
    } else if (timeSec >= 2.5) {
      setNodeStates(prev => ({ ...prev, idea: 'complete' }))
      setNodeStatuses(prev => ({ ...prev, idea: 'Complete' }))
    }

    // Requirements Agent: 2.5s - 5s
    if (timeSec >= 2.5 && timeSec < 5.0) {
      setNodeStates(prev => ({ ...prev, requirements: 'active' }))
      setNodeStatuses(prev => ({
        ...prev,
        requirements: timeSec < 3.8 ? 'Analyzing dependencies...' : 'Resolving paths...',
      }))
    } else if (timeSec >= 5.0) {
      setNodeStates(prev => ({ ...prev, requirements: 'complete' }))
      setNodeStatuses(prev => ({ ...prev, requirements: 'Complete' }))
    }

    // Architecture Agent: 5s - 7.5s
    if (timeSec >= 5.0 && timeSec < 7.5) {
      setNodeStates(prev => ({ ...prev, architecture: 'active' }))
      setNodeStatuses(prev => ({
        ...prev,
        architecture: timeSec < 6.2 ? 'Optimizing topology...' : 'Verifying scale...',
      }))
    } else if (timeSec >= 7.5) {
      setNodeStates(prev => ({ ...prev, architecture: 'complete' }))
      setNodeStatuses(prev => ({ ...prev, architecture: 'Complete' }))
    }

    // Parallel Sprint, Risk, and Cost: 7.5s - 10.5s
    if (timeSec >= 7.5 && timeSec < 10.5) {
      setNodeStates(prev => ({
        ...prev,
        sprint: 'active',
        risk: 'active',
        cost: 'active',
      }))
      setNodeStatuses(prev => ({
        ...prev,
        sprint: 'Generating backlog...',
        risk: 'Calculating risks...',
        cost: 'Estimating budgets...',
      }))
    } else if (timeSec >= 10.5) {
      setNodeStates(prev => ({
        ...prev,
        sprint: 'complete',
        risk: 'complete',
        cost: 'complete',
      }))
      setNodeStatuses(prev => ({
        ...prev,
        sprint: 'Complete',
        risk: 'Complete',
        cost: 'Complete',
      }))
    }

    // Execution Agent: 10.5s - 13s
    if (timeSec >= 10.5 && timeSec < 13.0) {
      setNodeStates(prev => ({ ...prev, execution: 'active' }))
      setNodeStatuses(prev => ({
        ...prev,
        execution: 'Creating roadmap...',
      }))
    } else if (timeSec >= 13.0) {
      setNodeStates(prev => ({ ...prev, execution: 'complete' }))
      setNodeStatuses(prev => ({ ...prev, execution: 'Complete' }))
    }

    // Telemetry updates
    if (timeSec > 0.5) {
      setFidelity(Math.min(64 + Math.floor(timeSec * 2.5), 98))
      setRiskIndex(Math.max(82 - Math.floor(timeSec * 5.2), 12))
      setSynergy(Math.min(55 + Math.floor(timeSec * 3.3), 99))
    }
  }, [elapsedTime])

  // Typewriter effect for insights
  useEffect(() => {
    const timeSec = elapsedTime / 1000
    let insightIdx = 0

    if (timeSec >= 4 && timeSec < 8.5) {
      insightIdx = 1
    } else if (timeSec >= 8.5) {
      insightIdx = 2
    }

    if (insightIdx !== currentInsightIdx) {
      setCurrentInsightIdx(insightIdx)
      setInsightText('')
      setInsightCharIdx(0)
    }
  }, [elapsedTime, currentInsightIdx])

  useEffect(() => {
    const currentInsight = INSIGHTS[currentInsightIdx]
    if (insightCharIdx < currentInsight.length) {
      const typeTimer = setTimeout(() => {
        setInsightText(prev => prev + currentInsight[insightCharIdx])
        setInsightCharIdx(prev => prev + 1)
      }, 15)
      return () => clearTimeout(typeTimer)
    }
  }, [insightCharIdx, currentInsightIdx])

  // Filter logs visible at this elapsed time
  const visibleLogs = LOG_EVENTS.filter((e) => elapsedTime >= e.time * 1000)

  // Scroll to bottom of terminal log container
  const terminalEndRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [visibleLogs.length])

  return (
    <div className="fixed inset-0 z-50 bg-[#050816] text-[#f8fafc] font-sans flex flex-col justify-between overflow-hidden select-none">
      {/* Background Star Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Radial Cinematic Glows */}
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[130px] pointer-events-none animate-pulse-slow" />

      {/* Top Header */}
      <div className="w-full px-8 py-6 flex items-center justify-between border-b border-white/5 bg-black/10 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 rounded-xl flex items-center justify-center p-[1px] animate-spin-slow">
            <div className="w-full h-full bg-[#050816] rounded-xl flex items-center justify-center">
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider uppercase text-foreground">
              Autonomous AI Planning Engine
            </h1>
            <p className="text-[10px] text-muted-foreground font-mono">
              VER_0.98 // ACTIVE_ORCHESTRATION
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

      {/* Main Orchestration Flow Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 relative z-10 max-w-7xl mx-auto w-full h-[calc(100vh-180px)] overflow-hidden">
        {/* Left Side: Graph Orchestration Visualization */}
        <div className="lg:col-span-8 bg-black/20 border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center h-full">
          {/* Subtle grid backdrop inside graph */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.03),transparent_60%)] pointer-events-none" />

          {/* SVG Connection Lines */}
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

              // Calculate start and end coordinates based on percentages
              const startX = `${fromNode.x}%`
              const startY = `${fromNode.y}%`
              const endX = `${toNode.x}%`
              const endY = `${toNode.y}%`

              // Connection active state if the fromNode is complete/active
              const isSourceActive = nodeStates[conn.from] !== 'idle'
              const isFlowing = nodeStates[conn.from] === 'complete' && nodeStates[conn.to] !== 'idle'

              return (
                <g key={idx}>
                  {/* Backdrop connection line */}
                  <line
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke="#1e293b"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  {/* Glow active connection line */}
                  {isSourceActive && (
                    <motion.line
                      x1={startX}
                      y1={startY}
                      x2={endX}
                      y2={endY}
                      stroke="url(#cyan-purple)"
                      strokeWidth="2"
                      filter="url(#glow)"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, ease: 'easeInOut' }}
                    />
                  )}
                  {/* Flowing particle stream */}
                  {isFlowing && (
                    <motion.line
                      x1={startX}
                      y1={startY}
                      x2={endX}
                      y2={endY}
                      stroke="#22d3ee"
                      strokeWidth="3"
                      strokeDasharray="6 30"
                      animate={{ strokeDashoffset: [100, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                      filter="url(#glow)"
                    />
                  )}
                </g>
              )
            })}
          </svg>

          {/* Render Nodes */}
          {AGENT_NODES.map((node) => {
            const state = nodeStates[node.id]
            const status = nodeStatuses[node.id]
            
            // Animation values based on node states
            const isActive = state === 'active'
            const isCompleted = state === 'complete'

            return (
              <div
                key={node.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
              >
                {/* Glow ring */}
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

                  {/* Core Circle */}
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
                    {/* Circle loader overlay */}
                    {isActive && (
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                          cx="24"
                          cy="24"
                          r="22"
                          fill="transparent"
                          stroke="#22d3ee"
                          strokeWidth="2"
                          strokeDasharray={2 * Math.PI * 22}
                          strokeDashoffset={2 * Math.PI * 22 * (1 - (elapsedTime % 3000) / 3000)}
                        />
                      </svg>
                    )}
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-purple-400 animate-bounce-short" />
                    ) : (
                      node.icon
                    )}
                  </motion.div>
                </div>

                {/* Node Label */}
                <span className={`text-[11px] font-semibold mt-2.5 transition-colors duration-300 ${
                  isActive ? 'text-cyan-400' : isCompleted ? 'text-purple-300' : 'text-muted-foreground'
                }`}>
                  {node.label}
                </span>

                {/* Node Status Info */}
                <span className="text-[9px] font-mono text-muted-foreground mt-0.5 max-w-[90px] text-center overflow-hidden whitespace-nowrap text-ellipsis">
                  {isActive && <span className="inline-block w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping mr-1" />}
                  {status}
                </span>
              </div>
            )
          })}

          {/* Dependency Scanning Bar Animation */}
          <motion.div 
            className="absolute left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent pointer-events-none filter blur-[1px]"
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
          />
        </div>

        {/* Right Side: Side Control & Telemetry Panel */}
        <div className="lg:col-span-4 flex flex-col gap-5 h-full overflow-hidden">
          
          {/* Telemetry Metrics */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Consensus Telemetry
            </h3>
            
            <div className="space-y-3.5 font-mono text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">PLANNING FIDELITY</span>
                  <span className="text-cyan-400 font-bold">{fidelity}%</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    className="bg-cyan-500 h-full"
                    animate={{ width: `${fidelity}%` }}
                    transition={{ ease: 'easeOut', duration: 0.5 }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">RISK INTEGRITY</span>
                  <span className={`${riskIndex < 30 ? 'text-emerald-400' : 'text-yellow-400'} font-bold`}>
                    {riskIndex}% {riskIndex < 30 ? '(LOW)' : '(EVALUATING)'}
                  </span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${riskIndex < 30 ? 'bg-emerald-500' : 'bg-yellow-500'}`}
                    animate={{ width: `${riskIndex}%` }}
                    transition={{ ease: 'easeOut', duration: 0.5 }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">AGENT SYNERGY INDEX</span>
                  <span className="text-purple-400 font-bold">{synergy}%</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    className="bg-purple-500 h-full"
                    animate={{ width: `${synergy}%` }}
                    transition={{ ease: 'easeOut', duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights Typing Feed */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex-1 flex flex-col justify-between overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BrainCircuit className="w-4 h-4 text-purple-400" />
                Live AI Insight
              </h3>
              
              <div className="text-[12px] text-foreground leading-relaxed font-mono min-h-24 bg-black/30 border border-white/5 rounded-xl p-3.5">
                {insightText}
                {insightCharIdx < INSIGHTS[currentInsightIdx].length && (
                  <span className="inline-block w-1.5 h-3.5 bg-cyan-400 ml-1 animate-pulse" />
                )}
              </div>
            </div>

            <div className="text-[9px] text-muted-foreground font-mono flex items-center gap-1.5 mt-2 bg-white/5 border border-white/5 rounded-lg px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
              <span>Context engine routing optimization logs</span>
            </div>
          </div>

          {/* Live Timeline Terminal Log Feed */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 h-48 flex flex-col overflow-hidden">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-glow" />
              Planning Stream Log
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[10px] text-slate-300 pr-1 custom-scrollbar">
              {visibleLogs.map((log, idx) => (
                <div 
                  key={idx} 
                  className={`transition-all duration-300 ${
                    log.agent === 'sys' 
                      ? 'text-cyan-400' 
                      : log.agent === 'execution'
                      ? 'text-pink-400'
                      : 'text-slate-300'
                  }`}
                >
                  <span className="text-slate-500 select-none mr-1.5">&gt;</span>
                  {log.text}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Footer Progress Bar */}
      <div className="w-full px-8 py-6 border-t border-white/5 bg-black/10 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-2/3">
            <span className="text-xs font-bold tracking-widest font-mono text-cyan-400 whitespace-nowrap">
              PLAN COMPILATION
            </span>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden relative">
              <motion.div
                className="bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 h-full rounded-full"
                animate={{ width: `${globalProgress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <span className="text-xs font-bold font-mono text-foreground w-12 text-right">
              {Math.floor(globalProgress)}%
            </span>
          </div>

          <div className="text-xs font-mono text-muted-foreground text-center sm:text-right w-full sm:w-auto">
            {completed ? (
              <span className="text-purple-400 font-bold animate-pulse">
                System Orchestrated. Syncing workspace...
              </span>
            ) : (
              <span>Orchestrating agents dynamically...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
