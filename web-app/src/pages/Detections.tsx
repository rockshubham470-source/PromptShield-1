import React, { useState, useEffect, useCallback } from 'react'
import { getApplications } from '../services/applicationService'
import api from '../lib/api.service'

import {
  Search, Eye, Download, X, AlertTriangle, RefreshCw,
  ChevronLeft, ChevronRight, Copy, Check, Clock, Cpu,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Detection {
  id: string
  prompt: string
  detected_patterns: string
  risk_level: 'safe' | 'caution' | 'risky' | 'critical'
  risk_score: number
  processing_time_ms: number
  user_id: string
  application_id: string
  created_at: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RISK_STYLES: Record<string, string> = {
  safe:     'bg-green-500/20 text-green-400 border border-green-500/30',
  caution:  'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  risky:    'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  critical: 'bg-red-500/20 text-red-400 border border-red-500/30',
}

function RiskBadge({ level }: { level: string }) {
  const cls = RISK_STYLES[level] ?? RISK_STYLES.safe
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {level}
    </span>
  )
}

function parsePatterns(raw: string): string[] {
  try {
    const p = JSON.parse(raw)
    return Array.isArray(p) ? p : [String(p)]
  } catch {
    return raw ? [raw] : []
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

const PAGE_SIZE = 20

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ detection, appName, onClose }: {
  detection: Detection
  appName: string
  onClose: () => void
}) {
  const patterns = parsePatterns(detection.detected_patterns)
  const riskCls = RISK_STYLES[detection.risk_level] ?? RISK_STYLES.safe

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-[#0F1629] border border-white/10 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <h2 className="text-white font-bold text-lg">Detection Detail</h2>
            <RiskBadge level={detection.risk_level} />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* Meta row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Risk Score</p>
              <p className={`text-2xl font-bold ${detection.risk_score >= 85 ? 'text-red-400' : detection.risk_score >= 60 ? 'text-orange-400' : 'text-green-400'}`}>
                {detection.risk_score}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1 flex items-center gap-1"><Clock className="h-3 w-3" /> Processed in</p>
              <p className="text-white font-bold text-lg">{detection.processing_time_ms ?? '—'}<span className="text-xs text-gray-400 font-normal ml-1">ms</span></p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1 flex items-center gap-1"><Cpu className="h-3 w-3" /> Application</p>
              <p className="text-white font-semibold text-sm truncate">{appName}</p>
            </div>
          </div>

          {/* Prompt */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Prompt</p>
              <CopyButton text={detection.prompt} />
            </div>
            <div className="bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-gray-300 text-sm whitespace-pre-wrap break-words font-mono max-h-48 overflow-y-auto">
              {detection.prompt || <span className="text-gray-600">No prompt recorded</span>}
            </div>
          </div>

          {/* Detected Patterns */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Detected Patterns</p>
            {patterns.length === 0 ? (
              <p className="text-gray-600 text-sm">None detected</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {patterns.map((p, i) => (
                  <span key={i} className={`px-3 py-1 rounded-xl border text-xs font-medium ${riskCls}`}>{p}</span>
                ))}
              </div>
            )}
          </div>

          {/* Footer metadata */}
          <div className="border-t border-white/10 pt-4 grid grid-cols-2 gap-3 text-xs text-gray-400">
            <div><span className="text-gray-600">Detection ID</span><br /><span className="font-mono text-gray-300">{detection.id}</span></div>
            <div><span className="text-gray-600">Timestamp</span><br /><span className="text-gray-300">{new Date(detection.created_at).toLocaleString()}</span></div>
            <div><span className="text-gray-600">User ID</span><br /><span className="font-mono text-gray-300">{detection.user_id || '—'}</span></div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Detections() {
  const [data, setData] = useState<Detection[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [applications, setApplications] = useState<any[]>([])
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('all')
  const [selectedApp, setSelectedApp] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  // Pagination
  const [page, setPage] = useState(1)

  const fetchData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true)
    try {
      const res = await api.get('/detections')
      const list = Array.isArray(res.data) ? res.data : res.data?.items ?? []
      setData(list)
    } catch { /* handled below */ }
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    getApplications().then(r => setApplications(r.data)).catch(() => {})
  }, [])

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filtered = data.filter(item => {
    const q = search.toLowerCase()
    const matchSearch = !q
      || (item.prompt ?? '').toLowerCase().includes(q)
      || (item.detected_patterns ?? '').toLowerCase().includes(q)
      || (item.user_id ?? '').toLowerCase().includes(q)

    const matchRisk = riskFilter === 'all' || item.risk_level === riskFilter
    const matchApp = !selectedApp || item.application_id === selectedApp

    let matchDate = true
    if (dateRange.start || dateRange.end) {
      const t = new Date(item.created_at).getTime()
      if (dateRange.start && t < new Date(dateRange.start).getTime()) matchDate = false
      if (dateRange.end && t > new Date(dateRange.end).getTime() + 86400000) matchDate = false
    }

    return matchSearch && matchRisk && matchApp && matchDate
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Reset page when filters change
  useEffect(() => setPage(1), [search, riskFilter, selectedApp, dateRange])

  // ── Export CSV ──────────────────────────────────────────────────────────────

  const exportCSV = () => {
    const rows = ['Timestamp,Application,Pattern,User,Risk,Score']
    filtered.forEach(item => {
      const app = applications.find(a => a.id === item.application_id)
      const pattern = (parsePatterns(item.detected_patterns)[0] ?? '').replace(/"/g, '""')
      rows.push(`"${item.created_at}","${app?.name ?? item.application_id}","${pattern}","${item.user_id ?? ''}","${item.risk_level}","${item.risk_score}"`)
    })
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `promptshield-${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Detections</h1>
          <p className="text-gray-400 mt-1">All prompt injection events across your applications</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-xl px-3 py-2 hover:bg-white/5 transition-all disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-2 transition-all">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text" placeholder="Search prompt, pattern, user…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Risk level */}
          <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 appearance-none">
            <option value="all">All Risk Levels</option>
            <option value="safe">Safe</option>
            <option value="caution">Caution</option>
            <option value="risky">Risky</option>
            <option value="critical">Critical</option>
          </select>

          {/* Application */}
          <select value={selectedApp} onChange={e => setSelectedApp(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 appearance-none">
            <option value="">All Applications</option>
            {applications.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>

          {/* Date range */}
          <div className="flex gap-2">
            <input type="date" value={dateRange.start}
              onChange={e => setDateRange(d => ({ ...d, start: e.target.value }))}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
            <input type="date" value={dateRange.end}
              onChange={e => setDateRange(d => ({ ...d, end: e.target.value }))}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
          </div>

        </div>

        {/* Active filter summary */}
        {filtered.length !== data.length && (
          <p className="text-xs text-gray-400 mt-3">
            Showing <span className="text-white font-medium">{filtered.length}</span> of {data.length} detections
          </p>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">

        {loading ? (
          <div className="p-6 space-y-3">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <AlertTriangle className="h-10 w-10 text-gray-600 mx-auto mb-3" />
            <p className="text-white font-medium">No detections found</p>
            <p className="text-gray-500 text-sm mt-1">
              {data.length === 0
                ? 'Start sending prompts via the API to see results here.'
                : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['Time', 'Application', 'Pattern', 'User', 'Risk', 'Score', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wide font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pageItems.map(d => {
                  const app = applications.find(a => a.id === d.application_id)
                  const pattern = parsePatterns(d.detected_patterns)[0] ?? '—'
                  return (
                    <tr key={d.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap text-xs">
                        {new Date(d.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-gray-300 max-w-[120px] truncate">
                        {app?.name ?? d.application_id ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 text-gray-300 max-w-[180px] truncate">{pattern}</td>
                      <td className="px-5 py-3.5 text-gray-400 font-mono text-xs max-w-[100px] truncate">
                        {d.user_id || '—'}
                      </td>
                      <td className="px-5 py-3.5"><RiskBadge level={d.risk_level} /></td>
                      <td className="px-5 py-3.5 text-white font-mono">{d.risk_score}</td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => setSelectedDetection(d)}
                          className="text-gray-400 hover:text-blue-400 transition-colors p-1 rounded-lg hover:bg-blue-500/10">
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-white/10">
                <p className="text-xs text-gray-500">
                  Page {page} of {totalPages} · {filtered.length} results
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-white border border-white/10 rounded-xl px-3 py-1.5 disabled:opacity-40 hover:bg-white/5 transition-all">
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-white border border-white/10 rounded-xl px-3 py-1.5 disabled:opacity-40 hover:bg-white/5 transition-all">
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail modal */}
      {selectedDetection && (
        <DetailModal
          detection={selectedDetection}
          appName={applications.find(a => a.id === selectedDetection.application_id)?.name ?? selectedDetection.application_id ?? 'Unknown'}
          onClose={() => setSelectedDetection(null)}
        />
      )}

    </div>
  )
}