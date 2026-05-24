import { useMemo } from 'react'

export interface OrchestrationNodeData {
  id: string
  label: string
  iconType: 'lightbulb' | 'check-circle' | 'zap' | 'list-todo' | 'rocket' | 'alert-triangle' | 'dollar-sign' | 'play-circle'
  status: 'idle' | 'thinking' | 'analyzing' | 'generating' | 'complete'
  progress: number
  position: { x: number; y: number }
}

export interface OrchestrationEdgeData {
  id: string
  source: string
  target: string
  animated: boolean
}

export function useOrchestrationNodes() {
  const nodes = useMemo<OrchestrationNodeData[]>(() => [
    {
      id: 'idea',
      label: 'Idea Intake',
      iconType: 'lightbulb',
      status: 'complete',
      progress: 100,
      position: { x: 0, y: 0 },
    },
    {
      id: 'requirements',
      label: 'Requirements',
      iconType: 'check-circle',
      status: 'idle',
      progress: 0,
      position: { x: 250, y: 0 },
    },
    {
      id: 'architecture',
      label: 'Architecture',
      iconType: 'zap',
      status: 'idle',
      progress: 0,
      position: { x: 500, y: 0 },
    },
    {
      id: 'tasks',
      label: 'Task Gen',
      iconType: 'list-todo',
      status: 'idle',
      progress: 0,
      position: { x: 750, y: 0 },
    },
    {
      id: 'sprint',
      label: 'Sprint Plan',
      iconType: 'rocket',
      status: 'idle',
      progress: 0,
      position: { x: 250, y: 150 },
    },
    {
      id: 'risk',
      label: 'Risk Analysis',
      iconType: 'alert-triangle',
      status: 'idle',
      progress: 0,
      position: { x: 500, y: 150 },
    },
    {
      id: 'cost',
      label: 'Cost Est.',
      iconType: 'dollar-sign',
      status: 'idle',
      progress: 0,
      position: { x: 750, y: 150 },
    },
    {
      id: 'execution',
      label: 'Execution',
      iconType: 'play-circle',
      status: 'idle',
      progress: 0,
      position: { x: 500, y: 300 },
    },
  ], [])

  const edges = useMemo<OrchestrationEdgeData[]>(() => [
    { id: 'e1-r', source: 'idea', target: 'requirements', animated: true },
    { id: 'e2-a', source: 'requirements', target: 'architecture', animated: true },
    { id: 'e3-t', source: 'architecture', target: 'tasks', animated: true },
    { id: 'e4-s', source: 'tasks', target: 'sprint', animated: true },
    { id: 'e5-r', source: 'architecture', target: 'risk', animated: true },
    { id: 'e6-c', source: 'tasks', target: 'cost', animated: true },
    { id: 'e7-e', source: 'sprint', target: 'execution', animated: true },
    { id: 'e8-e2', source: 'risk', target: 'execution', animated: true },
    { id: 'e9-e3', source: 'cost', target: 'execution', animated: true },
  ], [])

  return { nodes, edges }
}
