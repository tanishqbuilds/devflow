'use client'

import { useEffect, useState } from 'react'
import { getProjectMembers, getProjectInvites, inviteProjectMember, updateProjectMemberRole, removeProjectMember, revokeProjectInvite } from '@/lib/api'
import { useProjectStore } from '@/lib/project-store'
import { AlertCircle, Loader2, Mail, ShieldCheck, Trash2, UserPlus, Users, Crown, Code2, TestTube2 } from 'lucide-react'
import { PermissionGuard } from '../auth/permission-guard'

const ROLES = ['manager', 'developer', 'tester']
const SPECIALIZATIONS = [
  'Java', 'C++', 'Python', 'Go', 'Rust', 'JavaScript', 'TypeScript',
  'Ruby', 'Swift', 'Kotlin', 'C#', 'PHP', 'Scala', 'R', 'Dart',
  'QA Automation', 'Manual Testing', 'Performance Testing',
  'DevOps', 'Data Engineering', 'Machine Learning', 'Frontend', 'Backend',
  'Full Stack', 'Mobile', 'Security',
]

const ROLE_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  manager:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   label: 'Manager'   },
  developer: { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200',  label: 'Developer' },
  tester:    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Tester'    },
}

function RoleBadge({ role }: { role: string }) {
  const s = ROLE_STYLES[role] ?? ROLE_STYLES.developer
  const Icon = role === 'manager' ? Crown : role === 'tester' ? TestTube2 : Code2
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
      <Icon className="w-3 h-3" />
      {s.label}
    </span>
  )
}

function MemberAvatar({ member }: { member: any }) {
  const name = encodeURIComponent(`${member.first_name ?? ''} ${member.last_name ?? ''}`.trim() || 'User')
  return (
    <img
      src={member.image_url || `https://ui-avatars.com/api/?name=${name}&background=e2e8f0&color=475569`}
      className="w-10 h-10 rounded-full border border-slate-200 object-cover shrink-0"
      alt={member.first_name ?? 'Member'}
    />
  )
}

// ---------------------------------------------------------------------------
// Read-only view — shown to developers & testers
// ---------------------------------------------------------------------------
function ReadOnlyTeamView({ members, loading }: { members: any[]; loading: boolean }) {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" /> Team Roster
          </h3>
          <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No team members yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {members.map(member => (
              <div key={member.user_id} className="p-4 sm:p-5 flex items-center gap-4">
                <MemberAvatar member={member} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-900 truncate">
                    {member.first_name} {member.last_name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{member.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <RoleBadge role={member.role} />
                  {member.specialization && (
                    <span className="text-[10px] font-medium text-slate-500 border border-slate-200 bg-slate-50 px-2 py-1 rounded-full">
                      {member.specialization}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
        <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
        <span>Only project managers can invite new members, change roles, or remove people from the project.</span>
      </div>
    </div>
  )
}

export function TeamManagement() {
  const project = useProjectStore(s => s.project)
  const [members, setMembers] = useState<any[]>([])
  const [invites, setInvites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('developer')
  const [inviteSpecialization, setInviteSpecialization] = useState('')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (project?.id) {
      loadData()
    }
  }, [project?.id])

  const loadData = async () => {
    if (!project?.id) return
    setLoading(true)
    setError(null)
    try {
      const [membersRes, invitesRes] = await Promise.all([
        getProjectMembers(project.id).catch(() => ({ members: [] })),
        getProjectInvites(project.id).catch(() => ({ invites: [] }))
      ])
      setMembers(membersRes.members || [])
      setInvites(invitesRes.invites || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load team data')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project?.id || !inviteEmail) return
    setInviting(true)
    setError(null)
    try {
      await inviteProjectMember(project.id, inviteEmail, inviteRole, inviteRole === 'developer' ? inviteSpecialization : undefined)
      setInviteEmail('')
      await loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to send invite')
    } finally {
      setInviting(false)
    }
  }

  const handleUpdateRole = async (memberId: string, role: string, spec: string | undefined) => {
    if (!project?.id) return
    try {
      await updateProjectMemberRole(project.id, memberId, role, role === 'developer' ? spec : undefined)
      await loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to update role')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!project?.id) return
    if (!confirm('Are you sure you want to remove this member?')) return
    try {
      await removeProjectMember(project.id, memberId)
      await loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to remove member')
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    if (!project?.id) return
    try {
      await revokeProjectInvite(project.id, inviteId)
      await loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to revoke invite')
    }
  }

  if (!project) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Team Members</h2>
        <p className="text-slate-500 text-sm">
          View your project team. Managers can invite, reassign roles, and remove members.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <PermissionGuard projectRoles={['manager']} fallback={<ReadOnlyTeamView members={members} loading={loading} />}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" /> Active Members
                </h3>
                <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                  {members.length} members
                </span>
              </div>
              
              {loading ? (
                <div className="p-12 flex justify-center">
                  <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {members.map(member => (
                    <div key={member.user_id} className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MemberAvatar member={member} />
                        <div>
                          <p className="font-bold text-sm text-slate-900">{member.first_name} {member.last_name}</p>
                          <p className="text-xs text-slate-500">{member.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                          className="bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-auto"
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member.user_id, e.target.value, member.specialization)}
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                        </select>
                        
                        {member.role === 'developer' && (
                          <select
                            className="bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-auto"
                            value={member.specialization || ''}
                            onChange={(e) => handleUpdateRole(member.user_id, member.role, e.target.value)}
                          >
                            <option value="">No Spec</option>
                            {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        )}
                        
                        <button
                          onClick={() => handleRemoveMember(member.user_id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {invites.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-amber-500" /> Pending Invitations
                  </h3>
                  <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2 py-1 rounded-lg">
                    {invites.length} pending
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {invites.map(invite => (
                    <div key={invite.id} className="p-4 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{invite.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {invite.role}
                          </span>
                          {invite.specialization && (
                            <span className="text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                              {invite.specialization}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            Invited by {invite.invited_by_name}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevokeInvite(invite.id)}
                        className="text-xs text-rose-600 font-semibold px-3 py-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                <UserPlus className="w-5 h-5 text-blue-600" /> Invite New Member
              </h3>
              
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setInviteRole(r)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          inviteRole === r 
                            ? 'bg-slate-900 text-white shadow-sm' 
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {inviteRole === 'developer' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Specialization (Optional)</label>
                    <select
                      value={inviteSpecialization}
                      onChange={e => setInviteSpecialization(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No Specialization</option>
                      {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Send Invitation
                </button>
              </form>
            </div>
          </div>
        </div>
      </PermissionGuard>
    </div>
  )
}
