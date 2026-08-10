'use client'

import Link from 'next/link'
import { LogIn, ShieldCheck } from 'lucide-react'
import { useAppUser, useAppAuth } from '@/lib/auth-context'

export function WorkspaceAuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAppUser()
  const { signIn } = useAppAuth()

  if (!isLoaded) {
    return <div className="min-h-screen bg-slate-50" />
  }
  if (isSignedIn) return <>{children}</>

  return (
    <main className="min-h-screen bg-slate-50 grid place-items-center px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-xl font-bold text-slate-900">Sign in to your workspace</h1>
        <p className="mt-2 text-xs text-slate-500 leading-relaxed">
          Your project plans, architecture diagrams, and custom LLM workflows are securely linked to your account.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => signIn()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
          >
            <LogIn className="h-4 w-4" /> Sign In
          </button>
          <button
            onClick={() => signIn()}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Create Account
          </button>
        </div>
        <Link href="/" className="mt-5 block text-xs font-medium text-slate-500 hover:text-slate-900">
          ← Back to Devflow Home
        </Link>
      </section>
    </main>
  )
}
