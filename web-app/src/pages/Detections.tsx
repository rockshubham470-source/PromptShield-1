import React, { useState, useEffect } from 'react'
import { useData } from '../hooks/useData'
import { getApplications } from '../services/applicationService'

import {
  Search,
  Eye,
  Download,
  X,
  AlertTriangle,
} from 'lucide-react'

export default function Detections() {
  const { loading, data } = useData('/detections')

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

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      const response = await getApplications()
      setApplications(response.data)
    } catch (error) {
      console.error(error)
    }
  }

  // Helper to format date for comparison (assuming ISO strings from backend)
  const isInRange = (timestamp: string) => {
    if (!dateRange.start && !dateRange.end) return true
    const time = new Date(timestamp).getTime()
    const start = dateRange.start ? new Date(dateRange.start).getTime() : -Infinity
    const end = dateRange.end ? new Date(dateRange.end).getTime() : Infinity
    return time >= start && time <= end
  }

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

      const matchesDate = isInRange(item.created_at)

      return (
        matchesSearch &&
        matchesRisk &&
        matchesApplication &&
        matchesDate
      )
    })

  if (loading) {
    return (
      <div className="p-8 text-white">
        Loading detections...
      </div>
    )
  }

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
                  const app = applications.find((a: any) => a.id === selectedDetection.application_id)
                  return app ? app.name : selectedDetection.application_id || 'Unknown'
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
                    return Array.isArray(parsed) ? parsed.join(', ') : selectedDetection.detected_patterns
                  } catch (e) {
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

    </div>
  )
}