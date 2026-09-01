import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'

// ── Minimal router (no real routes needed) ────────────────────
const router = createRouter({
  history: createWebHashHistory(),
  routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }],
})

// ── Stub onClickOutside (VueUse — JSDOM has no layout) ───────
vi.mock('@vueuse/core', () => ({
  onClickOutside: vi.fn(),
}))

// ── helpers ───────────────────────────────────────────────────
function makeNotif(overrides = {}) {
  return {
    id:        Math.random(),
    type:      'order',
    title:     'سفارش جدید',
    body:      'سفارش #ORD-001 ثبت شد',
    createdAt: new Date().toISOString(),
    read:      false,
    orderId:   'ord-1',
    ...overrides,
  }
}

async function mountHeader(notifs = []) {
  const { useUiStore } = await import('@/stores/ui.store')
  const ui = useUiStore()
  ui.clearNotifications()
  notifs.forEach(n => {
    ui.addNotification(n)
    // addNotification always forces read:false — manually restore if caller intended read:true
    if (n.read === true) ui.markRead(n.id)
  })

  const AdminHeader = (await import('./AdminHeader.vue')).default
  const wrapper = mount(AdminHeader, {
    global: {
      plugins: [router],
      stubs:   { Transition: { template: '<slot />' } },
    },
  })
  await flushPromises()
  return { wrapper, ui }
}

