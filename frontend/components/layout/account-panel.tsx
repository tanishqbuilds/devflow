'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { useAppUser, useAppAuth } from '@/lib/auth-context'
import { 
  X, 
  User, 
  Mail, 
  Settings2, 
  Check, 
  KeyRound, 
  LogOut, 
  Sparkles,
  BarChart2,
  Lock
} from 'lucide-react'

export function AccountPanel() {
  const { accountPanelOpen, setAccountPanelOpen } = useAppStore()
  const { user, isClerk } = useAppUser()
  const { signOut, signIn, updateProfile } = useAppAuth()

  // Inline edit state for mock user
  const [isEditing, setIsEditing] = useState(false)
  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [email, setEmail] = useState(user?.primaryEmailAddress?.emailAddress || '')

  const handleSave = () => {
    updateProfile(firstName, lastName, email)
    setIsEditing(false)
  }

  const handleSignOut = () => {
    signOut()
    setAccountPanelOpen(false)
  }

  return (
    <AnimatePresence>
      {accountPanelOpen && (
        <>
          {/* Backdrop Blur */}
          <motion.div
            className="fixed inset-0 bg-[#000]/60 backdrop-blur-md z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAccountPanelOpen(false)}
          />

          {/* Sliding Panel */}
          <motion.div
            className="fixed right-0 top-0 h-screen w-full sm:w-[420px] bg-[#050816]/90 backdrop-blur-2xl border-l border-white/5 shadow-[-20px_0_40px_rgba(0,0,0,0.5)] z-50 p-6 flex flex-col justify-between overflow-y-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Upper Content */}
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <h2 className="text-lg font-semibold text-foreground bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    Account Profile
                  </h2>
                </div>
                <button
                  onClick={() => setAccountPanelOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Card */}
              {user ? (
                <div className="glass-panel p-5 rounded-2xl border border-white/10 relative overflow-hidden group">
                  {/* Subtle Background Glow */}
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all duration-500" />
                  
                  <div className="flex items-start gap-4">
                    <img
                      src={user.imageUrl}
                      alt={user.fullName}
                      className="w-14 h-14 rounded-xl object-cover border border-white/10 shadow-lg shadow-cyan-500/10"
                    />
                    <div className="space-y-1 flex-1">
                      {isEditing ? (
                        <div className="space-y-2 mt-1">
                          <input
                            type="text"
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                            placeholder="First Name"
                            className="w-full bg-[#0a0f24] border border-white/10 rounded px-2.5 py-1 text-xs text-foreground focus:border-cyan-500/50 outline-none"
                          />
                          <input
                            type="text"
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            placeholder="Last Name"
                            className="w-full bg-[#0a0f24] border border-white/10 rounded px-2.5 py-1 text-xs text-foreground focus:border-cyan-500/50 outline-none"
                          />
                          <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Email Address"
                            className="w-full bg-[#0a0f24] border border-white/10 rounded px-2.5 py-1 text-xs text-foreground focus:border-cyan-500/50 outline-none"
                          />
                          <button
                            onClick={handleSave}
                            className="flex items-center gap-1 px-3 py-1 bg-cyan-500 text-black text-xs font-semibold rounded hover:bg-cyan-400 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" /> Save
                          </button>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                            {user.fullName}
                            {!isClerk && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-normal">
                                Demo Mode
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" />
                            {user.primaryEmailAddress?.emailAddress}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {!isClerk && !isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="absolute bottom-3 right-3 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Settings2 className="w-3 h-3" /> Edit
                    </button>
                  )}
                </div>
              ) : (
                <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center space-y-4">
                  <User className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Not signed in</p>
                </div>
              )}

              {/* API and Orchestration Usage Stats */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Usage Analytics</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground uppercase">Model Tokens</p>
                    <p className="text-base font-bold text-foreground mt-1">14,820</p>
                    <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full w-[29.6%]" />
                    </div>
                    <span className="text-[9px] text-muted-foreground mt-1 block">30% limit reached</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground uppercase">API Orchestrations</p>
                    <p className="text-base font-bold text-foreground mt-1">8 / 25</p>
                    <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full w-[32%]" />
                    </div>
                    <span className="text-[9px] text-muted-foreground mt-1 block">Monthly quota reset in 12d</span>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-cyan-400" />
                    <div>
                      <p className="text-xs font-medium text-foreground">Plan Tier</p>
                      <p className="text-[10px] text-muted-foreground">Premium Dev Account</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                    ACTIVE
                  </span>
                </div>
              </div>

              {/* Developer Clerk Key Configuration Instructions */}
              {!isClerk && (
                <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    Enable Production Clerk Auth
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    To transition from local demo authentication to live Clerk user authentication, configure the variables in your local environment:
                  </p>
                  <div className="bg-black/40 border border-white/5 rounded p-2 font-mono text-[9px] text-purple-300 select-all overflow-x-auto whitespace-pre">
                    {`# Create a .env.local file in frontend:
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...`}
                  </div>
                  <a
                    href="https://dashboard.clerk.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold block text-right hover:underline"
                  >
                    Go to Clerk Dashboard &rarr;
                  </a>
                </div>
              )}
            </div>

            {/* Bottom Actions - Sign Out */}
            <div className="border-t border-white/5 pt-4 mt-6">
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out Account
                </button>
              ) : (
                <button
                  onClick={signIn}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500 text-black rounded-xl text-xs font-semibold hover:bg-cyan-400 transition-all duration-300"
                >
                  <Lock className="w-4 h-4" />
                  Sign In Account
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
