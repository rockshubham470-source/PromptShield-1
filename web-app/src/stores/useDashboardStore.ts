import { create } from 'zustand'

export type TimeFilter = '24h' | '7d' | '30d' | '90d'

interface DashboardState {
  filter: TimeFilter
  setFilter: (f: TimeFilter) => void

  selectedMetric: string | null
  setSelectedMetric: (m: string | null) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  filter: '7d',
  setFilter: (f) => set({ filter: f }),

  selectedMetric: null,
  setSelectedMetric: (m) => set({ selectedMetric: m }),
}))