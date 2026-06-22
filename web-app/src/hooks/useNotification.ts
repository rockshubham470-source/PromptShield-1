import { useState, useEffect, useCallback } from 'react'
import { useNotificationStore } from '../stores/notificationStore'
import { notificationApi } from '../lib/api.service'
import { Notification } from '../types/notification'

export const useNotification = () => {
  const { notifications, groups, unreadCount, loading, error,
        fetchNotifications, markAsRead, markAllAsRead,
        addNotification, removeNotification } = useNotificationStore()

  // Fetch notifications from API and update store
  const refreshNotifications = useCallback(async () => {
    try {
      const response = await notificationApi.fetchNotifications()
      const fetchedNotifications: Notification[] = response.data

      // Replace all notifications with fetched ones
      // In a real app, we might want to merge instead of replace
      fetchedNotifications.forEach(notif => addNotification(notif))

      return fetchedNotifications
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      throw error
    }
  }, [addNotification])

  // Load notifications on mount
  useEffect(() => {
    refreshNotifications()
  }, [refreshNotifications])

  // Mark notification as read via API
  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      await notificationApi.markAsRead(id)
      await markAsRead(id)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      throw error
    }
  }, [markAsRead])

  // Mark all notifications as read via API
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead()
      await markAllAsRead()
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      throw error
    }
  }, [markAllAsRead])

  return {
    notifications,
    groups,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    addNotification,
    removeNotification
  }
}