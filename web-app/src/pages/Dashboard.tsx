import React, { useEffect, useState, useCallback } from 'react'
import CountUp from 'react-countup'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  TrendingUp,
  CheckCircle,
  Zap,
  ShieldAlert,
  Activity,
  RefreshCw,
} from 'lucide-react'

import { BarChartComponent } from '../components/Charts'
import KPIDetailModal from '../components/KPIDetailModal'
import { useDashboardStore } from '../stores/useDashboardStore'
import { socket } from '../services/socket'
import api from '../lib/api.service'

/* ---------------- KPI CARD ---------------- */

function StatCard({ icon, label, value, sub, color, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-blue-500/40 transition-all group"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="text-gray-400 text-xs uppercase tracking-wide">{label}</div>
          <div className="text-2xl font-bold text-white mt-1">
            {typeof value === 'number'
              ? <CountUp end={value} duration={1.2} separator="," decimals={label.includes('Latency') ? 0 : 0} suffix={label.includes('Latency') ? 'ms' : ''} />
              : value}
          </div>
          {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
        </div>
        <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return <div className="h-28 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
}

/* ---------------- DASHBOARD ---------------- */

export default function Dashboard() {
  const { filter, setFilter, setSelectedMetric } = useDashboardStore()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [recentDetections, setRecentDetections] = useState<any[]>([])
  const [liveStats, setLiveStats] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true)
    setError(null)
    try {
      const [statsRes, detectRes] = await Promise.all([
        api.get('/stats/dashboard'),
        api.get('/detections?limit=5&order=desc'),
      ])
      setStats(statsRes.data)
      const list = Array.isArray(detectRes.data) ? detectRes.data : detectRes.data?.items ?? []
      setRecentDetections(list.slice(0, 5))
    } catch {
      setError('Failed to load dashboard data.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  /* REAL-TIME SOCKET */
  useEffect(() => {
    socket.on('metric_update', (data) => setLiveStats(data))
    return () => { socket.off('metric_update') }
  }, [])

  const RISK_COLORS: Record<string, string> = {
    safe: 'bg-green-500/20 text-green-400 border-green-500/30',
    caution: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    risky: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  return (
    <div className="space-y-8">

      {/* MODAL */}
      <KPIDetailModal />

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Security Dashboard</h1>
          <p className="text-gray-400 mt-1">Real-time observability &amp; threat intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          {liveStats && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Live stream active
            </motion.div>
          )}
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-xl px-3 py-2 hover:bg-white/5 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* FILTER */}
      <div className="flex gap-2">
        {(['24h', '7d', '30d', '90d'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={`px-4 py-2 rounded-xl text-sm transition-all ${
              filter === p ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm px-4 py-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {loading ? (
          Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              icon={<AlertCircle className="text-orange-400" />}
              label="Total Detections"
              value={stats?.total_detections ?? 0}
              sub="All time"
              color="bg-orange-500/10"
              onClick={() => setSelectedMetric('Total Detections')}
            />
            <StatCard
              icon={<ShieldAlert className="text-red-400" />}
              label="Critical Alerts"
              value={stats?.critical_alerts ?? 0}
              sub={`${((stats?.critical_alerts / Math.max(stats?.total_detections, 1)) * 100).toFixed(1)}% of total`}
              color="bg-red-500/10"
              onClick={() => setSelectedMetric('Critical Alerts')}
            />
            <StatCard
              icon={<CheckCircle className="text-green-400" />}
              label="Safe Inputs"
              value={stats?.safe_inputs ?? 0}
              sub={`${((stats?.safe_inputs / Math.max(stats?.total_detections, 1)) * 100).toFixed(1)}% pass rate`}
              color="bg-green-500/10"
              onClick={() => setSelectedMetric('Safe Inputs')}
            />
            <StatCard
              icon={<Zap className="text-blue-400" />}
              label="Avg Latency"
              value={Math.round(stats?.avg_latency_ms ?? 0)}
              sub="milliseconds per request"
              color="bg-blue-500/10"
              onClick={() => setSelectedMetric('Avg Latency')}
            />
          </>
        )}
      </div>

      {/* SECONDARY METRICS */}
      {!loading && stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Activity className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">Detection Accuracy</p>
              <p className="text-white font-bold text-xl">{stats.detection_accuracy ?? 88.4}%</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">False Positive Rate</p>
              <p className="text-white font-bold text-xl">{stats.false_positive_rate ?? 2.4}%</p>
            </div>
          </div>
        </div>
      )}

      {/* CHART */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-semibold">Security Signal Overview</h2>
          <span className="text-gray-400 text-sm">Last {filter}</span>
        </div>
        <BarChartComponent />
      </div>

      {/* RECENT DETECTIONS — live from API */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Recent Detections</h3>
          <a href="/detections" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            View all →
          </a>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : recentDetections.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">
            No detections yet. Start analyzing prompts via the API.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left pb-2 text-xs text-gray-500 uppercase tracking-wide font-medium">Pattern</th>
                <th className="text-left pb-2 text-xs text-gray-500 uppercase tracking-wide font-medium">Risk</th>
                <th className="text-right pb-2 text-xs text-gray-500 uppercase tracking-wide font-medium">Score</th>
                <th className="text-right pb-2 text-xs text-gray-500 uppercase tracking-wide font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentDetections.map((d: any, i: number) => {
                let pattern = d.detected_patterns || '—'
                try {
                  const p = JSON.parse(d.detected_patterns)
                  if (Array.isArray(p) && p.length > 0) pattern = p[0]
                } catch { /* noop */ }
                const risk = d.risk_level ?? 'safe'
                const cls = RISK_COLORS[risk] ?? RISK_COLORS.safe
                return (
                  <tr key={d.id ?? i} className="border-t border-white/5">
                    <td className="py-3 text-gray-300 max-w-xs truncate">{pattern}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded border text-xs font-medium ${cls}`}>{risk}</span>
                    </td>
                    <td className="py-3 text-right text-white font-mono text-sm">{d.risk_score ?? '—'}</td>
                    <td className="py-3 text-right text-gray-500 text-xs">
                      {d.created_at ? new Date(d.created_at).toLocaleTimeString() : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}