// ─────────────────────────────────────────────────────────────
describe('AdminHeader — notification bell', () => {

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // ── Badge ────────────────────────────────────────────────────
  describe('badge', () => {
    it('hides badge when unreadCount is 0', async () => {
      const { wrapper } = await mountHeader([makeNotif({ read: true })])
      expect(wrapper.find('[data-testid="bell-badge"]').exists()).toBe(false)
    })

    it('shows badge with count when there are unread notifications', async () => {
      const { wrapper } = await mountHeader([makeNotif(), makeNotif()])
      const badge = wrapper.find('[data-testid="bell-badge"]')
      expect(badge.exists()).toBe(true)
      // Badge shows Latin digit (no font-fanum in admin) — unreadCount = 2
      expect(badge.text()).toBe('2')
    })

    it('caps badge display at 9+', async () => {
      const notifs = Array.from({ length: 10 }, () => makeNotif())
      const { wrapper } = await mountHeader(notifs)
      expect(wrapper.find('[data-testid="bell-badge"]').text()).toBe('۹+')
    })
  })

  // ── Toggle ───────────────────────────────────────────────────
  describe('toggle', () => {
    it('dropdown is hidden by default', async () => {
      const { wrapper } = await mountHeader()
      expect(wrapper.find('[data-testid="notif-dropdown"]').isVisible()).toBe(false)
    })

    it('clicking bell opens dropdown', async () => {
      const { wrapper } = await mountHeader()
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      expect(wrapper.find('[data-testid="notif-dropdown"]').isVisible()).toBe(true)
    })

    it('clicking bell again closes dropdown', async () => {
      const { wrapper } = await mountHeader()
      const bell = wrapper.find('[data-testid="bell-btn"]')
      await bell.trigger('click')
      await bell.trigger('click')
      expect(wrapper.find('[data-testid="notif-dropdown"]').isVisible()).toBe(false)
    })
  })

  // ── Empty state ──────────────────────────────────────────────
  describe('empty state', () => {
    it('shows empty state when no notifications', async () => {
      const { wrapper } = await mountHeader([])
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      expect(wrapper.find('[data-testid="nd-empty"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="nd-list"]').exists()).toBe(false)
    })

    it('hides empty state when notifications exist', async () => {
      const { wrapper } = await mountHeader([makeNotif()])
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      expect(wrapper.find('[data-testid="nd-empty"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="nd-list"]').exists()).toBe(true)
    })
  })

  // ── Unread count label ────────────────────────────────────────
  describe('unread count label', () => {
    it('shows "X جدید" label when unread > 0', async () => {
      const { wrapper } = await mountHeader([makeNotif(), makeNotif()])
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      const count = wrapper.find('[data-testid="nd-count"]')
      expect(count.exists()).toBe(true)
      expect(count.text()).toContain('جدید')
    })

    it('hides count label when all are read', async () => {
      const { wrapper } = await mountHeader([makeNotif({ read: true })])
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      expect(wrapper.find('[data-testid="nd-count"]').exists()).toBe(false)
    })
  })

  // ── Notification items ───────────────────────────────────────
  describe('notification items', () => {
    it('renders notification title and body', async () => {
      const n = makeNotif({ title: 'سفارش جدید', body: 'ORD-001 ثبت شد' })
      const { wrapper } = await mountHeader([n])
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      const item = wrapper.find(`[data-testid="nd-item-${n.id}"]`)
      expect(item.text()).toContain('سفارش جدید')
      expect(item.text()).toContain('ORD-001 ثبت شد')
    })

    it('unread item has --unread class', async () => {
      const n = makeNotif({ read: false })
      const { wrapper } = await mountHeader([n])
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      expect(wrapper.find(`[data-testid="nd-item-${n.id}"]`).classes()).toContain('anh__item--unread')
    })

    it('read item does not have --unread class', async () => {
      const n = makeNotif({ read: true })
      const { wrapper } = await mountHeader([n])
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      expect(wrapper.find(`[data-testid="nd-item-${n.id}"]`).classes()).not.toContain('anh__item--unread')
    })

    it('caps list at 8 items', async () => {
      const notifs = Array.from({ length: 12 }, () => makeNotif())
      const { wrapper } = await mountHeader(notifs)
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      // each item has data-testid="nd-item-{id}"
      const items = wrapper.findAll('[data-testid^="nd-item-"]')
      expect(items.length).toBe(8)
    })
  })

  // ── Mark read on click ───────────────────────────────────────
  describe('click notification', () => {
    it('marks notification as read on click', async () => {
      const n = makeNotif({ read: false })
      const { wrapper, ui } = await mountHeader([n])
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      await wrapper.find(`[data-testid="nd-item-${n.id}"]`).trigger('click')
      await flushPromises()
      const stored = ui.notifications.find(x => x.id === n.id)
      expect(stored.read).toBe(true)
    })

    it('closes dropdown after clicking a notification', async () => {
      const n = makeNotif()
      const { wrapper } = await mountHeader([n])
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      await wrapper.find(`[data-testid="nd-item-${n.id}"]`).trigger('click')
      await flushPromises()
      expect(wrapper.find('[data-testid="notif-dropdown"]').isVisible()).toBe(false)
    })
  })

  // ── Mark all read ─────────────────────────────────────────────
  describe('mark all read', () => {
    it('markAllRead button calls ui.markAllRead', async () => {
      const { wrapper, ui } = await mountHeader([makeNotif(), makeNotif()])
      const spy = vi.spyOn(ui, 'markAllRead')
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      await wrapper.find('[data-testid="mark-all-read-btn"]').trigger('click')
      expect(spy).toHaveBeenCalledOnce()
    })

    it('mark-all-read button is hidden when unreadCount is 0', async () => {
      const { wrapper } = await mountHeader([makeNotif({ read: true })])
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      expect(wrapper.find('[data-testid="mark-all-read-btn"]').exists()).toBe(false)
    })
  })

  // ── Clear all ─────────────────────────────────────────────────
  describe('clear notifications', () => {
    it('clear button calls ui.clearNotifications', async () => {
      const { wrapper, ui } = await mountHeader([makeNotif()])
      const spy = vi.spyOn(ui, 'clearNotifications')
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      await wrapper.find('[data-testid="clear-btn"]').trigger('click')
      expect(spy).toHaveBeenCalledOnce()
    })

    it('clear button is hidden when list is empty', async () => {
      const { wrapper } = await mountHeader([])
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      expect(wrapper.find('[data-testid="clear-btn"]').exists()).toBe(false)
    })
  })

  // ── timeAgo ──────────────────────────────────────────────────
  describe('timeAgo formatting', () => {
    it('returns "همین الان" for a freshly created notification', async () => {
      const n = makeNotif({ createdAt: new Date().toISOString() })
      const { wrapper } = await mountHeader([n])
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      const item = wrapper.find(`[data-testid="nd-item-${n.id}"]`)
      expect(item.text()).toContain('همین الان')
    })

    it('shows minutes ago for notifications older than 60s', async () => {
      const past = new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 min ago
      const n = makeNotif({ createdAt: past })
      const { wrapper } = await mountHeader([n])
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      const item = wrapper.find(`[data-testid="nd-item-${n.id}"]`)
      expect(item.text()).toContain('دقیقه پیش')
    })
  })

  // ── Icon types ───────────────────────────────────────────────
  describe('icon classes by type', () => {
    it('order type gets anh__icon--order class', async () => {
      const n = makeNotif({ type: 'order' })
      const { wrapper } = await mountHeader([n])
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      expect(wrapper.find('.anh__icon--order').exists()).toBe(true)
    })

    it('review type gets anh__icon--review class', async () => {
      const n = makeNotif({ type: 'review' })
      const { wrapper } = await mountHeader([n])
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      expect(wrapper.find('.anh__icon--review').exists()).toBe(true)
    })

    it('unknown type gets anh__icon--system class', async () => {
      const n = makeNotif({ type: 'something_else' })
      const { wrapper } = await mountHeader([n])
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      expect(wrapper.find('.anh__icon--system').exists()).toBe(true)
    })
  })
})
