import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../lib/auth'
import { Save, Lock, User, Bell, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import api from '../lib/api.service'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-9 w-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <Icon className="h-5 w-5 text-blue-400" />
        </div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Flash({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border ${ok
      ? 'bg-green-500/10 border-green-500/30 text-green-300'
      : 'bg-red-500/10 border-red-500/30 text-red-300'
    }`}>
      {ok ? <CheckCircle className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
      {msg}
    </div>
  )
}

// ─── Profile Section ──────────────────────────────────────────────────────────

function ProfileSection() {
  const { user, checkAuth } = useAuthStore()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [loading, setLoading] = useState(false)
  const [flash, setFlash] = useState<{ msg: string; ok: boolean } | null>(null)

  const save = async () => {
    setLoading(true)
    setFlash(null)
    try {
      await api.patch('/auth/profile', { name, email })
      await checkAuth()
      setFlash({ msg: 'Profile updated successfully.', ok: true })
    } catch (e: any) {
      setFlash({ msg: e.response?.data?.detail || 'Failed to update profile.', ok: false })
    }
    setLoading(false)
  }

  return (
    <SectionCard title="Profile" icon={User}>
      <div className="space-y-4">
        {flash && <Flash {...flash} />}
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Full Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={save}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-all"
        >
          <Save className="h-4 w-4" />
          {loading ? 'Saving…' : 'Save Profile'}
        </button>
      </div>
    </SectionCard>
  )
}

// ─── Password Section ─────────────────────────────────────────────────────────

function PasswordSection() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [loading, setLoading] = useState(false)
  const [flash, setFlash] = useState<{ msg: string; ok: boolean } | null>(null)

  const strength = (pwd: string) => {
    let s = 0
    if (pwd.length >= 8) s++
    if (/[A-Z]/.test(pwd)) s++
    if (/[0-9]/.test(pwd)) s++
    if (/[^A-Za-z0-9]/.test(pwd)) s++
    return s
  }
  const s = strength(next)
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][s]
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'][s]

  const save = async () => {
    if (next !== confirm) { setFlash({ msg: 'Passwords do not match.', ok: false }); return }
    if (next.length < 8) { setFlash({ msg: 'Password must be at least 8 characters.', ok: false }); return }
    setLoading(true)
    setFlash(null)
    try {
      await api.post('/auth/change-password', { current_password: current, new_password: next })
      setFlash({ msg: 'Password changed successfully.', ok: true })
      setCurrent(''); setNext(''); setConfirm('')
    } catch (e: any) {
      setFlash({ msg: e.response?.data?.detail || 'Failed to change password.', ok: false })
    }
    setLoading(false)
  }

  return (
    <SectionCard title="Change Password" icon={Lock}>
      <div className="space-y-4">
        {flash && <Flash {...flash} />}
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Current Password</label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={current}
              onChange={e => setCurrent(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">New Password</label>
          <div className="relative">
            <input
              type={showNext ? 'text' : 'password'}
              value={next}
              onChange={e => setNext(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <button onClick={() => setShowNext(!showNext)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
              {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {next.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex gap-1 flex-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i <= s ? strengthColor : 'bg-white/10'}`} />
                ))}
              </div>
              <span className={`text-xs font-medium ${['', 'text-red-400', 'text-yellow-400', 'text-blue-400', 'text-green-400'][s]}`}>
                {strengthLabel}
              </span>
            </div>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Confirm New Password</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••"
            className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 ${confirm && confirm !== next ? 'border-red-500/50' : 'border-white/10'}`}
          />
          {confirm && confirm !== next && <p className="text-xs text-red-400 mt-1">Passwords do not match</p>}
        </div>
        <button
          onClick={save}
          disabled={loading || !current || !next || next !== confirm}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-all"
        >
          <Lock className="h-4 w-4" />
          {loading ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </SectionCard>
  )
}

// ─── Notifications Section ───────────────────────────────────────────────────

function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    email_on_critical: true,
    email_on_risky: false,
    email_digest_daily: false,
    slack_notifications: false,
  })
  const [loading, setLoading] = useState(false)
  const [flash, setFlash] = useState<{ msg: string; ok: boolean } | null>(null)

  useEffect(() => {
    api.get('/auth/notification-prefs').then(r => setPrefs(r.data)).catch(() => {})
  }, [])

  const save = async () => {
    setLoading(true)
    setFlash(null)
    try {
      await api.patch('/auth/notification-prefs', prefs)
      setFlash({ msg: 'Notification preferences saved.', ok: true })
    } catch (e: any) {
      setFlash({ msg: e.response?.data?.detail || 'Failed to save preferences.', ok: false })
    }
    setLoading(false)
  }

  const toggle = (key: keyof typeof prefs) =>
    setPrefs(p => ({ ...p, [key]: !p[key] }))

  const items: { key: keyof typeof prefs; label: string; desc: string }[] = [
    { key: 'email_on_critical', label: 'Email on critical detections', desc: 'Instant email when a critical-risk prompt is detected' },
    { key: 'email_on_risky', label: 'Email on risky detections', desc: 'Instant email for risky or higher risk levels' },
    { key: 'email_digest_daily', label: 'Daily digest email', desc: 'Summarized daily report of all detections' },
    { key: 'slack_notifications', label: 'Slack notifications', desc: 'Send alerts to your configured Slack webhook' },
  ]

  return (
    <SectionCard title="Notifications" icon={Bell}>
      <div className="space-y-4">
        {flash && <Flash {...flash} />}
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.key} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div>
                <p className="text-white text-sm font-medium">{item.label}</p>
                <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => toggle(item.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${prefs[item.key] ? 'bg-blue-600' : 'bg-white/10'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${prefs[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={save}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-all"
        >
          <Save className="h-4 w-4" />
          {loading ? 'Saving…' : 'Save Preferences'}
        </button>
      </div>
    </SectionCard>
  )
}

// ─── Danger Zone ──────────────────────────────────────────────────────────────

function DangerZone() {
  const { logout } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const deleteAccount = async () => {
    if (!window.confirm('This will permanently delete your account and all associated data. This cannot be undone.\n\nAre you absolutely sure?')) return
    setLoading(true)
    try {
      await api.delete('/auth/account')
      logout()
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to delete account.')
    }
    setLoading(false)
  }

  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
      <h2 className="text-base font-semibold text-red-400 mb-1">Danger Zone</h2>
      <p className="text-gray-400 text-sm mb-4">
        These actions are permanent and cannot be undone.
      </p>
      <button
        onClick={deleteAccount}
        disabled={loading}
        className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-all"
      >
        {loading ? 'Deleting…' : 'Delete Account'}
      </button>
    </div>
  )
}

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your account, password, and notification preferences.</p>
      </div>

      <ProfileSection />
      <PasswordSection />
      <NotificationsSection />
      <DangerZone />
    </div>
  )
}
