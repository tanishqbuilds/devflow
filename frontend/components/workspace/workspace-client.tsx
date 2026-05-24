'use client'

import { useAppStore } from '@/lib/store'
import { OverviewView } from './overview-view'
import { OrchestrationView } from './orchestration-view'
import { RequirementsView } from './requirements-view'
import { BacklogView } from './backlog-view'
import { RiskView } from './risk-view'
import { TeamView } from './team-view'
import { CostView } from './cost-view'
import { MilestonesView } from './milestones-view'
import { OrchestrationLoader } from './orchestration-loader'
import { useEffect, useMemo, useRef } from 'react'
import { useSearchParams as useSearchParamsHook } from 'next/navigation'

export function WorkspaceClient() {
  const { 
    activeWorkspaceMode, 
    setProjectTitle, 
    setProjectDescription,
    orchestrationRunning,
    setOrchestrationRunning
  } = useAppStore()
  
  const hasOrchestrated = useRef(false)
  let searchParams: URLSearchParams | null = null
  try {
    searchParams = useSearchParamsHook()
  } catch (e) {
    // Handle cases where useSearchParams might not be available
  }

  useEffect(() => {
    if (searchParams) {
      const idea = searchParams.get('idea')
      if (idea && !hasOrchestrated.current) {
        hasOrchestrated.current = true
        setProjectTitle(idea)
        setProjectDescription('AI-powered project planning and execution')
        setOrchestrationRunning(true)
      }
    }
  }, [searchParams, setProjectTitle, setProjectDescription, setOrchestrationRunning])

  return (
    <div>
      {orchestrationRunning && <OrchestrationLoader />}
      
      {/* Render content based on active workspace mode */}
      {activeWorkspaceMode === 'overview' && <OverviewView />}
      {activeWorkspaceMode === 'architecture' && <OrchestrationView />}
      {activeWorkspaceMode === 'requirements' && <RequirementsView />}
      {activeWorkspaceMode === 'backlog' && <BacklogView />}
      {activeWorkspaceMode === 'risks' && <RiskView />}
      {activeWorkspaceMode === 'team' && <TeamView />}
      {activeWorkspaceMode === 'cost' && <CostView />}
      {(activeWorkspaceMode === 'milestones' || activeWorkspaceMode === 'sprint') && <MilestonesView />}
    </div>
  )
}
