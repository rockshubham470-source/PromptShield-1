import React, { useEffect, useState } from 'react'
import api from '../lib/api.service'

export const UsageStats = () => {
  const [stats, setStats] = useState<{requests: number; blocked: number} | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/usage/daily')
        setStats(res.data)
      } catch (err: any) {
        console.error(err)
        setError('Failed to load usage stats')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return <div className="text-sm text-gray-400">Loading usage…</div>
  if (error) return <div className="text-sm text-red-400">{error}</div>
  if (!stats) return <div className="text-sm text-gray-400">No usage data</div>

  return (
    <div className="text-sm text-gray-400 flex items-center gap-3">
      <div>Requests: {stats.requests}</div>
      <div className="border-l border-white/20 pl-3 ml-3">Blocked: {stats.blocked}</div>
    </div>
  )
}