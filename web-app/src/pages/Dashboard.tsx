import React, { useEffect, useState } from 'react'
import CountUp from 'react-countup'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  TrendingUp,
  CheckCircle,
  Zap,
} from 'lucide-react'

import { BarChartComponent } from '../components/Charts'
import KPIDetailModal from '../components/KPIDetailModal'
import { useDashboardStore } from '../stores/useDashboardStore'
import { socket } from '../services/socket'

/* ---------------- KPI CARD ---------------- */

function StatCard({ icon, label, value, color }: any) {
  const setSelectedMetric = useDashboardStore(
    (s) => s.setSelectedMetric
  )

  const numeric = Number(value.toString().replace(/[^0-9]/g, ''))

  return (
    <div
      onClick={() => setSelectedMetric(label)}
      className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-blue-500/40 transition"
    >
      <div className="flex justify-between items-center">
        <div>
          <div className="text-gray-400 text-xs">{label}</div>

          <div className="text-2xl font-bold text-white mt-1">
            <CountUp end={numeric} duration={1.2} />
          </div>
        </div>

        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

/* ---------------- DASHBOARD ---------------- */

export default function Dashboard() {
  const { filter, setFilter } = useDashboardStore()

  const [loading, setLoading] = useState(true)
  const [liveStats, setLiveStats] = useState<any>(null)

  /* MOCK DATA (replace with API later) */
  const stats = {
    '24h': { detections: '1,245', critical: '24', safe: '1,110', latency: '32ms' },
    '7d': { detections: '12,543', critical: '247', safe: '11,298', latency: '45ms' },
    '30d': { detections: '52,412', critical: '874', safe: '48,291', latency: '48ms' },
    '90d': { detections: '164,821', critical: '2,945', safe: '151,893', latency: '51ms' },
  }[filter]

  /* LOADING */
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900)
    return () => clearTimeout(t)
  }, [])

  /* REAL-TIME SOCKET */
  useEffect(() => {
    socket.on('metric_update', (data) => {
      setLiveStats(data)
    })

    return () => {
      socket.off('metric_update')
    }
  }, [])

  return (
    <div className="p-6 space-y-8 bg-[#0A0F1C]">

      {/* MODAL */}
      <KPIDetailModal />

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Security Dashboard
        </h1>
        <p className="text-gray-400 mt-1">
          Real-time observability & threat intelligence system
        </p>
      </div>

      {/* FILTER */}
      <div className="flex gap-2">
        {['24h', '7d', '30d', '90d'].map((p) => (
          <button
            key={p}
            onClick={() => setFilter(p as any)}
            className={`px-4 py-2 rounded-xl text-sm transition ${
              filter === p
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-gray-400'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-white/5 animate-pulse"
            />
          ))
        ) : (
          <>
            <StatCard
              icon={<AlertCircle className="text-orange-400" />}
              label="Total Detections"
              value={stats?.detections}
              color="bg-orange-500/10"
            />

            <StatCard
              icon={<TrendingUp className="text-red-400" />}
              label="Critical Alerts"
              value={stats?.critical}
              color="bg-red-500/10"
            />

            <StatCard
              icon={<CheckCircle className="text-green-400" />}
              label="Safe Inputs"
              value={stats?.safe}
              color="bg-green-500/10"
            />

            <StatCard
              icon={<Zap className="text-blue-400" />}
              label="Avg Latency"
              value={stats?.latency}
              color="bg-blue-500/10"
            />
          </>
        )}

      </div>

      {/* LIVE FEED INDICATOR */}
      {liveStats && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-green-400"
        >
          🔴 Live update received from stream
        </motion.div>
      )}

      {/* CHART */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-white font-semibold">
            Security Signal Overview
          </h2>

          <span className="text-gray-400 text-sm">
            Last {filter}
          </span>
        </div>

        <BarChartComponent />
      </div>

      {/* RECENT ACTIVITY */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-white font-semibold mb-4">
          Recent Detections
        </h3>

        <table className="w-full text-sm">
          <tbody>
            {[
              ['Direct Injection', 'Critical', 96],
              ['Jailbreak Attempt', 'High', 91],
              ['Prompt Leak', 'Medium', 84],
            ].map(([pattern, risk, score], i) => (
              <tr key={i} className="border-t border-white/5">
                <td className="py-3 text-gray-300">
                  {pattern}
                </td>
                <td className="py-3 text-red-400">
                  {risk}
                </td>
                <td className="py-3 text-white font-mono">
                  {score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}