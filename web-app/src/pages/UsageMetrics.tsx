import React from 'react'
import {
  Activity,
  Shield,
  Zap,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'

const metrics = [
  {
    label: 'Requests Today',
    value: '12,430',
    change: '+12.4%',
    icon: Activity,
    color: 'text-blue-400',
  },
  {
    label: 'Active Applications',
    value: '8',
    change: '+2',
    icon: Zap,
    color: 'text-purple-400',
  },
  {
    label: 'Block Rate',
    value: '3.2%',
    change: '-0.8%',
    icon: Shield,
    color: 'text-emerald-400',
  },
  {
    label: 'Threat Events',
    value: '184',
    change: '+18%',
    icon: AlertTriangle,
    color: 'text-red-400',
  },
]

const topApps = [
  { name: 'PromptShield API', requests: 5420, risk: 'Low' },
  { name: 'Admin Dashboard', requests: 3210, risk: 'Low' },
  { name: 'Customer Chatbot', requests: 2890, risk: 'Medium' },
  { name: 'AI Agent Layer', requests: 910, risk: 'High' },
]

export default function UsageMetrics() {
  return (
    <div className="p-6 space-y-8 bg-[#0A0F1C] min-h-screen text-white">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">Usage Analytics</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Real-time system usage, traffic distribution and API consumption insights
        </p>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-4 gap-4">

        {metrics.map((m, i) => {
          const Icon = m.icon

          return (
            <div
              key={i}
              className="
                p-5 rounded-2xl
                bg-white/5
                border border-white/10
                hover:border-blue-500/30
                transition
              "
            >
              <div className="flex justify-between items-center">
                <Icon size={18} className={m.color} />
                <span className="text-xs text-gray-400">
                  {m.change}
                </span>
              </div>

              <div className={`text-2xl font-semibold mt-3 ${m.color}`}>
                {m.value}
              </div>

              <div className="text-xs text-gray-400 mt-1">
                {m.label}
              </div>
            </div>
          )
        })}

      </div>

      {/* USAGE BREAKDOWN */}
      <div className="grid grid-cols-2 gap-6">

        {/* LEFT: USAGE VISUAL */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="text-lg font-semibold mb-4">
            Traffic Distribution
          </h2>

          <div className="space-y-4">

            {[
              ['API Requests', 62],
              ['UI Requests', 18],
              ['Internal Jobs', 12],
              ['System Tasks', 8],
            ].map(([label, val]) => (
              <div key={label as string}>
                <div className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>{label}</span>
                  <span>{val}%</span>
                </div>

                <div className="h-2 bg-gray-800 rounded">
                  <div
                    className="h-2 bg-blue-500 rounded"
                    style={{ width: `${val}%` }}
                  />
                </div>
              </div>
            ))}

          </div>
        </div>

        {/* RIGHT: USAGE HEALTH */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="text-lg font-semibold mb-4">
            System Usage Health
          </h2>

          <div className="space-y-4">

            {[
              { label: 'Avg Response Time', value: '45ms', status: 'Good' },
              { label: 'Error Rate', value: '0.8%', status: 'Stable' },
              { label: 'Peak Load', value: '78%', status: 'Normal' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-300">
                    {item.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    Status: {item.status}
                  </div>
                </div>

                <div className="text-white font-semibold">
                  {item.value}
                </div>
              </div>
            ))}

          </div>
        </div>

      </div>

      {/* TOP APPS TABLE */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">

        <h2 className="text-lg font-semibold mb-4">
          Top Applications Usage
        </h2>

        <table className="w-full text-sm">
          <thead className="text-gray-400 border-b border-gray-800">
            <tr>
              <th className="text-left py-2">Application</th>
              <th className="text-left py-2">Requests</th>
              <th className="text-left py-2">Risk Level</th>
            </tr>
          </thead>

          <tbody>
            {topApps.map((app, i) => (
              <tr key={i} className="border-b border-gray-800">
                <td className="py-3">{app.name}</td>
                <td>{app.requests.toLocaleString()}</td>
                <td>
                  <span
                    className={`
                      px-2 py-1 text-xs rounded
                      ${app.risk === 'Low'
                        ? 'bg-green-500/20 text-green-400'
                        : app.risk === 'Medium'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'}
                    `}
                  >
                    {app.risk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>

        </table>

      </div>

    </div>
  )
}