import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Shield, AlertTriangle, Zap, Wifi, WifiOff } from 'lucide-react'
import { socket } from '../services/socket'
import api from '../lib/api.service'

interface LiveEvent {
  id: string | number
  prompt_preview?: string
  risk_level: 'safe' | 'caution' | 'risky' | 'critical'
  risk_score: number
  processing_time_ms: number
  created_at: string
  source?: string
}

const RISK_STYLES: Record<string, string> = {
  safe:     'bg-green-500/15 text-green-400 border-green-500/30',
  caution:  'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  risky:    'bg-orange-500/15 text-orange-400 border-orange-500/30',
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
}

export default function LiveMonitoring() {
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [connected, setConnected] = useState(false)
  const [stats, setStats] = useState({ rps: 0, blocked: 0, avgLatency: 0 })
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const pushEvent = (e: LiveEvent) =>
    setEvents(prev => [e, ...prev].slice(0, 50)) // keep last 50

  // ── Socket listener ──────────────────────────────────────────────────────
  useEffect(() => {
    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)
    const onDetection = (data: LiveEvent) => pushEvent(data)

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('detection', onDetection)
    socket.on('metric_update', (data: any) => {
      setStats(s => ({ ...s, ...data }))
    })

    setConnected(socket.connected)
    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('detection', onDetection)
      socket.off('metric_update')
    }
  }, [])

  // ── Polling fallback (if socket not available) ───────────────────────────
  useEffect(() => {
    let lastSeen = ''

    const poll = async () => {
      try {
        const res = await api.get('/detections?limit=10&order=desc')
        const list: LiveEvent[] = Array.isArray(res.data) ? res.data : res.data?.items ?? []
        if (list.length === 0) return
        if (list[0].id?.toString() === lastSeen) return
        lastSeen = list[0].id?.toString()
        // Only push truly new events
        setEvents(prev => {
          const existingIds = new Set(prev.map(e => e.id?.toString()))
          const fresh = list.filter(e => !existingIds.has(e.id?.toString()))
          return [...fresh, ...prev].slice(0, 50)
        })
        // Rolling stats
        const blocked = list.filter(e => ['risky', 'critical'].includes(e.risk_level)).length
        const avgLat = list.reduce((a, e) => a + (e.processing_time_ms ?? 0), 0) / list.length
        setStats({ rps: list.length, blocked, avgLatency: Math.round(avgLat) })
      } catch { /* silent */ }
    }

    poll()
    pollRef.current = setInterval(poll, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const critical = events.filter(e => e.risk_level === 'critical').length
  const safe = events.filter(e => e.risk_level === 'safe').length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Monitoring</h1>
          <p className="text-gray-400 mt-1">Real-time detection stream (last 50 events)</p>
        </div>
        <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl border ${connected ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-gray-400 bg-white/5 border-white/10'}`}>
          {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {connected ? 'Socket connected' : 'Polling every 3s'}
        </div>
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: <Activity className="h-4 w-4 text-blue-400" />, label: 'Events Shown', value: events.length, color: 'bg-blue-500/10' },
          { icon: <AlertTriangle className="h-4 w-4 text-red-400" />, label: 'Critical', value: critical, color: 'bg-red-500/10' },
          { icon: <Shield className="h-4 w-4 text-green-400" />, label: 'Safe', value: safe, color: 'bg-green-500/10' },
          { icon: <Zap className="h-4 w-4 text-yellow-400" />, label: 'Avg Latency', value: `${stats.avgLatency}ms`, color: 'bg-yellow-500/10' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className={`rounded-2xl border border-white/10 ${color} p-4 flex items-center gap-3`}>
            <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center">{icon}</div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">{label}</p>
              <p className="text-white font-bold text-lg">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Stream */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white text-sm font-medium">Detection Stream</span>
        </div>

        {events.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <Activity className="h-8 w-8 mx-auto mb-3 text-gray-700" />
            <p>Waiting for detections…</p>
            <p className="text-xs mt-1">Send a prompt to <code className="text-blue-400">/api/detections/analyze</code></p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 max-h-[520px] overflow-y-auto">
            <AnimatePresence initial={false}>
              {events.map((e) => {
                const cls = RISK_STYLES[e.risk_level] ?? RISK_STYLES.safe
                return (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-white/3 transition-colors"
                  >
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls} shrink-0 w-20 text-center`}>
                      {e.risk_level}
                    </span>
                    <span className="text-white font-mono text-sm w-10 shrink-0">{e.risk_score}</span>
                    <span className="text-gray-400 text-xs truncate flex-1">
                      {e.prompt_preview ?? '(prompt hidden)'}
                    </span>
                    <span className="text-gray-500 text-xs shrink-0">{e.processing_time_ms}ms</span>
                    <span className="text-gray-600 text-xs shrink-0">
                      {new Date(e.created_at).toLocaleTimeString()}
                    </span>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}