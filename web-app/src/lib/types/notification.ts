export interface Notification {
  id: string
  title: string
  message: string
  category: 'security' | 'billing' | 'system'
  read: boolean
  createdAt: string
  // For grouping
  groupKey?: string
  count?: number
}

export interface NotificationGroup {
  key: string
  notifications: Notification[]
  unreadCount: number
  latest: Notification
}