'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { acceptProjectInvite, acceptWorkspaceInvite } from '@/lib/api'
import { FolderKanban, Loader2, ArrowRight } from 'lucide-react'

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>()
  const token = params?.token || ''
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const accept = async () => {
    if (!token) return
    setBusy(true)
    setError('')
    try {
      // Try accepting as project invite first
      try {
        await acceptProjectInvite(token)
      } catch {
        // Fallback to workspace invite
        await acceptWorkspaceInvite(token)
      }
      router.push('/my-projects')
    } catch (e: any) {
      setError(e.message || 'Could not accept invitation. It may have expired or already been accepted.')
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-xs">
          <FolderKanban className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">You've Been Invited!</h1>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Join the engineering team on Devflow to collaborate on specifications, sprint backlogs, and architecture.
        </p>
        <button
          onClick={accept}
          disabled={busy}
          className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Joining project…
            </>
          ) : (
            <>
              Accept Invitation <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
        {error && <p className="mt-4 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2.5">{error}</p>}
      </section>
    </main>
  )
}
