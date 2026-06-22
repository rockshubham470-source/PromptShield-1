import { create } from 'zustand'
import { Notification, NotificationGroup } from '../types/notification'
import { notificationApi } from '../lib/api.service'
import { groupNotifications } from '../utils/notificationGrouping'

interface NotificationState {
  notifications: Notification[]
  groups: NotificationGroup[]
  unreadCount: number
  loading: boolean
  error: string | null

  // Actions
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  addNotification: (notification: Notification) => void
  removeNotification: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  groups: [],
  unreadCount: 0,
  loading: false,
  error: null,

  fetchNotifications: async () => {
    set({ loading: true, error: null })
    try {
      const response = await notificationApi.fetchNotifications()
      const fetchedNotifications: Notification[] = response.data

      // Update store with fetched notifications
      set({
        notifications: fetchedNotifications,
        groups: groupNotifications(fetchedNotifications),
        loading: false
      })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch notifications'
      })
    }
  },

  markAsRead: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await notificationApi.markAsRead(id)

      set(state => {
        const updatedNotifications = state.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        )
        return {
          notifications: updatedNotifications,
          groups: groupNotifications(updatedNotifications)
        }
      })
      set({ loading: false })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to mark notification as read'
      })
    }
  },

  markAllAsRead: async () => {
    set({ loading: true, error: null })
    try {
      await notificationApi.markAllAsRead()

      set(state => {
        const updatedNotifications = state.notifications.map(n => ({ ...n, read: true }))
        return {
          notifications: updatedNotifications,
          groups: groupNotifications(updatedNotifications)
        }
      })
      set({ loading: false })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to mark all notifications as read'
      })
    }
  },

  addNotification: (notification: Notification) => {
    set(state => {
      const newNotifications = [notification, ...state.notifications]
      return {
        notifications: newNotifications,
        groups: groupNotifications(newNotifications)
      }
    })
  },

  removeNotification: (id: string) => {
    set(state => {
      const filteredNotifications = state.notifications.filter(n => n.id !== id)
      return {
        notifications: filteredNotifications,
        groups: groupNotifications(filteredNotifications)
      }
    })
  },

  setLoading: (loading: boolean) => {
    set({ loading })
  },

  setError: (error: string | null) => {
    set({ error })
  }
}))