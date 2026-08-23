import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

describe('useUiStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    vi.useFakeTimers()
  })

  afterEach(() => vi.useRealTimers())

  async function getStore() {
    const { useUiStore } = await import('./ui.store')
    return useUiStore()
  }

  describe('toasts', () => {
    it('addToast appends a toast with correct fields', async () => {
      const store = await getStore()
      store.addToast('عملیات موفق', 'success')
      expect(store.toasts).toHaveLength(1)
      expect(store.toasts[0].message).toBe('عملیات موفق')
      expect(store.toasts[0].type).toBe('success')
    })

    it('removeToast removes by id', async () => {
      const store = await getStore()
      store.addToast('msg', 'info')
      const id = store.toasts[0].id
      store.removeToast(id)
      expect(store.toasts).toHaveLength(0)
    })

    it('auto-removes toast after duration', async () => {
      const store = await getStore()
      store.addToast('auto', 'info', 3500)
      expect(store.toasts).toHaveLength(1)
      vi.advanceTimersByTime(3500)
      expect(store.toasts).toHaveLength(0)
    })
  })

  describe('sidebar', () => {
    it('toggleSidebar flips sidebarCollapsed', async () => {
      const store = await getStore()
      expect(store.sidebarCollapsed).toBe(false)
      store.toggleSidebar()
      expect(store.sidebarCollapsed).toBe(true)
    })

    it('openMobileSidebar / closeMobileSidebar', async () => {
      const store = await getStore()
      store.openMobileSidebar()
      expect(store.sidebarMobileOpen).toBe(true)
      store.closeMobileSidebar()
      expect(store.sidebarMobileOpen).toBe(false)
    })
  })

  describe('notifications', () => {
    it('addNotification prepends and caps at 50', async () => {
      const store = await getStore()
      for (let i = 0; i < 55; i++) store.addNotification({ id: i, title: `n${i}` })
      expect(store.notifications).toHaveLength(50)
    })

    it('unreadCount counts unread notifications', async () => {
      const store = await getStore()
      store.addNotification({ id: 1, title: 'a' })
      store.addNotification({ id: 2, title: 'b' })
      expect(store.unreadCount).toBe(2)
      store.markRead(store.notifications[0].id)
      expect(store.unreadCount).toBe(1)
    })

    it('markAllRead sets all to read', async () => {
      const store = await getStore()
      store.addNotification({ id: 1, title: 'a' })
      store.addNotification({ id: 2, title: 'b' })
      store.markAllRead()
      expect(store.unreadCount).toBe(0)
    })

    it('clearNotifications empties the list', async () => {
      const store = await getStore()
      store.addNotification({ id: 1, title: 'x' })
      store.clearNotifications()
      expect(store.notifications).toHaveLength(0)
    })
  })

  describe('dark mode', () => {
    it('toggleDark flips isDark and persists to localStorage', async () => {
      localStorage.setItem('theme', 'light')
      const store = await getStore()
      const before = store.isDark
      store.toggleDark()
      expect(store.isDark).toBe(!before)
      expect(localStorage.getItem('theme')).toBe(store.isDark ? 'dark' : 'light')
    })
  })
})
