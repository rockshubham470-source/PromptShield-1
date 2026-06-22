import React, { useState, useEffect } from 'react'
import {
  Shield, Smartphone, Lock, Globe, Monitor,
  Plus, Trash2, CheckCircle, XCircle, Copy, RefreshCw,
  AlertTriangle, Eye, EyeOff
} from 'lucide-react'
import api from '../lib/api.service'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MFAStatus { enabled: boolean; enabled_at: string | null }
interface MFASetup { provisioning_uri: string; secret: string; backup_codes: string[] }
interface IpEntry { id: string; cidr: string; label: string | null; is_active: boolean; created_at: string }
interface SessionEntry { id: string; device_info: string | null; ip_address: string | null; created_at: string; last_active_at: string; is_current: boolean }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Badge({ children, variant }: { children: React.ReactNode; variant: 'green' | 'red' | 'yellow' }) {
  const cls = {
    green: 'bg-green-500/20 text-green-400 border border-green-500/30',
    red: 'bg-red-500/20 text-red-400 border border-red-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  }[variant]
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{children}</span>
}

function Card({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-9 w-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <Icon className="h-5 w-5 text-blue-400" />
        </div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ─── MFA Section ─────────────────────────────────────────────────────────────

function MFASection() {
  const [status, setStatus] = useState<MFAStatus | null>(null)
  const [setup, setSetup] = useState<MFASetup | null>(null)
  const [step, setStep] = useState<'idle' | 'setup' | 'verify'>('idle')
  const [code, setCode] = useState('')
  const [showCodes, setShowCodes] = useState(false)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const res = await api.get('/mfa/status')
    setStatus(res.data)
  }
  useEffect(() => { load() }, [])

  const startSetup = async () => {
    setLoading(true)
    try {
      const res = await api.post('/mfa/setup')
      setSetup(res.data)
      setStep('setup')
    } catch (e: any) { setMsg(e.response?.data?.detail || 'Error') }
    setLoading(false)
  }

  const verifySetup = async () => {
    setLoading(true)
    try {
      await api.post('/mfa/verify-setup', { code })
      setMsg('MFA enabled successfully!')
      setStep('idle')
      setSetup(null)
      setCode('')
      load()
    } catch (e: any) { setMsg(e.response?.data?.detail || 'Invalid code') }
    setLoading(false)
  }

  const disableMFA = async () => {
    const c = prompt('Enter your current TOTP code to disable MFA:')
    if (!c) return
    setLoading(true)
    try {
      await api.post('/mfa/disable', { code: c })
      setMsg('MFA disabled.')
      load()
    } catch (e: any) { setMsg(e.response?.data?.detail || 'Error') }
    setLoading(false)
  }

  if (!status) return <div className="text-gray-400 text-sm">Loading…</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-medium">Two-Factor Authentication</p>
          <p className="text-gray-400 text-sm mt-0.5">Protect your account with TOTP (Google Authenticator, Authy, etc.)</p>
        </div>
        <Badge variant={status.enabled ? 'green' : 'red'}>
          {status.enabled ? 'Enabled' : 'Disabled'}
        </Badge>
      </div>

      {msg && <p className="text-sm text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2">{msg}</p>}

      {step === 'idle' && (
        <button
          onClick={status.enabled ? disableMFA : startSetup}
          disabled={loading}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${status.enabled
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
            : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30'
          }`}
        >
          {status.enabled ? 'Disable MFA' : 'Enable MFA'}
        </button>
      )}

      {step === 'setup' && setup && (
        <div className="space-y-4 border border-white/10 rounded-xl p-4 bg-white/3">
          <p className="text-sm text-gray-300">
            1. Scan this QR code with your authenticator app, or enter the secret manually.
          </p>
          {/* QR code rendered via Google Charts proxy-free approach */}
          <div className="bg-white p-3 rounded-xl w-fit">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(setup.provisioning_uri)}`}
              alt="MFA QR Code"
              className="w-44 h-44"
            />
          </div>
          <div className="bg-black/30 rounded-xl px-3 py-2 flex items-center gap-2">
            <code className="text-xs text-green-400 flex-1 break-all">{setup.secret}</code>
            <button onClick={() => navigator.clipboard.writeText(setup.secret)} className="text-gray-400 hover:text-white">
              <Copy className="h-4 w-4" />
            </button>
          </div>

          <div>
            <p className="text-sm text-gray-300 mb-1">Backup codes (save these somewhere safe!)</p>
            <button
              onClick={() => setShowCodes(!showCodes)}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mb-2"
            >
              {showCodes ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {showCodes ? 'Hide' : 'Show'} backup codes
            </button>
            {showCodes && (
              <div className="grid grid-cols-2 gap-1">
                {setup.backup_codes.map(c => (
                  <code key={c} className="text-xs bg-black/30 rounded px-2 py-1 text-yellow-300">{c}</code>
                ))}
              </div>
            )}
          </div>

          <p className="text-sm text-gray-300">2. Enter the 6-digit code from your app to confirm.</p>
          <div className="flex gap-3">
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm w-32 focus:outline-none focus:border-blue-500"
            />
            <button onClick={verifySetup} disabled={loading || code.length < 6}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-all">
              Activate
            </button>
            <button onClick={() => setStep('idle')} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white border border-white/10">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── IP Allowlist Section ─────────────────────────────────────────────────────

function IPAllowlistSection() {
  const [entries, setEntries] = useState<IpEntry[]>([])
  const [cidr, setCidr] = useState('')
  const [label, setLabel] = useState('')
  const [msg, setMsg] = useState('')

  const load = async () => {
    const res = await api.get('/ip-allowlist/')
    setEntries(res.data)
  }
  useEffect(() => { load() }, [])

  const add = async () => {
    try {
      await api.post('/ip-allowlist/', { cidr, label: label || null })
      setCidr(''); setLabel('')
      setMsg('Entry added.')
      load()
    } catch (e: any) { setMsg(e.response?.data?.detail || 'Error') }
  }

  const remove = async (id: string) => {
    await api.delete(`/ip-allowlist/${id}`)
    load()
  }

  const toggle = async (id: string) => {
    await api.patch(`/ip-allowlist/${id}/toggle`)
    load()
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-400 text-sm">
        Restrict API key usage to specific IP addresses or CIDR ranges.
        When no entries exist, all IPs are permitted.
      </p>

      {msg && <p className="text-sm text-blue-400">{msg}</p>}

      <div className="flex gap-3 flex-wrap">
        <input value={cidr} onChange={e => setCidr(e.target.value)} placeholder="203.0.113.0/24"
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm w-48 focus:outline-none focus:border-blue-500" />
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label (optional)"
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm w-44 focus:outline-none focus:border-blue-500" />
        <button onClick={add} disabled={!cidr}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 flex items-center gap-2 transition-all">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      <div className="space-y-2">
        {entries.length === 0 && (
          <p className="text-gray-500 text-sm">No allowlist entries — all IPs permitted.</p>
        )}
        {entries.map(e => (
          <div key={e.id} className="flex items-center justify-between bg-white/3 border border-white/10 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-white text-sm font-mono">{e.cidr}</p>
                {e.label && <p className="text-gray-400 text-xs">{e.label}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={e.is_active ? 'green' : 'yellow'}>{e.is_active ? 'Active' : 'Disabled'}</Badge>
              <button onClick={() => toggle(e.id)} className="text-gray-400 hover:text-yellow-400 transition-colors" title="Toggle">
                <RefreshCw className="h-4 w-4" />
              </button>
              <button onClick={() => remove(e.id)} className="text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Sessions Section ─────────────────────────────────────────────────────────

function SessionsSection() {
  const [sessions, setSessions] = useState<SessionEntry[]>([])

  const load = async () => {
    try {
      const res = await api.get('/sessions/')
      setSessions(res.data)
    } catch { setSessions([]) }
  }
  useEffect(() => { load() }, [])

  const revoke = async (id: string) => {
    await api.delete(`/sessions/${id}`)
    load()
  }

  const revokeAll = async () => {
    await api.delete('/sessions/')
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">Active sessions across all your devices.</p>
        {sessions.length > 1 && (
          <button onClick={revokeAll}
            className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded-xl px-3 py-1.5 transition-colors">
            Revoke all other sessions
          </button>
        )}
      </div>

      <div className="space-y-2">
        {sessions.map(s => (
          <div key={s.id} className="flex items-center justify-between bg-white/3 border border-white/10 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <Monitor className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-white text-sm flex items-center gap-2">
                  {s.device_info || 'Unknown device'}
                  {s.is_current && <Badge variant="green">Current</Badge>}
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {s.ip_address} · Last active {new Date(s.last_active_at).toLocaleString()}
                </p>
              </div>
            </div>
            {!s.is_current && (
              <button onClick={() => revoke(s.id)} className="text-gray-400 hover:text-red-400 transition-colors">
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Security() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Security</h1>
        <p className="text-gray-400 mt-1">Manage authentication, access control, and active sessions.</p>
      </div>

      <div className="grid gap-6">
        <Card title="Two-Factor Authentication" icon={Smartphone}>
          <MFASection />
        </Card>

        <Card title="IP Allowlist" icon={Globe}>
          <IPAllowlistSection />
        </Card>

        <Card title="Active Sessions" icon={Monitor}>
          <SessionsSection />
        </Card>
      </div>
    </div>
  )
}
