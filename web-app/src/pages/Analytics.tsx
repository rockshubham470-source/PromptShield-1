import React, { useEffect, useState } from 'react'
import {
  Shield,
  AlertTriangle,
  Zap,
  TrendingUp,
  Activity,
  RefreshCw,
} from 'lucide-react'
import { TrendChart, RiskDistributionChart, BarChartComponent } from '../components/Charts'
import api from '../lib/api.service'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AnalyticsData {
  period: string
  total_detections: number
  by_risk_level: Record<string, number>
  top_patterns: Array<{ name: string; count: number; percentage: number }>
  avg_accuracy: number
  avg_latency_ms: number
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skel({ h = 'h-16' }: { h?: string }) {
  return <div className={`${h} rounded-xl bg-white/5 animate-pulse`} />
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Analytics() {
  const [period, setPeriod] = useState('7d')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true)
    try {
      const res = await api.get(`/stats/analytics?period=${period}`)
      setData(res.data)
    } catch { /* silent */ }
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { load() }, [period]) // eslint-disable-line

  const total = data?.total_detections ?? 0
  const byRisk = data?.by_risk_level ?? {}
  const topPatterns = data?.top_patterns ?? []

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Analytics</h1>
          <p className="text-gray-400 mt-1">Real-time intelligence across all applications</p>
        </div>
        <div className="flex items-center gap-2">
          {(['24h', '7d', '30d', '90d'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm transition-all ${period === p ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
              {p}
            </button>
          ))}
          <button onClick={() => load(true)} disabled={refreshing}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-xl px-3 py-2 hover:bg-white/5 transition-all disabled:opacity-50 ml-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array(4).fill(0).map((_, i) => <Skel key={i} />) : (
          <>
            <MetricCard icon={<Shield className="h-4 w-4 text-green-400" />} label="Total Detections" value={total.toLocaleString()} color="bg-green-500/10" />
            <MetricCard icon={<AlertTriangle className="h-4 w-4 text-red-400" />} label="Critical" value={(byRisk.critical ?? 0).toLocaleString()} sub={`${total ? ((byRisk.critical ?? 0) / total * 100).toFixed(1) : 0}% of total`} color="bg-red-500/10" />
            <MetricCard icon={<Zap className="h-4 w-4 text-blue-400" />} label="Avg Latency" value={`${Math.round(data?.avg_latency_ms ?? 0)}ms`} color="bg-blue-500/10" />
            <MetricCard icon={<TrendingUp className="h-4 w-4 text-purple-400" />} label="Detection Accuracy" value={`${data?.avg_accuracy ?? 0}%`} color="bg-purple-500/10" />
          </>
        )}
      </div>

      {/* Charts + Risk breakdown */}
      <div className="grid grid-cols-12 gap-6">

        <div className="col-span-8 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-white font-semibold mb-4">Detection Trend</p>
            <TrendChart />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-white font-semibold mb-4">Risk Distribution</p>
              <RiskDistributionChart />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-white font-semibold mb-4">Volume by Day</p>
              <BarChartComponent />
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-4">

          {/* Risk level breakdown */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-white font-semibold mb-4">By Risk Level</p>
            {loading ? <Skel h="h-32" /> : (
              <div className="space-y-3">
                {[
                  { key: 'safe', label: 'Safe', cls: 'bg-green-500' },
                  { key: 'caution', label: 'Caution', cls: 'bg-yellow-500' },
                  { key: 'risky', label: 'Risky', cls: 'bg-orange-500' },
                  { key: 'critical', label: 'Critical', cls: 'bg-red-500' },
                ].map(({ key, label, cls }) => {
                  const count = byRisk[key] ?? 0
                  const pct = total ? Math.round(count / total * 100) : 0
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">{label}</span>
                        <span className="text-white font-medium">{count.toLocaleString()} <span className="text-gray-500">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10">
                        <div className={`h-1.5 rounded-full ${cls}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Top patterns */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-white font-semibold mb-4">Top Attack Patterns</p>
            {loading ? <Skel h="h-32" /> : topPatterns.length === 0 ? (
              <p className="text-gray-500 text-sm">No patterns detected yet.</p>
            ) : (
              <div className="space-y-2">
                {topPatterns.map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-gray-300 text-xs truncate flex-1">{p.name}</span>
                    <span className="text-white text-xs font-mono ml-2">{p.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live throughput */}
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
            <div className="flex items-center gap-2 text-green-400 text-xs mb-2">
              <Activity className="h-4 w-4" />
              Live Status
            </div>
            <p className="text-2xl font-bold text-white">{total.toLocaleString()}</p>
            <p className="text-gray-400 text-xs mt-1">total events in period</p>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center gap-4">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-gray-400 text-xs uppercase tracking-wide">{label}</p>
        <p className="text-white font-bold text-lg">{value}</p>
        {sub && <p className="text-gray-500 text-xs">{sub}</p>}
      </div>
    </div>
  )
}
