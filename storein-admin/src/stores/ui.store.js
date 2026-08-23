import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const toasts            = ref([])
  const sidebarCollapsed  = ref(false)
  const sidebarMobileOpen = ref(false)

  // ── Notifications ─────────────────────────────────────────────
  const notifications = ref([])
  const unreadCount   = computed(() => notifications.value.filter(n => !n.read).length)

  // ── Real-time dashboard counters ──────────────────────────────
  const pendingOrdersCount  = ref(0)
  const pendingReviewsCount = ref(0)

  function setPendingOrdersCount(n)  { pendingOrdersCount.value  = n }
  function setPendingReviewsCount(n) { pendingReviewsCount.value = n }
  function incrementPendingOrders()  { pendingOrdersCount.value++ }
  function incrementPendingReviews() { pendingReviewsCount.value++ }

  function addNotification(notification) {
    notifications.value.unshift({ ...notification, read: false, id: notification.id ?? (Date.now() + Math.random()) })
    if (notifications.value.length > 50) notifications.value = notifications.value.slice(0, 50)
  }
  function markRead(id) {
    const n = notifications.value.find(n => n.id === id)
    if (n) n.read = true
  }
  function markAllRead() {
    notifications.value.forEach(n => { n.read = true })
  }
  function clearNotifications() {
    notifications.value = []
  }

  // ── Dark mode ─────────────────────────────────────────────────
  const isDark = ref(false)

  function _applyTheme() {
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  function initTheme() {
    const stored = localStorage.getItem('theme')
    isDark.value = stored
      ? stored === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches
    _applyTheme()
  }

  function toggleDark() {
    isDark.value = !isDark.value
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    _applyTheme()
  }

  initTheme()

  // ── Toast ─────────────────────────────────────────────────────
  function addToast(message, type = 'info', duration = 3500) {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, message, type })
    setTimeout(() => removeToast(id), duration)
  }
  function removeToast(id) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  // ── Sidebar ───────────────────────────────────────────────────
  function toggleSidebar()      { sidebarCollapsed.value  = !sidebarCollapsed.value }
  function openMobileSidebar()  { sidebarMobileOpen.value = true }
  function closeMobileSidebar() { sidebarMobileOpen.value = false }

  return {
    toasts, sidebarCollapsed, sidebarMobileOpen,
    addToast, removeToast,
    toggleSidebar, openMobileSidebar, closeMobileSidebar,
    isDark, toggleDark,
    notifications, unreadCount,
    addNotification, markRead, markAllRead, clearNotifications,
    pendingOrdersCount, pendingReviewsCount,
    setPendingOrdersCount, setPendingReviewsCount,
    incrementPendingOrders, incrementPendingReviews,
  }
})
