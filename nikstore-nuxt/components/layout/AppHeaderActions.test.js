import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

// ── hoisted mocks ───────────────────────────────────────────────
const { mockRouterPush } = vi.hoisted(() => ({ mockRouterPush: vi.fn() }))

vi.mock('vue-router', () => ({
  useRouter:  () => ({ push: mockRouterPush }),
  RouterLink: {
    name:  'RouterLink',
    props: ['to'],
    template: '<a :href="JSON.stringify(to)" :data-to="JSON.stringify(to)"><slot /></a>',
  },
  useRoute: () => ({}),
}))

vi.mock('@vueuse/core', () => ({
  onClickOutside: vi.fn(),
}))

vi.mock('~/stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('~/stores/cart.store', () => ({
  useCartStore: vi.fn(),
}))

vi.mock('~/stores/notification.store', () => ({
  useNotificationStore: vi.fn(),
}))

import { useAuthStore }         from '~/stores/auth.store'
import { useCartStore }         from '~/stores/cart.store'
import { useNotificationStore } from '~/stores/notification.store'
import AppHeaderActions         from './AppHeaderActions.vue'

// ── factory helpers ─────────────────────────────────────────────
const makeNotif = (overrides = {}) => ({
  _id: 'n1', type: 'order_update',
  title: 'سفارش تایید شد', body: 'پردازش می‌شود',
  data: { orderId: 'o1' }, isRead: false,
  createdAt: new Date().toISOString(),
  ...overrides,
})

