export const kpiDetails: Record<string, any> = {
  'Total Detections': {
    description: 'All security events processed',
    trend: [120, 240, 180, 320, 400, 380],
  },
  'Critical Alerts': {
    description: 'High severity threats detected',
    trend: [5, 8, 12, 9, 15, 10],
  },
  'Safe Inputs': {
    description: 'Clean requests processed',
    trend: [900, 1100, 1050, 1200, 1300, 1250],
  },
  'Avg Latency': {
    description: 'System response time',
    trend: [30, 45, 40, 38, 32, 35],
  },
}