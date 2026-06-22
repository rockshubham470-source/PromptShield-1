import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../lib/auth'
import { useNotificationStore } from '../stores/notificationStore'
import { websocketService } from '../lib/services/websocketService'
import { toastService } from '../lib/services/toastService'
import { Bell, Search, LogOut } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const {
    notifications,
    groups,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    addNotification,
  } = useNotificationStore()

  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
  if (!user) return

  websocketService.connect()

  const unsubscribe = websocketService.subscribe((notification) => {
    addNotification(notification)
    toastService.show(notification)
  })

  return () => {
    unsubscribe()
    websocketService.disconnect()
  }
  }, [user, addNotification])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAsRead = useCallback(
    async (id?: string) => {
      if (id) await markAsRead(id)
      else await markAllAsRead()
    },
    [markAsRead, markAllAsRead]
  )

  return (
    <header className="sticky top-0 z-40 h-20 border-b border-white/10 bg-[#0f172a]/80 backdrop-blur-xl px-8 flex items-center justify-between">

      {/* LEFT */}
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-white">
          Security Command Center
        </h2>
        {user?.organization_name ? (
          <span className="text-xs text-blue-300">
            Org: {user.organization_name}
          </span>
        ) : (
          <span className="text-xs text-gray-400">
            Org: Loading…
          </span>
        )}
        <span className="text-xs text-green-400">
          All systems operational
        </span>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-5">

        {/* SEARCH */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-3.5 text-gray-500" />

          <input
            type="text"
            placeholder="Search threats, users, rules..."
            className="w-[360px] pl-11 pr-14 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        {/* NOTIFICATIONS */}
        <div className="relative" ref={notificationRef}>

          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
          >
            <Bell size={20} className="text-gray-300" />

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {/* DROPDOWN */}
          {showNotifications && (
            <div className="absolute right-0 top-14 w-[420px] bg-[#111827] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[9999]">

              <div className="p-4 border-b border-white/10 flex justify-between">
                <span className="font-semibold text-white">Notifications</span>

                <button
                  onClick={() => handleMarkAsRead()}
                  className="text-blue-400 text-sm"
                >
                  Mark all read
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 && (
                  <div className="p-6 text-gray-400 text-center">
                    No notifications
                  </div>
                )}

                {groups.map((group) => (
                  <div key={group.key}>
                    <div className="px-4 py-2 bg-white/5 text-sm text-white">
                      {group.key}
                    </div>

                    {group.notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkAsRead(n.id)}
                        className="px-4 py-3 hover:bg-white/5 cursor-pointer border-b border-white/5"
                      >
                        <div className="text-white text-sm">{n.title}</div>
                        <div className="text-gray-400 text-xs">{n.message}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* USER */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-white text-sm font-medium">
              {user?.name}
            </div>
            <div className="text-gray-400 text-xs">
              {user?.tier}
            </div>
          </div>

          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
            {user?.name?.[0] || 'U'}
          </div>
        </div>

        {/* LOGOUT */}
        <button
          onClick={logout}
          className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={18} className="text-gray-300" />
        </button>
      </div>
    </header>
  )
}