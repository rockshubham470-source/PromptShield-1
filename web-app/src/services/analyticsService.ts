import api from '../lib/api.service'

export const getAnalytics = () =>
  api.get('/stats/analytics')

export const getDashboardStats = () =>
  api.get('/stats/dashboard')