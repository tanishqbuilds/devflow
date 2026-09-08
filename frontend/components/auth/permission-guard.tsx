'use client'

import { useAppUser } from '@/lib/auth-context'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { getProjectMembers } from '@/lib/api'

// ---------------------------------------------------------------------------
// Project-role context — populated by ProjectRoleProvider in workspace views
// ---------------------------------------------------------------------------

interface ProjectRoleContextValue {
  projectRole: 'manager' | 'developer' | 'tester' | null
  setProjectRole: (role: 'manager' | 'developer' | 'tester' | null) => void
}

const ProjectRoleContext = createContext<ProjectRoleContextValue>({
  projectRole: null,
  setProjectRole: () => {},
})

export function ProjectRoleProvider({
  children,
  projectId,
}: {
  children: ReactNode
  projectId?: string | null
}) {
  const [projectRole, setProjectRole] = useState<'manager' | 'developer' | 'tester' | null>(null)

  useEffect(() => {
    if (!projectId) {
      setProjectRole(null)
      return
    }
    getProjectMembers(projectId)
      .then((res) => setProjectRole((res.role as any) ?? null))
      .catch(() => setProjectRole(null))
  }, [projectId])

  return (
    <ProjectRoleContext.Provider value={{ projectRole, setProjectRole }}>
      {children}
    </ProjectRoleContext.Provider>
  )
}

/** Returns the current user's role on the active project (from ProjectRoleContext). */
export function useProjectRole() {
  return useContext(ProjectRoleContext).projectRole
}

// ---------------------------------------------------------------------------
// PermissionGuard
// ---------------------------------------------------------------------------

interface PermissionGuardProps {
  children: ReactNode
  /** Check against global user.role */
  roles?: ('manager' | 'developer' | 'tester')[]
  /** Check against the current project-level role (from ProjectRoleContext) */
  projectRoles?: ('manager' | 'developer' | 'tester')[]
  /** Content to render when permission is denied. Defaults to null (hidden). */
  fallback?: ReactNode
}

/**
 * Conditionally renders children based on the user's role.
 *
 * - `roles` — checks the user's **global** role (from auth-context)
 * - `projectRoles` — checks the user's **project-level** role (from ProjectRoleContext)
 *
 * Both conditions are ANDed together when both are provided.
 */
export function PermissionGuard({
  children,
  roles,
  projectRoles,
  fallback = null,
}: PermissionGuardProps) {
  const { user, isLoaded } = useAppUser()
  const { projectRole } = useContext(ProjectRoleContext)

  if (!isLoaded) return null

  if (!user) return <>{fallback}</>

  // Check global role
  if (roles && roles.length > 0) {
    if (!user.role || !roles.includes(user.role as any)) {
      return <>{fallback}</>
    }
  }

  // Check project-level role
  if (projectRoles && projectRoles.length > 0) {
    if (!projectRole || !projectRoles.includes(projectRole)) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}
