'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth, useClerk, useUser } from '@clerk/nextjs'
import { setAuthTokenProvider, syncUser } from './api'

interface AppUser {
  id: string
  firstName: string
  lastName: string
  fullName: string
  imageUrl: string
  primaryEmailAddress: { emailAddress: string }
  role?: 'manager' | 'developer'
}

interface AuthContextType {
  isSignedIn: boolean
  isLoaded: boolean
  user: AppUser | null
  signOut: () => Promise<void>
  signIn: () => void
  updateProfile: (firstName: string, lastName: string, email: string) => void
  isClerk: boolean
  getToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | null>(null)

const MOCK_DEMO_USER: AppUser = {
  id: 'user_demo_devflow',
  firstName: 'Demo',
  lastName: 'User',
  fullName: 'Demo User',
  imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  primaryEmailAddress: { emailAddress: 'demo@devflow.ai' },
  role: 'developer',
}

const BYPASS_AUTH = process.env.NEXT_PUBLIC_BYPASS_AUTH !== 'false'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isSignedIn: clerkIsSignedIn, isLoaded: clerkIsLoaded } = useUser()
  const { getToken: clerkGetToken } = useAuth()
  const { signOut, openSignIn } = useClerk()
  const [role, setRole] = useState<'manager' | 'developer'>('developer')

  const isBypassed = BYPASS_AUTH || (!clerkUser && clerkIsLoaded)

  const activeTokenProvider = useCallback(async () => {
    if (clerkIsSignedIn && clerkUser) {
      return clerkGetToken()
    }
    return 'demo-bypass-token'
  }, [clerkIsSignedIn, clerkUser, clerkGetToken])

  useEffect(() => {
    setAuthTokenProvider(activeTokenProvider)
    return () => setAuthTokenProvider(null)
  }, [activeTokenProvider])

  useEffect(() => {
    const activeUser = (clerkIsSignedIn && clerkUser) ? {
      clerk_id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress ?? '',
      first_name: clerkUser.firstName ?? '',
      last_name: clerkUser.lastName ?? '',
      image_url: clerkUser.imageUrl,
    } : {
      clerk_id: MOCK_DEMO_USER.id,
      email: MOCK_DEMO_USER.primaryEmailAddress.emailAddress,
      first_name: MOCK_DEMO_USER.firstName,
      last_name: MOCK_DEMO_USER.lastName,
      image_url: MOCK_DEMO_USER.imageUrl,
    }

    syncUser(activeUser).then(res => {
      if (res?.role) setRole(res.role)
    }).catch(console.error)
  }, [clerkUser, clerkIsSignedIn])

  const activeUser = useMemo<AppUser>(() => {
    if (clerkIsSignedIn && clerkUser) {
      return {
        id: clerkUser.id,
        firstName: clerkUser.firstName ?? '',
        lastName: clerkUser.lastName ?? '',
        fullName: clerkUser.fullName ?? clerkUser.primaryEmailAddress?.emailAddress ?? 'Account',
        imageUrl: clerkUser.imageUrl,
        primaryEmailAddress: { emailAddress: clerkUser.primaryEmailAddress?.emailAddress ?? '' },
        role,
      }
    }
    return { ...MOCK_DEMO_USER, role }
  }, [clerkUser, clerkIsSignedIn, role])

  const value = useMemo<AuthContextType>(() => ({
    isSignedIn: true,
    isLoaded: clerkIsLoaded ?? true,
    user: activeUser,
    signOut: async () => {
      if (clerkIsSignedIn) {
        await signOut({ redirectUrl: '/' })
      }
    },
    signIn: () => { void openSignIn() },
    updateProfile: () => {},
    isClerk: !isBypassed,
    getToken: activeTokenProvider,
  }), [activeTokenProvider, activeUser, clerkIsLoaded, clerkIsSignedIn, isBypassed, openSignIn, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('Auth hooks must be used inside AuthProvider')
  return context
}

export function useAppUser() {
  const context = useAuthContext()
  return {
    isSignedIn: context.isSignedIn,
    isLoaded: context.isLoaded,
    user: context.user,
    isClerk: context.isClerk,
    getToken: context.getToken,
  }
}

export function useAppAuth() {
  const context = useAuthContext()
  return {
    userId: context.user?.id ?? null,
    signOut: context.signOut,
    signIn: context.signIn,
    updateProfile: context.updateProfile,
    isClerk: context.isClerk,
  }
}

export function AppSignedIn({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAppUser()
  return isLoaded && isSignedIn ? <>{children}</> : null
}

export function AppSignedOut({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAppUser()
  return isLoaded && !isSignedIn ? <>{children}</> : null
}
