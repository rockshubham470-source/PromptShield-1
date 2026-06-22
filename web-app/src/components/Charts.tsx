import React from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

export interface TrendData {
  month: string
  safe: number
  risky: number
  critical: number
}

export interface RiskData {
  name: string
  value: number
  color: string
}

interface ChartProps {
  title?: string
  children: React.ReactNode
}

interface TrendChartProps {
  data?: TrendData[]
}

interface RiskChartProps {
  data?: RiskData[]
}

const defaultTrendData: TrendData[] = [
  { month: 'Jan', safe: 4000, risky: 2400, critical: 400 },
  { month: 'Feb', safe: 3000, risky: 1398, critical: 221 },
  { month: 'Mar', safe: 2000, risky: 9800, critical: 229 },
  { month: 'Apr', safe: 2780, risky: 3908, critical: 200 },
  { month: 'May', safe: 1890, risky: 4800, critical: 221 },
  { month: 'Jun', safe: 2390, risky: 3800, critical: 250 },
]

const defaultRiskData: RiskData[] = [
  { name: 'Safe', value: 65, color: '#10b981' },
  { name: 'Caution', value: 20, color: '#f59e0b' },
  { name: 'Risky', value: 10, color: '#fb923c' },
  { name: 'Critical', value: 5, color: '#ef4444' },
]

export function Chart({
  title,
  children,
}: ChartProps) {
  return (
    <div
      className="
        rounded-3xl
        border
        border-white/10
        bg-white/5
        backdrop-blur-xl
        p-6
        transition-all
        hover:border-blue-500/30
        hover:shadow-xl
      "
    >
      {title && (
        <h3 className="text-lg font-semibold mb-6 text-white">
          {title}
        </h3>
      )}

      {children}
    </div>
  )
}

export function TrendChart({
  data = defaultTrendData,
}: TrendChartProps) {
  return (
    <Chart title="Detection Trends">
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid
            stroke="#374151"
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="month"
            stroke="#9CA3AF"
          />

          <YAxis stroke="#9CA3AF" />

          <Tooltip
            contentStyle={{
              backgroundColor: '#111827',
              border: '1px solid #374151',
              borderRadius: '12px',
            }}
          />

          <Legend />

          <Line
            type="monotone"
            dataKey="safe"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
            animationDuration={1000}
          />

          <Line
            type="monotone"
            dataKey="risky"
            stroke="#f59e0b"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
            animationDuration={1000}
          />

          <Line
            type="monotone"
            dataKey="critical"
            stroke="#ef4444"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </Chart>
  )
}

export function RiskDistributionChart({
  data = defaultRiskData,
}: RiskChartProps) {
  return (
    <Chart title="Risk Distribution">
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={4}
            label={({ name, value }) =>
              `${name} ${value}%`
            }
            animationDuration={1200}
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.color}
              />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              backgroundColor: '#111827',
              border: '1px solid #374151',
              borderRadius: '12px',
            }}
          />

          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Chart>
  )
}

export function BarChartComponent({
  data = defaultTrendData,
}: TrendChartProps) {
  return (
    <Chart title="Detections by Type">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
          <CartesianGrid
            stroke="#374151"
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="month"
            stroke="#9CA3AF"
          />

          <YAxis stroke="#9CA3AF" />

          <Tooltip
            contentStyle={{
              backgroundColor: '#111827',
              border: '1px solid #374151',
              borderRadius: '12px',
            }}
          />

          <Legend />

          <Bar
            dataKey="safe"
            fill="#10b981"
            radius={[8, 8, 0, 0]}
            animationDuration={1000}
          />

          <Bar
            dataKey="risky"
            fill="#f59e0b"
            radius={[8, 8, 0, 0]}
            animationDuration={1000}
          />

          <Bar
            dataKey="critical"
            fill="#ef4444"
            radius={[8, 8, 0, 0]}
            animationDuration={1000}
          />
        </BarChart>
      </ResponsiveContainer>
    </Chart>
  )
}

export function UsageChart({
  data,
}: TrendChartProps) {
  return (
    <Chart title="API Usage">
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid stroke="#374151" />

          <XAxis dataKey="month" />

          <YAxis />

          <Tooltip />

          <Line
            dataKey="requests"
            stroke="#3b82f6"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </Chart>
  )
}

export function RealtimeChart({
  data,
}: TrendChartProps) {
  return (
    <Chart title="Live Traffic">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="time" />

          <YAxis />

          <Tooltip />

          <Line
            dataKey="requests"
            stroke="#22c55e"
          />
        </LineChart>
      </ResponsiveContainer>
    </Chart>
  )
}