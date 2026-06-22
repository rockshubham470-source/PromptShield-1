import React, { useEffect } from 'react'
import { useNotification } from '../hooks/useNotification'
import { Link } from 'react-router-dom'
import { AlertTriangle, CreditCard, Settings } from 'lucide-react'

const NotificationsPage = () => {
  const {
    notifications,
    groups,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotification()

  // Safe polling (prevents overlapping calls)
  useEffect(() => {
    let isActive = true

    const fetchData = async () => {
      if (!isActive) return
      await refreshNotifications()
    }

    fetchData()

    const interval = setInterval(fetchData, 30000)

    return () => {
      isActive = false
      clearInterval(interval)
    }
  }, [refreshNotifications])

  // Category icon mapping
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security':
        return AlertTriangle
      case 'billing':
        return CreditCard
      case 'system':
      default:
        return Settings
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'security':
        return 'text-red-400'
      case 'billing':
        return 'text-yellow-400'
      case 'system':
      default:
        return 'text-blue-400'
    }
  }

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()

    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.round(diffMs / 60000)
    const diffHours = Math.round(diffMs / 3600000)
    const diffDays = Math.round(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hr${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`

    return date.toLocaleDateString()
  }

  const safeGroups = groups ?? []

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">
          Notification Center
        </h1>

        <div className="flex gap-3">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0 || loading}
            className="px-4 py-2 rounded-xl bg-white/5 text-white hover:bg-white/10 disabled:opacity-50"
          >
            {loading ? 'Marking...' : 'Mark All as Read'}
          </button>

          <button
            onClick={refreshNotifications}
            className="px-4 py-2 rounded-xl bg-white/5 text-white hover:bg-white/10"
          >
            Refresh
          </button>

          <Link
            to="/"
            className="px-4 py-2 rounded-xl bg-white/5 text-white hover:bg-white/10"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* LOADING */}
      {loading && !notifications.length && (
        <div className="text-center py-10">
          <div className="animate-spin h-8 w-8 border-b-2 border-t-2 border-blue-400 rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading notifications...</p>
        </div>
      )}

      {/* ERROR */}
      {error && !notifications.length && (
        <div className="text-center py-10">
          <p className="text-red-400">Error: {error}</p>
          <button
            onClick={refreshNotifications}
            className="mt-4 px-4 py-2 rounded-xl bg-white/5 text-white hover:bg-white/10"
          >
            Try Again
          </button>
        </div>
      )}

      {/* EMPTY */}
      {!loading && notifications.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          No notifications
        </div>
      )}

      {/* GROUPS */}
      {!loading && notifications.length > 0 && (
        <div className="space-y-4">
          {safeGroups.map((group: any) => (
            <div
              key={group.key}
              className="border border-white/10 rounded-xl overflow-hidden"
            >
              {/* GROUP HEADER */}
              <div className="flex justify-between items-center px-5 py-3 bg-white/5">
                <h3 className="font-medium text-white">
                  {group.notifications?.[0]?.category
                    ? group.notifications[0].category
                        .charAt(0)
                        .toUpperCase() +
                      group.notifications[0].category.slice(1)
                    : 'Notification'}
                </h3>

                <div className="flex items-center gap-2">
                  {group.unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400">
                      {group.unreadCount} unread
                    </span>
                  )}

                  <span className="text-xs text-gray-400">
                    {group.notifications?.length || 0} notifications
                  </span>
                </div>
              </div>

              {/* ITEMS */}
              <div className="space-y-1">
                {(group.notifications ?? []).map((notification: any) => {
                  const Icon = getCategoryIcon(notification.category)

                  return (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`
                        px-5 py-4 cursor-pointer hover:bg-white/5 transition border-b border-white/5
                        ${notification.read ? 'opacity-50' : ''}
                      `}
                    >
                      <div className="flex gap-4 items-start">
                        {/* ICON */}
                        <div className="mt-1">
                          <Icon
                            size={18}
                            className={getCategoryColor(notification.category)}
                          />
                        </div>

                        {/* CONTENT */}
                        <div className="space-y-1">
                          <p className="text-white font-medium">
                            {notification.title}
                          </p>

                          <p className="text-sm text-gray-400">
                            {notification.message}
                          </p>

                          <p className="text-xs text-gray-500">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FOOTER */}
      {!loading && notifications.length > 0 && (
        <div className="mt-6 text-center text-xs text-gray-500">
          Auto-refreshing every 30 seconds
        </div>
      )}
    </div>
  )
}

export default NotificationsPage