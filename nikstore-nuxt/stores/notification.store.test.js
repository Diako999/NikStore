import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('~/services/http.service', () => ({
  default: {
    get:   vi.fn(),
    patch: vi.fn(),
  },
}))

vi.mock('~/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { useNotificationStore } from './notification.store'
import http from '~/services/http.service'
import { logger } from '~/utils/logger'

const makeNotif = (overrides = {}) => ({
  _id:       'n1',
  type:      'order_update',
  title:     'سفارش تایید شد',
  body:      'سفارش شما تایید شد',
  data:      { orderId: 'o1' },
  isRead:    false,
  createdAt: new Date().toISOString(),
  ...overrides,
})

describe('useNotificationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // ── initial state ────────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('starts with zero unreadCount and empty list', () => {
      const store = useNotificationStore()
      expect(store.unreadCount).toBe(0)
      expect(store.notifications).toEqual([])
      expect(store.fetched).toBe(false)
      expect(store.loading).toBe(false)
    })
  })

  // ── fetchUnreadCount ─────────────────────────────────────────────────────────

  describe('fetchUnreadCount', () => {
    it('sets unreadCount from server', async () => {
      http.get.mockResolvedValue({ data: { count: 5 } })
      const store = useNotificationStore()
      await store.fetchUnreadCount()
      expect(store.unreadCount).toBe(5)
    })

    it('logs debug on success', async () => {
      http.get.mockResolvedValue({ data: { count: 3 } })
      const store = useNotificationStore()
      await store.fetchUnreadCount()
      expect(logger.debug).toHaveBeenCalledWith(
        'notification: unread count fetched', { count: 3 }, 'NotificationStore',
      )
    })

    it('logs warn and does not throw on HTTP failure', async () => {
      http.get.mockRejectedValue(new Error('network'))
      const store = useNotificationStore()
      await expect(store.fetchUnreadCount()).resolves.not.toThrow()
      expect(logger.warn).toHaveBeenCalledWith(
        'notification: failed to fetch unread count', expect.any(Object), 'NotificationStore',
      )
    })
  })

  // ── fetchNotifications ───────────────────────────────────────────────────────

  describe('fetchNotifications', () => {
    it('populates notifications and unreadCount', async () => {
      const notifs = [makeNotif(), makeNotif({ _id: 'n2', isRead: true })]
      http.get.mockResolvedValue({ data: { notifications: notifs, unreadCount: 1 } })

      const store = useNotificationStore()
      await store.fetchNotifications()

      expect(store.notifications).toHaveLength(2)
      expect(store.unreadCount).toBe(1)
      expect(store.fetched).toBe(true)
      expect(store.loading).toBe(false)
    })

    it('sets fetched=true on success', async () => {
      http.get.mockResolvedValue({ data: { notifications: [], unreadCount: 0 } })
      const store = useNotificationStore()
      expect(store.fetched).toBe(false)
      await store.fetchNotifications()
      expect(store.fetched).toBe(true)
    })

    it('does not set fetched=true on failure', async () => {
      http.get.mockRejectedValue(new Error('fail'))
      const store = useNotificationStore()
      await store.fetchNotifications()
      expect(store.fetched).toBe(false)
    })

    it('always resets loading to false even on failure', async () => {
      http.get.mockRejectedValue(new Error('fail'))
      const store = useNotificationStore()
      await store.fetchNotifications()
      expect(store.loading).toBe(false)
    })

    it('does not start a second fetch while one is in flight', async () => {
      let resolve
      http.get.mockReturnValue(new Promise(r => { resolve = r }))
      const store = useNotificationStore()
      const p1 = store.fetchNotifications()
      const p2 = store.fetchNotifications()
      resolve({ data: { notifications: [], unreadCount: 0 } })
      await Promise.all([p1, p2])
      expect(http.get).toHaveBeenCalledTimes(1)
    })
  })

  // ── addIncoming (real-time) ───────────────────────────────────────────────────

  describe('addIncoming', () => {
    it('prepends the notification to the list', () => {
      const store = useNotificationStore()
      store.notifications = [makeNotif({ _id: 'old' })]
      store.addIncoming(makeNotif({ _id: 'new' }))
      expect(store.notifications[0]._id).toBe('new')
      expect(store.notifications).toHaveLength(2)
    })

    it('increments unreadCount', () => {
      const store = useNotificationStore()
      store.unreadCount = 2
      store.addIncoming(makeNotif())
      expect(store.unreadCount).toBe(3)
    })

    it('always marks incoming as unread', () => {
      const store = useNotificationStore()
      store.addIncoming(makeNotif({ isRead: true }))
      expect(store.notifications[0].isRead).toBe(false)
    })

    it('logs info on incoming notification', () => {
      const store = useNotificationStore()
      store.addIncoming(makeNotif({ title: 'test title' }))
      expect(logger.info).toHaveBeenCalledWith(
        'notification: real-time notification received',
        { title: 'test title' },
        'NotificationStore',
      )
    })
  })

  // ── markRead ─────────────────────────────────────────────────────────────────

  describe('markRead', () => {
    it('marks the notification as read and decrements unreadCount', async () => {
      http.patch.mockResolvedValue({})
      const store = useNotificationStore()
      store.notifications = [makeNotif({ _id: 'n1', isRead: false })]
      store.unreadCount   = 3

      await store.markRead('n1')

      expect(store.notifications[0].isRead).toBe(true)
      expect(store.unreadCount).toBe(2)
    })

    it('does not decrement count for an already-read notification', async () => {
      http.patch.mockResolvedValue({})
      const store = useNotificationStore()
      store.notifications = [makeNotif({ _id: 'n1', isRead: true })]
      store.unreadCount   = 0

      await store.markRead('n1')
      expect(store.unreadCount).toBe(0)
    })

    it('logs warn and does not throw on HTTP failure', async () => {
      http.patch.mockRejectedValue(new Error('fail'))
      const store = useNotificationStore()
      await expect(store.markRead('n1')).resolves.not.toThrow()
      expect(logger.warn).toHaveBeenCalledWith(
        'notification: failed to mark read', expect.any(Object), 'NotificationStore',
      )
    })
  })

  // ── markAllRead ───────────────────────────────────────────────────────────────

  describe('markAllRead', () => {
    it('marks every notification as read and resets unreadCount', async () => {
      http.patch.mockResolvedValue({})
      const store = useNotificationStore()
      store.notifications = [makeNotif(), makeNotif({ _id: 'n2' })]
      store.unreadCount   = 2

      await store.markAllRead()

      store.notifications.forEach(n => expect(n.isRead).toBe(true))
      expect(store.unreadCount).toBe(0)
    })
  })

  // ── reset ─────────────────────────────────────────────────────────────────────

  describe('reset', () => {
    it('clears all state', () => {
      const store = useNotificationStore()
      store.notifications = [makeNotif()]
      store.unreadCount   = 5
      store.fetched       = true

      store.reset()

      expect(store.notifications).toEqual([])
      expect(store.unreadCount).toBe(0)
      expect(store.fetched).toBe(false)
    })
  })
})
