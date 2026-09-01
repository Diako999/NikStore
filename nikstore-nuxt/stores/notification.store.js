import { defineStore } from 'pinia'
import { ref }         from 'vue'
import http            from '~/services/http.service'
import { logger }      from '~/utils/logger'
import { withRetry }   from '~/utils/retry'

const CTX = 'NotificationStore'

export const useNotificationStore = defineStore('notification', () => {
  const unreadCount   = ref(0)
  const notifications = ref([])
  const loading       = ref(false)
  // true once we have done a full server fetch (so repeated dropdown opens don't re-fetch)
  const fetched       = ref(false)

  async function fetchUnreadCount() {
    try {
      await withRetry(async () => {
        const { data } = await http.get('/notifications/unread-count')
        unreadCount.value = data?.count ?? 0
        logger.debug('notification: unread count fetched', { count: unreadCount.value }, CTX)
      }, 3, 1500)
    } catch (err) {
      logger.warn('notification: failed to fetch unread count', { error: err?.message }, CTX)
    }
  }

  async function fetchNotifications() {
    if (loading.value) return
    loading.value = true
    try {
      const { data } = await http.get('/notifications', { params: { limit: 20 } })
      notifications.value = data?.notifications ?? []
      unreadCount.value   = data?.unreadCount   ?? 0
      fetched.value       = true
      logger.debug('notification: list fetched', { count: notifications.value.length }, CTX)
    } catch (err) {
      logger.warn('notification: failed to fetch list', { error: err?.message }, CTX)
    } finally {
      loading.value = false
    }
  }

  async function markRead(notifId) {
    try {
      await http.patch(`/notifications/${notifId}/read`)
      const n = notifications.value.find(n => n._id === notifId)
      if (n && !n.isRead) {
        n.isRead = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (err) {
      logger.warn('notification: failed to mark read', { notifId, error: err?.message }, CTX)
    }
  }

  async function markAllRead() {
    try {
      await http.patch('/notifications/read-all')
      notifications.value.forEach(n => { n.isRead = true })
      unreadCount.value = 0
    } catch (err) {
      logger.warn('notification: failed to mark all read', { error: err?.message }, CTX)
    }
  }

  // Called by the socket listener when a real-time notification arrives
  function addIncoming(notif) {
    notifications.value.unshift({ ...notif, isRead: false })
    unreadCount.value++
    logger.info('notification: real-time notification received', { title: notif.title }, CTX)
  }

  function reset() {
    unreadCount.value   = 0
    notifications.value = []
    fetched.value       = false
    loading.value       = false
  }

  return {
    unreadCount, notifications, loading, fetched,
    fetchUnreadCount, fetchNotifications, markRead, markAllRead, addIncoming, reset,
  }
})
