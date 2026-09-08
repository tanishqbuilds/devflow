'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { setAuthTokenProvider, syncUser } from './api'
import { useAuth, useClerk, useUser } from '@clerk/nextjs'

/* ------------------------------------------------------------------ */
/*  Shared types                                                       */
/* ------------------------------------------------------------------ */

interface AppUser {
  id: string
  firstName: string
  lastName: string
  fullName: string
  imageUrl: string
  primaryEmailAddress: { emailAddress: string }
  role?: 'manager' | 'developer' | 'tester'
  specialization?: string
}

interface AuthContextType {
  isSignedIn: boolean
  isLoaded: boolean
  user: AppUser | null
  signOut: () => Promise<void>
  signIn: () => void
  signUp: () => void
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
  role: 'manager',
}

const BYPASS_AUTH = process.env.NEXT_PUBLIC_BYPASS_AUTH !== 'false'
const HAS_CLERK_KEY = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

/* ------------------------------------------------------------------ */
/*  Bypass-mode provider (no Clerk dependency)                         */
/* ------------------------------------------------------------------ */

function BypassAuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<'manager' | 'developer' | 'tester'>('manager')
  const [isSignedIn, setIsSignedIn] = useState(true)

  const tokenProvider = useCallback(async () => 'demo-bypass-token', [])

  // Check if user was logged out previously
  useEffect(() => {
    const isLoggedOut = localStorage.getItem('devflow_bypass_logout') === 'true'
    if (isLoggedOut) {
      setIsSignedIn(false)
    }
  }, [])

  useEffect(() => {
    setAuthTokenProvider(tokenProvider)
    return () => setAuthTokenProvider(null)
  }, [tokenProvider])

  useEffect(() => {
    // Only sync if user is still signed in
    if (!isSignedIn) return

    syncUser({
      clerk_id: MOCK_DEMO_USER.id,
      email: MOCK_DEMO_USER.primaryEmailAddress.emailAddress,
      first_name: MOCK_DEMO_USER.firstName,
      last_name: MOCK_DEMO_USER.lastName,
      image_url: MOCK_DEMO_USER.imageUrl,
    }).then(res => {
      if (res?.role) setRole(res.role)
    }).catch(console.error)
  }, [isSignedIn])

  const user = useMemo<AppUser>(() => ({ ...MOCK_DEMO_USER, role }), [role])

  const handleSignOut = useCallback(async () => {
    // Mark as logged out in localStorage
    localStorage.setItem('devflow_bypass_logout', 'true')
    setIsSignedIn(false)
    // Redirect to home page
    window.location.href = '/'
  }, [])

  const handleSignIn = useCallback(async () => {
    // Clear logout flag and mark as signed in
    localStorage.removeItem('devflow_bypass_logout')
    setIsSignedIn(true)
    // Redirect to my-projects after sign in
    setTimeout(() => {
      window.location.href = '/my-projects'
    }, 100)
  }, [])

  const value = useMemo<AuthContextType>(() => ({
    isSignedIn,
    isLoaded: true,
    user: isSignedIn ? user : null,
    signOut: handleSignOut,
    signIn: handleSignIn,
    signUp: handleSignIn,
    updateProfile: () => {},
    isClerk: false,
    getToken: tokenProvider,
  }), [user, tokenProvider, handleSignOut, handleSignIn, isSignedIn])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* ------------------------------------------------------------------ */
/*  Clerk-backed provider (only loaded when Clerk key is present)      */
/* ------------------------------------------------------------------ */

function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  // These imports are safe here because this component is only rendered
  // when HAS_CLERK_KEY is true and ClerkProvider is mounted above.
  const { user: clerkUser, isSignedIn: clerkIsSignedIn, isLoaded: clerkIsLoaded } = useUser()
  const { getToken: clerkGetToken } = useAuth()
  const { signOut, openSignIn, openSignUp } = useClerk()
  const [role, setRole] = useState<'manager' | 'developer' | 'tester' | undefined>()
  const [specialization, setSpecialization] = useState<string | undefined>()

  const activeTokenProvider = useCallback(async () => {
    if (clerkIsSignedIn && clerkUser) {
      return clerkGetToken()
    }
    return null
  }, [clerkIsSignedIn, clerkUser, clerkGetToken])

  useEffect(() => {
    setAuthTokenProvider(activeTokenProvider)
    return () => setAuthTokenProvider(null)
  }, [activeTokenProvider])

  useEffect(() => {
    if (!clerkIsSignedIn || !clerkUser) return
    const activeUser = {
      clerk_id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress ?? '',
      first_name: clerkUser.firstName ?? '',
      last_name: clerkUser.lastName ?? '',
      image_url: clerkUser.imageUrl,
    }

    syncUser(activeUser).then(res => {
      if (res?.role) setRole(res.role)
      if (res?.specialization) setSpecialization(res.specialization)
    }).catch(console.error)
  }, [clerkUser, clerkIsSignedIn])

  const activeUser = useMemo<AppUser | null>(() => {
    if (clerkIsSignedIn && clerkUser) {
      return {
        id: clerkUser.id,
        firstName: clerkUser.firstName ?? '',
        lastName: clerkUser.lastName ?? '',
        fullName: clerkUser.fullName ?? clerkUser.primaryEmailAddress?.emailAddress ?? 'Account',
        imageUrl: clerkUser.imageUrl,
        primaryEmailAddress: { emailAddress: clerkUser.primaryEmailAddress?.emailAddress ?? '' },
        role,
        specialization,
      }
    }
    return null
  }, [clerkUser, clerkIsSignedIn, role])

  const value = useMemo<AuthContextType>(() => ({
    isSignedIn: !!clerkIsSignedIn,
    isLoaded: clerkIsLoaded ?? true,
    user: activeUser,
    signOut: async () => {
      if (clerkIsSignedIn) {
        await signOut({ redirectUrl: '/' })
      }
    },
    signIn: () => { void openSignIn() },
    signUp: () => { void openSignUp() },
    updateProfile: () => {},
    isClerk: true,
    getToken: activeTokenProvider,
  }), [activeTokenProvider, activeUser, clerkIsLoaded, clerkIsSignedIn, openSignIn, openSignUp, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* ------------------------------------------------------------------ */
/*  Exported provider — picks the right implementation                 */
/* ------------------------------------------------------------------ */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Use ClerkAuthProvider only when Clerk is available AND not bypassed
  if (HAS_CLERK_KEY && !BYPASS_AUTH) {
    return <ClerkAuthProvider>{children}</ClerkAuthProvider>
  }
  return <BypassAuthProvider>{children}</BypassAuthProvider>
}

/* ------------------------------------------------------------------ */
/*  Hooks (unchanged API surface)                                      */
/* ------------------------------------------------------------------ */

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
    signUp: context.signUp,
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
