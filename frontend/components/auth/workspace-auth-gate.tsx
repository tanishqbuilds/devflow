'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LogIn, ShieldCheck, AlertCircle } from 'lucide-react'
import { useAppUser, useAppAuth } from '@/lib/auth-context'

export function WorkspaceAuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAppUser()
  const { signIn } = useAppAuth()
  const [apiReady, setApiReady] = useState(false)
  const isBypassMode = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'

  useEffect(() => {
    // AuthProvider registers the API token provider in its own effect. Mount
    // protected children one render later so their initial fetch cannot race it.
    setApiReady(isLoaded && isSignedIn)
  }, [isLoaded, isSignedIn])

  if (!isLoaded) {
    return <div className="min-h-screen bg-slate-50" />
  }
  if (isSignedIn && apiReady) return <>{children}</>
  if (isSignedIn) return <div className="min-h-screen bg-slate-50" />

  return (
    <main className="min-h-screen bg-slate-50 grid place-items-center px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl space-y-6">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
          <ShieldCheck className="h-6 w-6" />
        </div>
        
        <div>
          <h1 className="text-xl font-bold text-slate-900">Sign in to your workspace</h1>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Your project plans, architecture diagrams, and custom LLM workflows are securely linked to your account.
          </p>
        </div>

        {/* Demo Mode Indicator */}
        {isBypassMode && (
          <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-xs font-semibold text-amber-900">Demo Mode Active</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                You're in demo mode. Signing in will use a mock account for testing. To use real Clerk authentication, set <code className="bg-amber-100 px-1 py-0.5 rounded text-[10px] font-mono">NEXT_PUBLIC_BYPASS_AUTH=false</code> and provide Clerk keys.
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => signIn()}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
        >
          <LogIn className="h-4 w-4" /> Sign In {isBypassMode && '(Demo)'}
        </button>

        <Link href="/" className="block text-xs font-medium text-slate-500 hover:text-slate-900">
          ← Back to Devflow Home
        </Link>
      </section>
    </main>
  )
}
