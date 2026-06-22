import React from 'react'
import {
  Shield,
  AlertTriangle,
  Zap,
  TrendingUp,
  Globe,
  Activity,
} from 'lucide-react'

import {
  TrendChart,
  RiskDistributionChart,
  BarChartComponent,
} from '../components/Charts'

const kpiGroups = [
  {
    title: 'Detection Health',
    items: [
      {
        title: 'Accuracy',
        value: '88.4%',
        change: '+2.1%',
        icon: Shield,
        color: 'text-emerald-400',
      },
      {
        title: 'False Positives',
        value: '2.4%',
        change: '-0.3%',
        icon: AlertTriangle,
        color: 'text-amber-400',
      },
    ],
  },
  {
    title: 'Performance',
    items: [
      {
        title: 'Latency',
        value: '45ms',
        change: '↓ Target',
        icon: Zap,
        color: 'text-blue-400',
      },
      {
        title: 'Throughput',
        value: '12.4k/s',
        change: '+8%',
        icon: TrendingUp,
        color: 'text-purple-400',
      },
    ],
  },
]

export default function Analytics() {
  return (
    <div className="min-h-screen bg-[#0A0F1C] p-6">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">
          Security Analytics
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Real-time system intelligence and anomaly tracking
        </p>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-12 gap-6">

        {/* LEFT SIDE */}
        <div className="col-span-8 space-y-6">

          {/* KPI GROUPS */}
          {kpiGroups.map((group) => (
            <div key={group.title}>
              <div className="flex items-center mb-3">
                <h2 className="text-xs uppercase tracking-wider text-gray-500">
                  {group.title}
                </h2>
                <div className="flex-1 h-px bg-white/5 ml-3" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {group.items.map((m) => {
                  const Icon = m.icon

                  return (
                    <div
                      key={m.title}
                      className="rounded-xl border border-white/10 bg-white/5 p-4 hover:border-blue-500/30 transition"
                    >
                      <div className="flex justify-between items-center">
                        <Icon size={14} className={m.color} />
                        <span className="text-[10px] text-gray-400">
                          {m.change}
                        </span>
                      </div>

                      <div className={`text-2xl font-semibold mt-2 ${m.color}`}>
                        {m.value}
                      </div>

                      <div className="text-xs text-gray-400 mt-1">
                        {m.title}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* MAIN TREND */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <TrendChart />
          </div>

          {/* BOTTOM CHARTS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <RiskDistributionChart />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <BarChartComponent />
            </div>
          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="col-span-4 space-y-4">

          {/* LIVE SYSTEM */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-green-400 text-xs">
              <Activity size={14} />
              Live System
            </div>

            <div className="mt-3 text-2xl font-semibold text-white">
              1,284
            </div>

            <div className="text-xs text-gray-400">
              events / second
            </div>
          </div>

          {/* ROOT CAUSE */}
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
            <div className="text-sm font-semibold text-white">
              Root Cause Analysis
            </div>

            <div className="text-xs text-gray-400 mt-2">
              Traffic spike linked to API key reuse + abnormal prompt patterns.
            </div>

            <div className="mt-3 text-xs text-purple-300">
              Confidence: 91%
            </div>
          </div>

          {/* WHY SPIKE */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="text-sm font-semibold text-white">
              Why This Spike Happened
            </div>

            <ul className="text-xs text-gray-400 mt-2 space-y-1">
              <li>• Increased jailbreak attempts from APAC region</li>
              <li>• New injection pattern detected</li>
              <li>• Misconfigured applications sending bulk traffic</li>
            </ul>
          </div>

          {/* KPI CORRELATION */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-white mb-3">
              KPI Correlation
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                ['Accuracy', 0.82],
                ['Latency', 0.67],
                ['Threats', 0.91],
                ['False Pos', 0.44],
                ['Throughput', 0.73],
                ['Risk', 0.88],
              ].map(([label, val]) => (
                <div
                  key={label as string}
                  className="h-10 rounded bg-white/5 flex items-center justify-center text-[10px] text-gray-400"
                  style={{
                    borderColor: `rgba(59,130,246,${val})`,
                    borderWidth: 1,
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* QUICK STATS */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            {[
              ['Models', '12'],
              ['Apps', '48'],
              ['Requests', '2.4M'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-400">{k}</span>
                <span className="text-white font-medium">{v}</span>
              </div>
            ))}
          </div>

          {/* ATTACK SOURCES (EXPANDED) */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm text-white mb-3 flex items-center gap-2">
              <Globe size={14} />
              Attack Sources
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {[
                ['United States', 35],
                ['India', 28],
                ['Germany', 14],
                ['Singapore', 12],
                ['Brazil', 9],
                ['United Kingdom', 8],
                ['Canada', 7],
                ['France', 6],
                ['Netherlands', 5],
                ['Australia', 5],
                ['Japan', 4],
                ['South Korea', 4],
                ['UAE', 3],
                ['Russia', 3],
                ['China', 3],
                ['Italy', 3],
                ['Spain', 2],
                ['Mexico', 2],
                ['Indonesia', 2],
                ['Vietnam', 2],
                ['Turkey', 2],
                ['South Africa', 1],
                ['Poland', 1],
                ['Sweden', 1],
                ['Thailand', 1],
                ['Malaysia', 1],
                ['Saudi Arabia', 1],
                ['Israel', 1],
              ].map(([c, v]) => (
                <div key={c as string}>
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>{c}</span>
                    <span>{v}%</span>
                  </div>

                  <div className="h-1.5 bg-gray-800 rounded">
                    <div
                      className="h-1.5 bg-blue-500 rounded"
                      style={{ width: `${v}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}