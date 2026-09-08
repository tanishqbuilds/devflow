'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LandingPageContent } from '@/components/landing/page-content'
import { useAppUser } from '@/lib/auth-context'

export function HomePortal() {
  const { isLoaded, isSignedIn } = useAppUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/my-projects')
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded || isSignedIn) {
    return <div className="min-h-screen bg-background" />
  }

  return <LandingPageContent />
}

