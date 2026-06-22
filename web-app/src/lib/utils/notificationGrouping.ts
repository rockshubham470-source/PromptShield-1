import { Notification, NotificationGroup } from '../types/notification'

/**
 * Groups notifications by category and title similarity
 * @param notifications Array of notifications to group
 * @returns Array of notification groups
 */
export const groupNotifications = (notifications: Notification[]): NotificationGroup[] => {
  if (!notifications || notifications.length === 0) {
    return []
  }

  const groupsMap = new Map<string, Notification[]>()

  notifications.forEach(notification => {
    // Create group key based on category and first word of title for similarity
    const titleWords = notification.title.split(' ')
    const firstWord = titleWords[0] || ''
    const groupKey = `${notification.category}:${firstWord}`

    if (!groupsMap.has(groupKey)) {
      groupsMap.set(groupKey, [])
    }

    groupsMap.get(groupKey)!.push(notification)
  })

  return Array.from(groupsMap.entries()).map(([key, notifications]) => {
    // Sort notifications by creation date (newest first)
    const sorted = [...notifications].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return {
      key,
      notifications: sorted,
      unreadCount: sorted.filter(n => !n.read).length,
      latest: sorted[0] || null as unknown as Notification
    }
  }).filter(group => group.latest !== null) // Remove any groups with null latest
}

/**
 * Gets a human-readable label for a notification category
 * @param category Notification category
 * @returns Display label for the category
 */
export const getCategoryLabel = (category: Notification['category']): string => {
  switch (category) {
    case 'security':
      return 'Security'
    case 'billing':
      return 'Billing'
    case 'system':
    default:
      return 'System'
  }
}

/**
 * Gets an icon component for a notification category
 * @param category Notification category
 * @returns Lucide icon component
 */
export const getCategoryIcon = (category: Notification['category']) => {
  switch (category) {
    case 'security':
      return 'AlertTriangle'
    case 'billing':
      return 'CreditCard'
    case 'system':
    default:
      return 'Settings'
  }
}