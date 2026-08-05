'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { 
  ClerkProvider, 
  useUser, 
  useAuth,
  useClerk
} from '@clerk/nextjs'

// Simple check to see if Clerk keys are configured
const isClerkConfigured = () => {
  return typeof window !== 'undefined' 
    ? !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    : !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
}

interface MockUser {
  id: string
  firstName: string
  lastName: string
  fullName: string
  imageUrl: string
  primaryEmailAddress: {
    emailAddress: string
  }
}

interface AuthContextType {
  isSignedIn: boolean
  isLoaded: boolean
  user: MockUser | null
  signOut: () => Promise<void>
  signIn: () => void
  updateProfile: (firstName: string, lastName: string, email: string) => void
  isClerk: boolean
}

const AuthContext = createContext<AuthContextType>({
  isSignedIn: false,
  isLoaded: false,
  user: null,
  signOut: async () => {},
  signIn: () => {},
  updateProfile: () => {},
  isClerk: false
})

const DEFAULT_MOCK_USER: MockUser = {
  id: 'user_mock_12345',
  firstName: 'Tanishq',
  lastName: 'User',
  fullName: 'Tanishq User',
  imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
  primaryEmailAddress: {
    emailAddress: 'tanishq@example.com'
  }
}

// Bridge component to read Clerk state and feed it to our context
function ClerkStateBridge({ 
  children,
  setContextValue
}: { 
  children: React.ReactNode
  setContextValue: (val: AuthContextType) => void
}) {
  const { user, isSignedIn, isLoaded } = useUser()
  const { signOut } = useClerk()
  const { userId } = useAuth()

  useEffect(() => {
    if (isLoaded) {
      setContextValue({
        isSignedIn: isSignedIn ?? false,
        isLoaded: true,
        user: user ? {
          id: user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          fullName: user.fullName || '',
          imageUrl: user.imageUrl,
          primaryEmailAddress: {
            emailAddress: user.primaryEmailAddress?.emailAddress || ''
          }
        } : null,
        signOut: async () => { await signOut() },
        signIn: () => {}, // Handled by Clerk redirect/components
        updateProfile: () => {}, // Clerk Profile UI
        isClerk: true
      })
    }
  }, [user, isSignedIn, isLoaded, signOut, userId, setContextValue])

  return <>{children}</>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [clerkAvailable, setClerkAvailable] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Unified context state
  const [contextValue, setContextValue] = useState<AuthContextType>({
    isSignedIn: false,
    isLoaded: false,
    user: null,
    signOut: async () => {},
    signIn: () => {},
    updateProfile: () => {},
    isClerk: false
  })

  // Mock State
  const [mockSignedIn, setMockSignedIn] = useState(true)
  const [mockUser, setMockUser] = useState<MockUser | null>(DEFAULT_MOCK_USER)

  useEffect(() => {
    const isConfigured = isClerkConfigured()
    setClerkAvailable(isConfigured)
    setMounted(true)

    // Set initial mock value if Clerk is not available
    if (!isConfigured) {
      setContextValue({
        isSignedIn: true,
        isLoaded: true,
        user: DEFAULT_MOCK_USER,
        signOut: async () => {
          setMockSignedIn(false)
          setMockUser(null)
        },
        signIn: () => {
          setMockSignedIn(true)
          setMockUser(DEFAULT_MOCK_USER)
        },
        updateProfile: (first, last, email) => {
          setMockUser(prev => prev ? {
            ...prev,
            firstName: first,
            lastName: last,
            fullName: `${first} ${last}`,
            primaryEmailAddress: { emailAddress: email }
          } : null)
        },
        isClerk: false
      })
    }
  }, [])

  // Keep mock context value updated when mock status changes
  useEffect(() => {
    if (!clerkAvailable && mounted) {
      setContextValue(prev => ({
        ...prev,
        isSignedIn: mockSignedIn,
        user: mockUser
      }))
    }
  }, [mockSignedIn, mockUser, clerkAvailable, mounted])

  if (!mounted) {
    return <div className="min-h-screen bg-[#050816]" />
  }

  if (clerkAvailable) {
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!
    return (
      <ClerkProvider publishableKey={publishableKey}>
        <ClerkStateBridge setContextValue={setContextValue}>
          <AuthContext.Provider value={contextValue}>
            {children}
          </AuthContext.Provider>
        </ClerkStateBridge>
      </ClerkProvider>
    )
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to consume auth state in any component
export function useAppUser() {
  const context = useContext(AuthContext)
  return {
    isSignedIn: context.isSignedIn,
    isLoaded: context.isLoaded,
    user: context.user,
    isClerk: context.isClerk
  }
}

export function useAppAuth() {
  const context = useContext(AuthContext)
  return {
    userId: context.user?.id || null,
    signOut: context.signOut,
    signIn: context.signIn,
    updateProfile: context.updateProfile,
    isClerk: context.isClerk
  }
}

// Unified layout control components
export function AppSignedIn({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAppUser()
  if (!isLoaded) return null
  return isSignedIn ? <>{children}</> : null
}

export function AppSignedOut({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAppUser()
  if (!isLoaded) return null
  return !isSignedIn ? <>{children}</> : null
}
