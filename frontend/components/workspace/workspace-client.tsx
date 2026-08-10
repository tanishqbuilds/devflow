'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { useProjectStore } from '@/lib/project-store'
import { useOrchestrationStream } from '@/lib/use-orchestration-stream'
import { OverviewView } from './overview-view'
import { ArchitectureView } from './architecture-view'
import { RequirementsView } from './requirements-view'
import { BacklogView } from './backlog-view'
import { RiskView } from './risk-view'
import { TeamView } from './team-view'
import { CostView } from './cost-view'
import { MilestonesView } from './milestones-view'
import { IntegrationsView } from './integrations-view'
import { SprintBoardView } from './sprint-board-view'
import { InsightsView } from './insights-view'
import { DocumentationView } from './documentation-view'
import { OrchestrationLoader } from './orchestration-loader'

export function WorkspaceClient() {
  const { activeWorkspaceMode, setActiveWorkspaceMode, setProjectTitle, setProjectDescription } = useAppStore()
  const setProjectId = useProjectStore((s) => s.setProjectId)
  const reset = useProjectStore((s) => s.reset)
  const status = useProjectStore((s) => s.status)
  const project = useProjectStore((s) => s.project)

  const projectId = useSearchParams().get('project')

  useEffect(() => {
    reset()
    setProjectId(projectId)
  }, [projectId, reset, setProjectId])

  useOrchestrationStream(projectId)

  useEffect(() => {
    if (!project) return
    const title = project.executive_summary?.project_title || project.title
    if (title) setProjectTitle(title)
    const desc = project.executive_summary?.tagline || project.executive_summary?.overview || project.idea
    if (desc) setProjectDescription(desc)
  }, [project, setProjectTitle, setProjectDescription])

  const renderView = () => {
    switch (activeWorkspaceMode) {
      case 'track-live':
        return <OrchestrationLoader onDismiss={() => setActiveWorkspaceMode('overview')} />
      case 'overview':
        return <OverviewView />
      case 'insights':
        return <InsightsView />
      case 'documentation':
        return <DocumentationView />
      case 'requirements':
      case 'prerequisites':
        return <RequirementsView />
      case 'architecture':
      case 'tech-stack':
        return <ArchitectureView />
      case 'backlog':
        return <BacklogView />
      case 'sprint':
        return <SprintBoardView />
      case 'risks':
        return <RiskView />
      case 'cost':
        return <CostView />
      case 'team':
        return <TeamView />
      case 'milestones':
      case 'timeline':
        return <MilestonesView />
      case 'integrations':
        return <IntegrationsView />
      default:
        return <OverviewView />
    }
  }

  return (
    <div className="w-full">
      {renderView()}
    </div>
  )
}
