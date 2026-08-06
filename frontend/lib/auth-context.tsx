'use client'

import React, { createContext, useContext, useEffect, useMemo } from 'react'
import { useAuth, useClerk, useUser } from '@clerk/nextjs'
import { setAuthTokenProvider } from './api'

interface AppUser {
  id: string
  firstName: string
  lastName: string
  fullName: string
  imageUrl: string
  primaryEmailAddress: { emailAddress: string }
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isSignedIn, isLoaded } = useUser()
  const { getToken } = useAuth()
  const { signOut, openSignIn } = useClerk()

  useEffect(() => {
    setAuthTokenProvider(() => getToken())
    return () => setAuthTokenProvider(null)
  }, [getToken])

  const value = useMemo<AuthContextType>(() => ({
    isSignedIn: isSignedIn ?? false,
    isLoaded,
    user: user ? {
      id: user.id,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      fullName: user.fullName ?? user.primaryEmailAddress?.emailAddress ?? 'Account',
      imageUrl: user.imageUrl,
      primaryEmailAddress: { emailAddress: user.primaryEmailAddress?.emailAddress ?? '' },
    } : null,
    signOut: async () => { await signOut({ redirectUrl: '/' }) },
    signIn: () => { void openSignIn() },
    updateProfile: () => {},
    isClerk: true,
    getToken,
  }), [getToken, isLoaded, isSignedIn, openSignIn, signOut, user])

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
