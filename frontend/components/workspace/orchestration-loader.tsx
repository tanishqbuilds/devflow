'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProjectStore } from '@/lib/project-store'
import {
  Lightbulb,
  Search,
  Network,
  ListChecks,
  ShieldAlert,
  DollarSign,
  CalendarRange,
  Plug,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight,
  Terminal,
} from 'lucide-react'

interface StageGroup {
  id: string
  title: string
  description: string
  nodeIds: string[]
}

const STAGES: StageGroup[] = [
  {
    id: 'stage-1',
    title: 'Product Vision',
    description: 'CEO Agent distills business model & value proposition',
    nodeIds: ['idea'],
  },
  {
    id: 'stage-2',
    title: 'Requirements & Scope',
    description: 'PM Agent defines user journeys & functional scope',
    nodeIds: ['requirements'],
  },
  {
    id: 'stage-3',
    title: 'System Architecture',
    description: 'Architect Agent designs data models, APIs & stack',
    nodeIds: ['architecture'],
  },
  {
    id: 'stage-4',
    title: 'Delivery & Risk Planning',
    description: 'Sprint Planner, Risk Analyst & VP Engineering',
    nodeIds: ['tasks', 'risk', 'cost', 'sprint'],
  },
  {
    id: 'stage-5',
    title: 'Roadmap & Integration',
    description: 'Timeline milestones & DevOps CI/CD blueprints',
    nodeIds: ['execution'],
  },
]

const AGENT_INFO: Record<string, { name: string; role: string; icon: any }> = {
  idea: { name: 'CEO Agent', role: 'Chief Vision Officer', icon: Lightbulb },
  requirements: { name: 'Product Manager Agent', role: 'Senior Product Manager', icon: Search },
  architecture: { name: 'System Architect Agent', role: 'Principal Architect', icon: Network },
  tasks: { name: 'Sprint Planner Agent', role: 'Agile Delivery Lead', icon: ListChecks },
  risk: { name: 'Risk Analyst Agent', role: 'Risk & Security Analyst', icon: ShieldAlert },
  cost: { name: 'Team Allocation Agent', role: 'VP of Engineering', icon: DollarSign },
  sprint: { name: 'Sprint Board', role: 'Agile Delivery Lead', icon: ListChecks },
  execution: { name: 'Timeline & Integration', role: 'Delivery & DevOps', icon: Plug },
}

export function OrchestrationLoader() {
  const nodes = useProjectStore((s) => s.nodes)
  const logs = useProjectStore((s) => s.logs)
  const progress = useProjectStore((s) => s.progress)
  const status = useProjectStore((s) => s.status)
  const error = useProjectStore((s) => s.error)

  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const logsEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // Determine active node and stage
  const activeNodeEntry = Object.entries(nodes).find(
    ([_, n]) => n.status === 'thinking' || n.status === 'analyzing' || n.status === 'generating'
  )
  const activeNodeId = activeNodeEntry ? activeNodeEntry[0] : null
  const activeAgent = activeNodeId ? AGENT_INFO[activeNodeId] || { name: 'Specialist Agent', role: 'Processing', icon: Layers } : null

  // Completed count
  const completedNodesCount = Object.values(nodes).filter((n) => n.status === 'complete').length
  const totalNodesCount = Math.max(8, Object.keys(nodes).length)

  return (
    <div className="min-h-[82vh] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      {/* Header card */}
      <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold tracking-wide mb-3">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Autonomous AI Organization in Progress
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Generating Complete Software Delivery Plan
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              8 specialist agents are collaborating, cross-validating requirements, and compiling production specifications.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-slate-50 border border-slate-200/80 rounded-xl px-5 py-3.5 self-start sm:self-auto">
            <div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Progress</div>
              <div className="text-2xl font-bold text-slate-900">{progress}%</div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" /> Elapsed
              </div>
              <div className="text-sm font-semibold text-slate-700 mt-1">
                {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s
              </div>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Orchestration Pipeline</span>
            <span>{completedNodesCount} of {totalNodesCount} Agent Deliverables Complete</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
            <motion.div
              className="h-full bg-blue-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(5, progress)}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Pipeline Stepper + Live Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        {/* Left column: 5-Stage Stepper */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Execution Stages
          </h2>

          <div className="space-y-4">
            {STAGES.map((stage, idx) => {
              const stageNodes = stage.nodeIds.map((id) => nodes[id])
              const isStageComplete = stageNodes.length > 0 && stageNodes.every((n) => n?.status === 'complete')
              const isStageActive = stageNodes.some(
                (n) => n?.status === 'thinking' || n?.status === 'analyzing' || n?.status === 'generating'
              )

              return (
                <div
                  key={stage.id}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    isStageActive
                      ? 'bg-blue-50/50 border-blue-200 shadow-sm'
                      : isStageComplete
                      ? 'bg-slate-50/70 border-slate-200/80'
                      : 'bg-white border-slate-200/60 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5">
                      {isStageComplete ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : isStageActive ? (
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs font-semibold">
                          {idx + 1}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-semibold ${isStageActive ? 'text-blue-950' : 'text-slate-900'}`}>
                          {stage.title}
                        </h3>
                        {isStageComplete && (
                          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Done
                          </span>
                        )}
                        {isStageActive && (
                          <span className="text-[11px] font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-200 animate-pulse">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{stage.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Active Agent Highlight Card */}
          {activeAgent && (
            <div className="mt-6 p-4 rounded-xl bg-slate-900 text-white shadow-md border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <activeAgent.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Currently Reasoning</div>
                  <div className="text-sm font-bold text-white">{activeAgent.name}</div>
                  <div className="text-xs text-blue-300">{activeAgent.role}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-blue-400 bg-blue-950/80 px-3 py-1.5 rounded-lg border border-blue-800">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Calling Groq LLM
              </div>
            </div>
          )}
        </div>

        {/* Right column: Live Activity Feed */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-3">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-700" />
              Live Activity Stream
            </h2>
            <span className="text-xs text-slate-400 font-mono">{logs.length} events</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs font-mono">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
                <Loader2 className="w-6 h-6 animate-spin mb-2 text-slate-300" />
                <p>Waiting for initial agent events...</p>
              </div>
            ) : (
              logs.map((log, i) => {
                const isError = log.level === 'error'
                const isSuccess = log.message.includes('complete') || log.message.includes('✓')

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-2.5 rounded-lg border leading-relaxed ${
                      isError
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : isSuccess
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                        : 'bg-slate-50 border-slate-200/70 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-semibold text-slate-600 uppercase tracking-wide">
                        {log.agent || 'System'}
                      </span>
                      <span>
                        {log.ts ? new Date(log.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div>{log.message}</div>
                  </motion.div>
                )
              })
            )}
            <div ref={logsEndRef} />
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
