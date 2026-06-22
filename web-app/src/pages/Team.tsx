import React, { useState, useEffect } from 'react'
import {
  Users, UserPlus, Mail, Crown, Shield, Eye, User,
  MoreVertical, CheckCircle, XCircle, Clock, Copy, Check,
} from 'lucide-react'
import api from '../lib/api.service'

// ─── Types ─────────────────────────────────────────────────────────────────

interface Member {
  user_id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  joined_at: string | null
}

interface PendingInvite {
  id: string
  email: string
  role: string
  created_at: string
  expires_at: string
  token: string
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const ROLE_META: Record<string, { icon: React.ElementType; color: string; bg: string; desc: string }> = {
  owner: { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30', desc: 'Full access + billing' },
  admin: { icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/30', desc: 'Full access except billing' },
  member: { icon: User, color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30', desc: 'Create & analyze prompts' },
  viewer: { icon: Eye, color: 'text-gray-400', bg: 'bg-gray-500/20 border-gray-500/30', desc: 'Read-only access' },
}

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_META[role] ?? ROLE_META.viewer
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${meta.bg} ${meta.color}`}>
      <Icon className="h-3 w-3" />
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  )
}

function Avatar({ name, email }: { name: string; email: string }) {
  const initials = (name || email).slice(0, 2).toUpperCase()
  const hue = [...email].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div
      className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
      style={{ background: `hsl(${hue}, 60%, 35%)` }}
    >
      {initials}
    </div>
  )
}

// ─── Invite Modal ───────────────────────────────────────────────────────────

function InviteModal({ onClose, onDone }: { onClose: () => void; onDone: (link: string) => void }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/team/invite', { email: email.trim(), role })
      const inviteUrl = `${window.location.origin}/accept-invite/${res.data.token}`
      onDone(inviteUrl)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to send invite.')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0F1629] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-1">Invite Team Member</h2>
        <p className="text-gray-400 text-sm mb-5">
          Send an invitation link to a colleague. The link expires in 72 hours.
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="colleague@company.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wide">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 appearance-none"
            >
              <option value="viewer">Viewer — read-only access</option>
              <option value="member">Member — create &amp; analyze</option>
              <option value="admin">Admin — full access</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={submit}
            disabled={loading || !email.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <Mail className="h-4 w-4" />
            {loading ? 'Sending…' : 'Send Invite'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white border border-white/10 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Invite Link Banner ─────────────────────────────────────────────────────

function InviteLinkBanner({ link, onClose }: { link: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-green-300 text-sm font-medium">Invite link generated</p>
          <p className="text-gray-400 text-xs font-mono truncate mt-0.5">{link}</p>
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors border border-green-500/30"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <XCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Member Row ─────────────────────────────────────────────────────────────

function MemberRow({
  member,
  isSelf,
  onRoleChange,
  onRemove,
}: {
  member: Member
  isSelf: boolean
  onRoleChange: (userId: string, role: string) => void
  onRemove: (userId: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors rounded-xl">
      <div className="flex items-center gap-3">
        <Avatar name={member.name} email={member.email} />
        <div>
          <p className="text-white text-sm font-medium flex items-center gap-2">
            {member.name || member.email}
            {isSelf && <span className="text-xs text-gray-500 font-normal">(you)</span>}
          </p>
          <p className="text-gray-400 text-xs">{member.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <RoleBadge role={member.role} />
        {!isSelf && member.role !== 'owner' && (
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {open && (
              <div className="absolute right-0 top-8 z-20 w-48 bg-[#0F1629] border border-white/10 rounded-xl shadow-2xl py-1">
                <p className="text-xs text-gray-500 px-3 py-2 uppercase tracking-wide">Change role</p>
                {['admin', 'member', 'viewer'].map(r => (
                  <button
                    key={r}
                    onClick={() => { onRoleChange(member.user_id, r); setOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-white/5 ${member.role === r ? 'text-blue-400' : 'text-gray-300'}`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
                <div className="border-t border-white/10 mt-1 pt-1">
                  <button
                    onClick={() => { onRemove(member.user_id); setOpen(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Remove from team
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function Team() {
  const [members, setMembers] = useState<Member[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const load = async () => {
    try {
      const [membersRes, meRes] = await Promise.all([
        api.get('/team/members'),
        api.get('/auth/me'),
      ])
      setMembers(membersRes.data)
      setCurrentUserId(meRes.data.id)
    } catch {
      // non-fatal
    }

    // Load pending invites (best-effort)
    try {
      const inv = await api.get('/team/invitations')
      setPendingInvites(inv.data)
    } catch {
      setPendingInvites([])
    }

    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await api.patch(`/team/members/${userId}/role`, { role })
      load()
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to update role.')
    }
  }

  const handleRemove = async (userId: string) => {
    if (!window.confirm('Remove this member from the organization?')) return
    try {
      await api.delete(`/team/members/${userId}`)
      load()
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to remove member.')
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await api.delete(`/team/invite/${inviteId}`)
      load()
    } catch {
      // best-effort
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Loading team…</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-gray-400 mt-1">
            Manage members, roles, and pending invitations.
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
        >
          <UserPlus className="h-4 w-4" />
          Invite Member
        </button>
      </div>

      {/* Invite link banner */}
      {inviteLink && (
        <InviteLinkBanner link={inviteLink} onClose={() => setInviteLink(null)} />
      )}

      {/* Role legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(ROLE_META).map(([role, meta]) => {
          const Icon = meta.icon
          return (
            <div key={role} className="rounded-xl border border-white/10 bg-white/3 px-4 py-3 flex items-center gap-2">
              <Icon className={`h-4 w-4 flex-shrink-0 ${meta.color}`} />
              <div>
                <p className={`text-xs font-semibold ${meta.color}`}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </p>
                <p className="text-gray-500 text-xs">{meta.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Members list */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-white font-medium text-sm">
              Members <span className="text-gray-400 font-normal">({members.length})</span>
            </span>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {members.map(m => (
            <MemberRow
              key={m.user_id}
              member={m}
              isSelf={m.user_id === currentUserId}
              onRoleChange={handleRoleChange}
              onRemove={handleRemove}
            />
          ))}
          {members.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-8">No members found.</p>
          )}
        </div>
      </div>

      {/* Pending invitations */}
      {pendingInvites.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-400" />
            <span className="text-white font-medium text-sm">
              Pending Invitations <span className="text-gray-400 font-normal">({pendingInvites.length})</span>
            </span>
          </div>

          <div className="divide-y divide-white/5">
            {pendingInvites.map(inv => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm">{inv.email}</p>
                    <p className="text-gray-400 text-xs">
                      Invited as <span className="text-blue-400">{inv.role}</span> · Expires{' '}
                      {new Date(inv.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRevokeInvite(inv.id)}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                  title="Revoke invite"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite modal */}
      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onDone={link => {
            setInviteLink(link)
            setShowInviteModal(false)
            load()
          }}
        />
      )}
    </div>
  )
}
