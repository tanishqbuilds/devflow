'use client'

import { LandingPageContent } from '@/components/landing/page-content'
import { useAppUser } from '@/lib/auth-context'

export function HomePortal() {
  const { isLoaded } = useAppUser()

  if (!isLoaded) {
    return <div className="min-h-screen bg-background" />
  }

  return <LandingPageContent />
}

