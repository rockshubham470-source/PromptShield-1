import React, { useState, useEffect } from 'react'
import { Webhook, Plus, Trash2, TestTube2, Copy, Check, ChevronDown, ChevronUp, Power } from 'lucide-react'
import api from '../lib/api.service'

interface WebhookEntry {
  id: string
  name: string
  url: string
  events: string[]
  is_active: boolean
  created_at: string
  last_triggered_at: string | null
  last_status_code: number | null
  failure_count: number
}

const ALL_EVENTS = [
  { value: 'detection.created', label: 'Every Detection', desc: 'Fires on every analyzed prompt' },
  { value: 'detection.critical', label: 'Critical Detections', desc: 'Only risk_level = critical' },
  { value: 'detection.risky', label: 'Risky Detections', desc: 'risk_level = risky or critical' },
  { value: 'rule.created', label: 'Rule Created', desc: 'When a new rule is added' },
  { value: 'rule.updated', label: 'Rule Updated', desc: 'When a rule is modified' },
  { value: 'api_key.created', label: 'API Key Created', desc: 'New API key issued' },
  { value: 'api_key.revoked', label: 'API Key Revoked', desc: 'API key revoked' },
]

function StatusBadge({ code, failures }: { code: number | null; failures: number }) {
  if (code === null) return <span className="text-xs text-gray-500">Never triggered</span>
  const ok = code < 400
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded ${ok
      ? 'bg-green-500/20 text-green-400'
      : 'bg-red-500/20 text-red-400'
    }`}>
      {code} {!ok && failures > 0 && `(${failures} fails)`}
    </span>
  )
}

function WebhookRow({ wh, onDelete, onTest, onToggle }: {
  wh: WebhookEntry
  onDelete: () => void
  onTest: () => void
  onToggle: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyUrl = () => {
    navigator.clipboard.writeText(wh.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`border rounded-2xl overflow-hidden transition-colors ${wh.is_active ? 'border-white/10' : 'border-white/5 opacity-60'}`}>
      <div className="flex items-center justify-between px-5 py-4 bg-white/3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-2 w-2 rounded-full flex-shrink-0 ${wh.is_active ? 'bg-green-400' : 'bg-gray-500'}`} />
          <div className="min-w-0">
            <p className="text-white font-medium text-sm">{wh.name}</p>
            <p className="text-gray-400 text-xs font-mono truncate max-w-xs">{wh.url}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge code={wh.last_status_code} failures={wh.failure_count} />
          <button onClick={copyUrl} className="text-gray-400 hover:text-white transition-colors" title="Copy URL">
            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
          </button>
          <button onClick={onTest} className="text-gray-400 hover:text-blue-400 transition-colors" title="Send test ping">
            <TestTube2 className="h-4 w-4" />
          </button>
          <button onClick={onToggle} className={`transition-colors ${wh.is_active ? 'text-green-400 hover:text-yellow-400' : 'text-gray-500 hover:text-green-400'}`} title="Toggle">
            <Power className="h-4 w-4" />
          </button>
          <button onClick={onDelete} className="text-gray-400 hover:text-red-400 transition-colors" title="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-white transition-colors">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 py-4 border-t border-white/10 bg-white/2 space-y-3">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Subscribed Events</p>
            <div className="flex flex-wrap gap-2">
              {wh.events.map(ev => (
                <span key={ev} className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg px-2 py-0.5">
                  {ev}
                </span>
              ))}
            </div>
          </div>
          {wh.last_triggered_at && (
            <p className="text-xs text-gray-400">
              Last triggered: {new Date(wh.last_triggered_at).toLocaleString()}
            </p>
          )}
          <div className="bg-black/30 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Verify delivery — check HMAC-SHA256 signature:</p>
            <code className="text-xs text-green-300">
              X-PromptShield-Signature: sha256=&lt;HMAC-SHA256(secret, body)&gt;
            </code>
          </div>
        </div>
      )}
    </div>
  )
}

