'use client'

import { SignInButton, SignUpButton } from '@clerk/nextjs'
import Link from 'next/link'
import { LogIn, ShieldCheck } from 'lucide-react'
import { useAppUser } from '@/lib/auth-context'

export function WorkspaceAuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAppUser()

  if (!isLoaded) {
    return <div className="min-h-screen bg-[#050816]" />
  }
  if (isSignedIn) return <>{children}</>

  return (
    <main className="min-h-screen bg-[#050816] grid place-items-center px-4">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-cyan-500/10 text-cyan-400">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-white">Login to your workspace</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Your projects and AI responses are private and linked to your account.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <SignInButton mode="modal">
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-black hover:bg-cyan-400">
              <LogIn className="h-4 w-4" /> Login
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:border-cyan-400/60">
              Sign up
            </button>
          </SignUpButton>
        </div>
        <Link href="/" className="mt-4 block text-xs text-muted-foreground hover:text-white">Back to home</Link>
      </section>
    </main>
  )
}
