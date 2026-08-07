import { MainLayout } from '@/components/layout/main-layout'
import { WorkspaceAuthGate } from '@/components/auth/workspace-auth-gate'

export default function MyTasksLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <WorkspaceAuthGate><MainLayout>{children}</MainLayout></WorkspaceAuthGate>
}