function CreateWebhookModal({ onClose, onCreated }: { onClose: () => void; onCreated: (secret: string) => void }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleEvent = (ev: string) => {
    setSelectedEvents(prev =>
      prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]
    )
  }

  const create = async () => {
    if (!name || !url || selectedEvents.length === 0) {
      setError('All fields and at least one event are required.')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/webhooks/', { name, url, events: selectedEvents })
      onCreated(res.data.secret)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error creating webhook')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0D1424] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-5">
        <h3 className="text-lg font-semibold text-white">Create Webhook</h3>

        <div className="space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Webhook name"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://your-server.com/webhook"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 font-mono" />
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-3">Select events to subscribe:</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {ALL_EVENTS.map(ev => (
              <label key={ev.value} className="flex items-start gap-3 cursor-pointer group">
                <div className={`mt-0.5 h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                  selectedEvents.includes(ev.value) ? 'bg-blue-600 border-blue-600' : 'border-white/20 group-hover:border-white/40'
                }`} onClick={() => toggleEvent(ev.value)}>
                  {selectedEvents.includes(ev.value) && <Check className="h-3 w-3 text-white" />}
                </div>
                <div>
                  <p className="text-white text-sm">{ev.label}</p>
                  <p className="text-gray-400 text-xs">{ev.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button onClick={create} disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2.5 text-sm font-medium transition-all disabled:opacity-50">
            {loading ? 'Creating…' : 'Create Webhook'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white border border-white/10 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newSecret, setNewSecret] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const load = async () => {
    const res = await api.get('/webhooks/')
    setWebhooks(res.data)
  }
  useEffect(() => { load() }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const deleteWh = async (id: string) => {
    await api.delete(`/webhooks/${id}`)
    load()
    showToast('Webhook deleted.')
  }

  const testWh = async (id: string) => {
    await api.post(`/webhooks/${id}/test`)
    showToast('Test ping sent!')
  }

  const toggleWh = async (id: string, current: boolean) => {
    await api.patch(`/webhooks/${id}`, { is_active: !current })
    load()
  }

  const handleCreated = (secret: string) => {
    setShowCreate(false)
    setNewSecret(secret)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Webhooks</h1>
          <p className="text-gray-400 mt-1">Receive real-time event notifications via HTTPS with HMAC-SHA256 signatures.</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-all">
          <Plus className="h-4 w-4" /> Add Webhook
        </button>
      </div>

      {toast && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2.5 text-blue-300 text-sm">
          {toast}
        </div>
      )}

      {newSecret && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 space-y-2">
          <p className="text-yellow-300 font-medium text-sm flex items-center gap-2">
            <span>⚠️</span> Save this secret — it will not be shown again
          </p>
          <div className="bg-black/40 rounded-xl px-3 py-2 flex items-center gap-2">
            <code className="text-xs text-green-300 flex-1 break-all">{newSecret}</code>
            <button onClick={() => { navigator.clipboard.writeText(newSecret); showToast('Secret copied!') }}
              className="text-gray-400 hover:text-white">
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <p className="text-gray-400 text-xs">Use this to verify the <code className="text-green-300">X-PromptShield-Signature</code> header on incoming requests.</p>
          <button onClick={() => setNewSecret(null)} className="text-xs text-gray-400 hover:text-white mt-1">Dismiss</button>
        </div>
      )}

      {webhooks.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
          <Webhook className="h-10 w-10 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No webhooks configured yet</p>
          <button onClick={() => setShowCreate(true)} className="mt-4 text-blue-400 hover:text-blue-300 text-sm">
            + Create your first webhook
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map(wh => (
            <WebhookRow
              key={wh.id}
              wh={wh}
              onDelete={() => deleteWh(wh.id)}
              onTest={() => testWh(wh.id)}
              onToggle={() => toggleWh(wh.id, wh.is_active)}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateWebhookModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
    </div>
  )
}
