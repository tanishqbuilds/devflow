'use client'

import { WorkspaceAuthGate } from '@/components/auth/workspace-auth-gate'
import { ProjectsHub } from '@/components/account/projects-hub'

export default function ProjectsPage() {
  return (
    <WorkspaceAuthGate>
      <ProjectsHub />
    </WorkspaceAuthGate>
  )
}
