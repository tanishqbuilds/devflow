'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ReactFlow, Background, Controls, type Node, type Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Layout, Server, Database, Cloud, Lightbulb, TrendingUp } from 'lucide-react'
import { useProjectStore } from '@/lib/project-store'
import { GeneratingPanel } from './overview-view'
import type { ArchitectureLayer } from '@/lib/project-types'

const LAYER_META: { key: string; label: string; icon: any; color: string }[] = [
  { key: 'frontend', label: 'Frontend', icon: Layout, color: '#22d3ee' },
  { key: 'backend', label: 'Backend', icon: Server, color: '#a855f7' },
  { key: 'database', label: 'Database', icon: Database, color: '#10b981' },
  { key: 'infrastructure', label: 'Infrastructure', icon: Cloud, color: '#f59e0b' },
]
const GROUP_X: Record<string, number> = { frontend: 20, backend: 280, database: 540, infrastructure: 800 }
const GROUP_COLOR: Record<string, string> = { frontend: '#22d3ee', backend: '#a855f7', database: '#10b981', infrastructure: '#f59e0b' }

export function ArchitectureView() {
  const project = useProjectStore((s) => s.project)
  const arch = project?.architecture || null

  const { nodes, edges } = useMemo(() => {
    const diagram = arch?.diagram
    if (!diagram) return { nodes: [] as Node[], edges: [] as Edge[] }
    const counters: Record<string, number> = {}
    const nodes: Node[] = diagram.nodes.map((n) => {
      const idxInGroup = counters[n.group] = (counters[n.group] ?? -1) + 1
      const isLayer = n.kind === 'layer'
      return {
        id: n.id,
        data: { label: n.label },
        position: { x: GROUP_X[n.group] ?? 20, y: idxInGroup * 80 },
        style: {
          background: isLayer ? GROUP_COLOR[n.group] ?? '#334155' : 'rgba(15,20,40,0.9)',
          color: isLayer ? '#050816' : '#e2e8f0',
          border: `1px solid ${GROUP_COLOR[n.group] ?? '#334155'}`,
          borderRadius: 10,
          fontSize: 11,
          fontWeight: isLayer ? 700 : 500,
          width: 200,
          padding: 8,
        },
      }
    })
    const edges: Edge[] = diagram.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label || undefined,
      animated: !!e.label,
      style: { stroke: '#475569' },
      labelStyle: { fill: '#94a3b8', fontSize: 10 },
    }))
    return { nodes, edges }
  }, [arch])

  if (!arch) {
    return (
      <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-3xl font-bold text-foreground">Architecture</h2>
        <GeneratingPanel label="System architecture" />
      </motion.div>
    )
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <div>
        <h2 className="text-3xl font-bold text-foreground">System Architecture</h2>
        <p className="text-muted-foreground mt-1">Layered design with component diagram</p>
      </div>

      {nodes.length > 0 && (
        <div className="glass-panel rounded-2xl overflow-hidden" style={{ height: 420 }}>
          <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }} nodesDraggable={false} nodesConnectable={false}>
            <Background color="#1e293b" gap={18} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {LAYER_META.map((meta) => {
          const layer = (arch as any)[meta.key] as ArchitectureLayer | undefined
          if (!layer) return null
          const Icon = meta.icon
          return (
            <motion.div key={meta.key} className="glass-panel p-6 rounded-xl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                <Icon className="w-5 h-5" style={{ color: meta.color }} /> {meta.label}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">{layer.summary}</p>
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-1.5">Technologies</p>
                <div className="flex flex-wrap gap-2">
                  {(layer.technologies || []).map((t) => (
                    <span key={t} className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: `${meta.color}22`, color: meta.color }}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-1.5">Components</p>
                <ul className="space-y-1">
                  {(layer.components || []).map((c, i) => (
                    <li key={i} className="text-sm text-foreground/90 flex gap-2"><span style={{ color: meta.color }}>▪</span>{c}</li>
                  ))}
                </ul>
              </div>
              {layer.decisions?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Key Decisions</p>
                  <ul className="space-y-1">
                    {layer.decisions.map((d, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-2"><span>—</span>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-cyan-400" /> Technology Recommendations</h3>
          <ul className="space-y-2">
            {(arch.technology_recommendations || []).map((r, i) => (
              <li key={i} className="text-sm text-foreground/90 flex gap-2"><span className="text-cyan-400">•</span>{r}</li>
            ))}
          </ul>
        </div>
        <div className="glass-panel p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-purple-400" /> Scalability Plan</h3>
          <ul className="space-y-2">
            {(arch.scalability_plan || []).map((r, i) => (
              <li key={i} className="text-sm text-foreground/90 flex gap-2"><span className="text-purple-400">•</span>{r}</li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  )
}
