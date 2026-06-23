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
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  })

  const [applications, setApplications] = useState<any[]>([])
  const [selectedApplication, setSelectedApplication] =
    useState('')

  const [selectedDetection, setSelectedDetection] =
    useState<any>(null)

  const loadApplications = async () => {
    try {
      const response = await getApplications()
      setApplications(response.data)
    } catch (error) {
      console.error(error)
    }
  }

  const fetchDetections = async () => {
    setLoading(true)
    try {
      // Build query parameters based on filters
      const params = new URLSearchParams()

      if (search) {
        params.append('search', search)
      }
      if (filter && filter !== 'all') {
        params.append('risk_level', filter)
      }
      if (selectedApplication) {
        params.append('application_id', selectedApplication)
      }
      if (dateRange.start) {
        params.append('start_date', dateRange.start)
      }
      if (dateRange.end) {
        params.append('end_date', dateRange.end)
      }

      const queryString = params.toString()
      const url = queryString ? `/detections?${queryString}` : '/detections'

      const response = await api.get(url)
      setData(response.data || [])
    } catch (error) {
      console.error('Error fetching detections:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
  }, [])

  useEffect(() => {
    fetchDetections()
  }, [search, filter, selectedApplication, dateRange.start, dateRange.end])

  const getRiskBadge = (risk: string) => {
    const badges: Record<string, string> = {
      safe:
        'bg-green-500/20 text-green-400 border border-green-500/20',
      caution:
        'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20',
      risky:
        'bg-orange-500/20 text-orange-400 border border-orange-500/20',
      critical:
        'bg-red-500/20 text-red-400 border border-red-500/20',
    }

    return badges[risk]
  }

  // Export as CSV (more enterprise-friendly than JSON)
  const exportCSV = () => {
    const rows = []
    // Header
    rows.push('Timestamp,Application,Pattern,User,Risk,Score')
    // Data
    data?.forEach((item: any) => {
      const timestamp = item.created_at || ''
      // Find application name
      const app = applications.find((a: any) => a.id === item.application_id)
      const application_name = app ? app.name : item.application_id || ''
      const pattern = (item.detected_patterns || '').replace(/"/g, '""')
      const user = (item.user_id || '').replace(/"/g, '""')
      const risk = item.risk_level || ''
      const score = item.risk_score !== undefined ? item.risk_score : ''
      rows.push(`"${timestamp}","${application_name}","${pattern}","${user}","${risk}","${score}"`)
    })
    const csvContent = rows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `promptshield-detections-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    )
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredDetections =
    (data ?? []).filter((item) => {
      const matchesSearch =
        (item.prompt || '')
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (item.detected_patterns || '')
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (item.user_id || '')
          .toLowerCase()
          .includes(search.toLowerCase())

      const matchesRisk =
        filter === 'all'
          ? true
          : item.risk_level === filter

      const matchesApplication =
        selectedApplication === ''
          ? true
          : item.application_id === selectedApplication

      return (
        matchesSearch &&
        matchesRisk &&
        matchesApplication
      )
    })

  // Empty state
  if (!data || filteredDetections.length === 0) {
    return (
      <div className="p-8 text-white">
        No detections found.
      </div>
    )
  }

  return (
    <div className="p-8">
      {loading ? (
        <div className="p-8 text-white">
          Loading detections...
        </div>
      ) : (
        <>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Detections
          </h1>

          <p className="text-gray-400">
            View all prompt injection events
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 mb-8">
          <div className="grid lg:grid-cols-6 gap-4">

            <div>
              <label className="block mb-2 text-sm">
                Search
              </label>

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-3.5 text-gray-500"
                />

                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  className="w-full pl-11"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm">
                Risk Level
              </label>

              <select
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value)
                }
              >
                <option value="all">All</option>
                <option value="safe">Safe</option>
                <option value="caution">Caution</option>
                <option value="risky">Risky</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm">
                Application
              </label>

              <select
                value={selectedApplication}
                onChange={(e) =>
                  setSelectedApplication(
                    e.target.value
                  )
                }
              >
                <option value="">
                  All Applications
                </option>

                {applications.map((app: any) => (
                  <option
                    key={app.id}
                    value={app.id}
                  >
                    {app.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm">
                Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                  className="border border-white/10 rounded bg-white/5 px-3 py-2 text-white"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                  className="border border-white/10 rounded bg-white/5 px-3 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm">
                Export
              </label>

              <button
                onClick={exportCSV}
                className="btn-primary flex items-center gap-2"
              >
                <Download size={18} />
                Export CSV
              </button>
            </div>

            <div>
              <label className="block mb-2 text-sm">
                Refresh
              </label>
              <button
                onClick={() => {
                  // trigger refetch via useData hook (if it supports)
                  // For now just force a reload by toggling a dummy state
                  // In a real app you'd call a refetch function from useData
                  window.location.reload()
                }}
                className="btn-primary flex items-center gap-2"
              >
                <AlertTriangle size={18} />
                Refresh
              </button>
            </div>

          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 overflow-hidden">

          <table className="w-full">

            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4">
                  Time
                </th>
                <th className="text-left py-4">
                  Application
                </th>
                <th className="text-left py-4">
                  Pattern
                </th>
                <th className="text-left py-4">
                  User
                </th>
                <th className="text-left py-4">
                  Risk
                </th>
                <th className="text-left py-4">
                  Score
                </th>
                <th className="text-left py-4">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredDetections.map(
                (detection) => (
                  <tr
                    key={detection.id}
                    className="border-b border-white/5"
                  >
                    <td className="py-4">
                      {new Date(detection.created_at).toLocaleString()}
                    </td>

                    <td className="py-4">
                      {/* Lookup application name */}
                      {(() => {
                        const app = applications.find((a: any) => a.id === detection.application_id)
                        return app ? app.name : detection.application_id || 'Unknown'
                      })()}
                    </td>

                    <td className="py-4">
                      {/* Show detected patterns; if JSON string, try to parse and show first */}
                      {(() => {
                        try {
                          const parsed = JSON.parse(detection.detected_patterns)
                          if (Array.isArray(parsed) && parsed.length > 0) {
                            return parsed[0]
                          }
                          return detection.detected_patterns
                        } catch (e) {
                          return detection.detected_patterns
                        }
                      })()}
                    </td>

                    <td className="py-4">
                      {detection.user_id}
                    </td>

                    <td className="py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskBadge(
                          detection.risk_level
                        )}`}
                      >
                        {detection.risk_level}
                      </span>
                    </td>

                    <td className="py-4">
                      {detection.risk_score}
                    </td>

                    <td className="py-4">
                      <button
                        onClick={() =>
                          setSelectedDetection(
                            detection
                          )
                        }
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>

          </table>

        </div>

        {selectedDetection && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

            <div className="w-full max-w-2xl rounded-3xl bg-[#111827] p-8">

              <div className="flex justify-between mb-6">

                <h2 className="text-2xl font-bold">
                  Detection Details
                </h2>

                <button
                  onClick={() =>
                    setSelectedDetection(null)
                  }
                >
                  <X />
                </button>

              </div>

              <div className="space-y-4">

                <p>
  <strong>Application:</strong>{' '}
  {(() => {
    const app = applications.find(
      (a: any) => a.id === selectedDetection.application_id
    )

    return app
      ? app.name
      : selectedDetection.application_id || 'Unknown'
  })()}
</p>

               <p>
  <strong>Prompt:</strong>{' '}
  {selectedDetection.prompt}
</p>

                <p>
                  <strong>Detected Patterns:</strong>{' '}
                  {(() => {
                    try {
                      const parsed = JSON.parse(selectedDetection.detected_patterns)

                      return Array.isArray(parsed)
                        ? parsed.join(', ')
                        : selectedDetection.detected_patterns
                    } catch {
                      return selectedDetection.detected_patterns
                    }
                  })()}
                </p>

                <p>
                  <strong>Risk:</strong>{' '}
                  {selectedDetection.risk_level}
                </p>

                <p>
  <strong>Score:</strong>{' '}
  {selectedDetection.risk_score}
</p>

                <p>
  <strong>Processing Time (ms):</strong>{' '}
  {selectedDetection.processing_time_ms}
</p>

                <p>
  <strong>Timestamp:</strong>{' '}
  {new Date(selectedDetection.created_at).toLocaleString()}
</p>
              </div>

            </div>

          </div>
        )}

        </>
      )}
    </div>
  )
}