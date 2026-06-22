import { X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useDashboardStore } from '../stores/useDashboardStore'
import { kpiDetails } from '../data/kpiDetails'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function KPIDetailModal() {
  const { selectedMetric, setSelectedMetric } = useDashboardStore()

  if (!selectedMetric) return null

  const data = kpiDetails[selectedMetric]

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-[650px] bg-[#111827] border border-white/10 rounded-2xl p-6"
      >

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h2 className="text-white font-semibold">
            {selectedMetric}
          </h2>

          <button onClick={() => setSelectedMetric(null)}>
            <X className="text-gray-400" />
          </button>
        </div>

        {/* DESCRIPTION */}
        <p className="text-gray-400 text-sm mt-2">
          {data?.description}
        </p>

        {/* CHART */}
        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.trend.map((v: number, i: number) => ({
              name: i,
              value: v,
            }))}>

              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip />

              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
              />

            </LineChart>
          </ResponsiveContainer>
        </div>

      </motion.div>
    </div>
  )
}