function makeNotifStore(overrides = {}) {
  return {
    notifications:     [],
    loading:           false,
    unreadCount:       0,
    fetched:           false,
    fetchNotifications: vi.fn().mockResolvedValue(undefined),
    markRead:          vi.fn().mockResolvedValue(undefined),
    markAllRead:       vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

const RouterLinkStub = {
  name:  'RouterLink',
  props: ['to'],
  template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
}

function mountActions({ notifStore, loggedIn = true } = {}) {
  setActivePinia(createPinia())

  useAuthStore.mockReturnValue({
    isLoggedIn: loggedIn,
    user: loggedIn ? { firstName: 'علی', phone: '09121234567' } : null,
    logout: vi.fn(),
  })
  useCartStore.mockReturnValue({ totalItems: 0 })
  useNotificationStore.mockReturnValue(notifStore ?? makeNotifStore())

  return mount(AppHeaderActions, {
    global: {
      stubs: {
        Transition:  { template: '<div><slot /></div>' },
        RouterLink:  RouterLinkStub,
      },
    },
  })
}

describe('AppHeaderActions — notification dropdown', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // ── bell visibility ────────────────────────────────────────────
  describe('bell button', () => {
    it('renders bell button when user is logged in', () => {
      const wrapper = mountActions({ loggedIn: true })
      expect(wrapper.find('[data-testid="bell-btn"]').exists()).toBe(true)
    })

    it('hides bell button when user is not logged in', () => {
      const wrapper = mountActions({ loggedIn: false })
      expect(wrapper.find('[data-testid="bell-btn"]').exists()).toBe(false)
    })

    it('shows unread badge when unreadCount > 0', () => {
      const wrapper = mountActions({ notifStore: makeNotifStore({ unreadCount: 3 }) })
      expect(wrapper.find('[data-testid="bell-badge"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="bell-badge"]').text()).toBe('3')
    })

    it('hides badge when unreadCount is 0', () => {
      const wrapper = mountActions({ notifStore: makeNotifStore({ unreadCount: 0 }) })
      expect(wrapper.find('[data-testid="bell-badge"]').exists()).toBe(false)
    })
  })

  // ── open / close ───────────────────────────────────────────────
  describe('dropdown toggle', () => {
    it('dropdown is hidden initially', () => {
      const wrapper = mountActions()
      expect(wrapper.find('[data-testid="notif-dropdown"]').exists()).toBe(false)
    })

    it('opens dropdown on bell click', async () => {
      const wrapper = mountActions()
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      expect(wrapper.find('[data-testid="notif-dropdown"]').exists()).toBe(true)
    })

    it('closes dropdown on second bell click', async () => {
      const wrapper = mountActions()
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      expect(wrapper.find('[data-testid="notif-dropdown"]').exists()).toBe(false)
    })

    it('fetches notifications on open when not yet fetched', async () => {
      const notifStore = makeNotifStore({ fetched: false })
      const wrapper = mountActions({ notifStore })
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      await flushPromises()
      expect(notifStore.fetchNotifications).toHaveBeenCalledTimes(1)
    })

    it('skips fetch when already fetched', async () => {
      const notifStore = makeNotifStore({ fetched: true })
      const wrapper = mountActions({ notifStore })
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      await flushPromises()
      expect(notifStore.fetchNotifications).not.toHaveBeenCalled()
    })
  })

  // ── states ─────────────────────────────────────────────────────
  describe('dropdown states', () => {
    it('shows loading skeleton while fetching', async () => {
      const wrapper = mountActions({ notifStore: makeNotifStore({ loading: true }) })
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      expect(wrapper.find('[data-testid="nd-loading"]').exists()).toBe(true)
    })

    it('shows empty state when no notifications', async () => {
      const wrapper = mountActions({ notifStore: makeNotifStore({ notifications: [], loading: false }) })
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      expect(wrapper.find('[data-testid="nd-empty"]').exists()).toBe(true)
    })

    it('shows notifications list when notifications exist', async () => {
      const notifStore = makeNotifStore({ notifications: [makeNotif()], loading: false })
      const wrapper = mountActions({ notifStore })
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      expect(wrapper.find('[data-testid="nd-list"]').exists()).toBe(true)
    })

    it('renders max 3 notifications', async () => {
      const notifs = Array.from({ length: 8 }, (_, i) => makeNotif({ _id: `n${i}` }))
      const notifStore = makeNotifStore({ notifications: notifs })
      const wrapper = mountActions({ notifStore })
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      expect(wrapper.findAll('.nd__item')).toHaveLength(3)
    })

    it('shows unread count badge in header when > 0', async () => {
      const notifStore = makeNotifStore({ unreadCount: 4, notifications: [makeNotif()] })
      const wrapper = mountActions({ notifStore })
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      expect(wrapper.find('[data-testid="nd-count"]').text()).toContain('4')
    })

    it('hides count badge in header when unreadCount is 0', async () => {
      const notifStore = makeNotifStore({
        unreadCount: 0,
        notifications: [makeNotif({ isRead: true })],
      })
      const wrapper = mountActions({ notifStore })
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      expect(wrapper.find('[data-testid="nd-count"]').exists()).toBe(false)
    })
  })

  // ── phosphor green ─────────────────────────────────────────────
  describe('unread visual indicators', () => {
    it('unread item has nd__item--unread class', async () => {
      const notifStore = makeNotifStore({ notifications: [makeNotif({ isRead: false })] })
      const wrapper = mountActions({ notifStore })
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      expect(wrapper.find('.nd__item').classes()).toContain('nd__item--unread')
    })

    it('read item does not have nd__item--unread class', async () => {
      const notifStore = makeNotifStore({ notifications: [makeNotif({ isRead: true })] })
      const wrapper = mountActions({ notifStore })
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      expect(wrapper.find('.nd__item').classes()).not.toContain('nd__item--unread')
    })

    it('unread dot has nd__dot--unread class', async () => {
      const notifStore = makeNotifStore({ notifications: [makeNotif({ isRead: false })] })
      const wrapper = mountActions({ notifStore })
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      expect(wrapper.find('.nd__dot').classes()).toContain('nd__dot--unread')
    })

    it('unread title has nd__item-title--unread class', async () => {
      const notifStore = makeNotifStore({ notifications: [makeNotif({ isRead: false })] })
      const wrapper = mountActions({ notifStore })
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      expect(wrapper.find('.nd__item-title').classes()).toContain('nd__item-title--unread')
    })
  })

  // ── click handling ─────────────────────────────────────────────
  describe('clicking a notification item', () => {
    it('calls markRead when clicking unread notification', async () => {
      const notifStore = makeNotifStore({ notifications: [makeNotif({ _id: 'n1', isRead: false })] })
      const wrapper = mountActions({ notifStore })
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      await wrapper.find('[data-testid="nd-item-n1"]').trigger('click')
      await flushPromises()
      expect(notifStore.markRead).toHaveBeenCalledWith('n1')
    })

    it('does not call markRead when clicking read notification', async () => {
      const notifStore = makeNotifStore({ notifications: [makeNotif({ _id: 'n1', isRead: true })] })
      const wrapper = mountActions({ notifStore })
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      await wrapper.find('[data-testid="nd-item-n1"]').trigger('click')
      await flushPromises()
      expect(notifStore.markRead).not.toHaveBeenCalled()
    })

    it('closes dropdown after clicking a notification', async () => {
      const notifStore = makeNotifStore({ notifications: [makeNotif({ _id: 'n1' })] })
      const wrapper = mountActions({ notifStore })
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      await wrapper.find('[data-testid="nd-item-n1"]').trigger('click')
      await flushPromises()
      expect(wrapper.find('[data-testid="notif-dropdown"]').exists()).toBe(false)
    })

    it('navigates to order detail when notification has orderId', async () => {
      const notifStore = makeNotifStore({
        notifications: [makeNotif({ _id: 'n1', data: { orderId: 'order-abc' } })],
      })
      const wrapper = mountActions({ notifStore })
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      await wrapper.find('[data-testid="nd-item-n1"]').trigger('click')
      await flushPromises()
      expect(mockRouterPush).toHaveBeenCalledWith({
        name: 'user-order-detail', params: { id: 'order-abc' },
      })
    })

    it('does not navigate when notification has no route', async () => {
      const notifStore = makeNotifStore({
        notifications: [makeNotif({ _id: 'n1', type: 'info', data: {} })],
      })
      const wrapper = mountActions({ notifStore })
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      await wrapper.find('[data-testid="nd-item-n1"]').trigger('click')
      await flushPromises()
      expect(mockRouterPush).not.toHaveBeenCalled()
    })
  })

  // ── see all footer ─────────────────────────────────────────────
  describe('"see all" footer link', () => {
    it('renders the see-all link', async () => {
      const wrapper = mountActions()
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      expect(wrapper.find('[data-testid="nd-see-all"]').exists()).toBe(true)
    })

    it('see-all link points to user-notifications route', async () => {
      const wrapper = mountActions()
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      const link = wrapper.find('[data-testid="nd-see-all"]')
      expect(link.attributes('data-to')).toContain('user-notifications')
    })

    it('closes dropdown when see-all is clicked', async () => {
      const wrapper = mountActions()
      await wrapper.find('[data-testid="bell-btn"]').trigger('click')
      await wrapper.find('[data-testid="nd-see-all"]').trigger('click')
      expect(wrapper.find('[data-testid="notif-dropdown"]').exists()).toBe(false)
    })
  })
})
