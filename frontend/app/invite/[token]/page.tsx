'use client'
import {useParams,useRouter} from 'next/navigation'
import {useState} from 'react'
import {acceptWorkspaceInvite} from '@/lib/api'

export default function AcceptInvitePage(){
 const {token}=useParams<{token:string}>(),router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const accept=async()=>{setBusy(true);setError('');try{await acceptWorkspaceInvite(token);router.push('/my-projects')}catch(e:any){setError(e.message||'Could not join workspace');setBusy(false)}}
 return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">DF</div><h1 className="text-2xl font-bold text-slate-900">Join this workspace</h1><p className="mt-2 text-sm text-slate-500">Your assigned role controls whether you can view, edit, invite members, or manage access.</p><button onClick={accept} disabled={busy} className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy?'Joining…':'Accept invitation'}</button>{error&&<p className="mt-3 text-sm text-rose-600">{error}</p>}</section></main>
}
