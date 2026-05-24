'use client'

import { ReactFlow, Background, Controls, MiniMap, Node, Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { useCallback, useMemo } from 'react'
import { OrchestrationNode } from './orchestration-node'
import { useOrchestrationNodes } from '@/hooks/use-orchestration-nodes'

export function OrchestrationView() {
  const { activeOrchestrationNode, setActiveOrchestrationNode } = useAppStore()
  const { nodes: nodesData, edges: edgesData } = useOrchestrationNodes()

  const nodes: Node[] = useMemo(() => 
    nodesData.map(node => ({
      id: node.id,
      data: {
        label: node.label,
        iconType: node.iconType,
        status: node.status,
        progress: node.progress,
      },
      position: node.position,
      type: 'orchestrationNode',
    })), 
    [nodesData]
  )

  const edges: Edge[] = useMemo(() =>
    edgesData.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: edge.animated,
    })),
    [edgesData]
  )

  const nodeTypes = useMemo(() => ({
    orchestrationNode: OrchestrationNode,
  }), [])

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setActiveOrchestrationNode(node.id as any)
  }, [setActiveOrchestrationNode])

  return (
    <motion.div
      className="h-[calc(100vh-120px)] rounded-2xl overflow-hidden glass-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
      >
        <Background color="#94a3b8" gap={16} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </motion.div>
  )
}
