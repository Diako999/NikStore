import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('@/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('@/stores/settings.store', () => ({
  useSettingsStore: () => ({
    siteName: 'نیک',
    tagline: 'فروشگاه نیک',
    logoUrl: '',
    // Non-null so the brandVisible watch fires immediately in tests
    settings: { siteName: 'نیک', tagline: 'فروشگاه نیک' },
  }),
}))

import AdminSplash from './AdminSplash.vue'
import { logger } from '@/utils/logger'

const factory = (props = {}) =>
  mount(AdminSplash, { props: { ready: false, ...props } })

describe('AdminSplash', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  // ── visibility ──────────────────────────────────────────────────────────────

  describe('visibility', () => {
    it('shows splash when ready=false', () => {
      const w = factory({ ready: false })
      expect(w.find('[data-testid="splash-root"]').exists()).toBe(true)
    })

    it('hides splash when ready=true', async () => {
      const w = factory({ ready: false })
      await w.setProps({ ready: true })
      expect(w.find('[data-testid="splash-root"]').exists()).toBe(false)
    })

    it('does not render splash when mounted with ready=true', () => {
      const w = factory({ ready: true })
      expect(w.find('[data-testid="splash-root"]').exists()).toBe(false)
    })
  })

  // ── content ─────────────────────────────────────────────────────────────────

  describe('content', () => {
    it('renders glasses SVG', () => {
      expect(factory().find('svg').exists()).toBe(true)
    })

    it('SVG container is aria-hidden (decorative)', () => {
      expect(factory().find('[aria-hidden="true"]').exists()).toBe(true)
    })

    it('shows brand name نیک after timer + settings ready', async () => {
      const w = factory()
      vi.advanceTimersByTime(1000)
      await w.vm.$nextTick()
      expect(w.find('.adm-brand').text()).toContain('نیک')
    })

    it('shows پنل مدیریت badge after timer + settings ready', async () => {
      const w = factory()
      vi.advanceTimersByTime(1000)
      await w.vm.$nextTick()
      expect(w.find('[data-testid="admin-badge"]').text()).toContain('پنل مدیریت')
    })

    it('renders progress bar', () => {
      expect(factory().find('[data-testid="progress-bar"]').exists()).toBe(true)
    })

    it('progress bar has accessible role and label', () => {
      const bar = factory().find('[data-testid="progress-bar"]')
      expect(bar.attributes('role')).toBe('status')
      expect(bar.attributes('aria-label')).toBeTruthy()
    })

    it('renders left and right lens frames', () => {
      const svg = factory().find('svg')
      expect(svg.find('.adm-lens-l').exists()).toBe(true)
      expect(svg.find('.adm-lens-r').exists()).toBe(true)
    })

    it('renders bridge', () => {
      expect(factory().find('.adm-bridge').exists()).toBe(true)
    })

    it('renders both temples', () => {
      const w = factory()
      expect(w.find('.adm-temple-l').exists()).toBe(true)
      expect(w.find('.adm-temple-r').exists()).toBe(true)
    })

    it('renders radar pulse circles', () => {
      const w = factory()
      expect(w.findAll('.adm-radar').length).toBeGreaterThanOrEqual(2)
    })

    it('renders dot-grid background layer', () => {
      expect(factory().find('.adm-grid').exists()).toBe(true)
    })
  })

  // ── events ──────────────────────────────────────────────────────────────────

  describe('events', () => {
    it('emits hidden when onAfterLeave is called', () => {
      const w = factory()
      w.vm.onAfterLeave()
      expect(w.emitted('hidden')).toBeTruthy()
      expect(w.emitted('hidden')).toHaveLength(1)
    })

    it('emits hidden only once per call', () => {
      const w = factory()
      w.vm.onAfterLeave()
      w.vm.onAfterLeave()
      expect(w.emitted('hidden')).toHaveLength(2)
    })
  })

  // ── logging ─────────────────────────────────────────────────────────────────

  describe('logging', () => {
    it('logs debug on mount', () => {
      factory()
      expect(logger.debug).toHaveBeenCalledWith(
        'admin-splash: radar animation started', {}, 'AdminSplash',
      )
    })

    it('logs info when ready becomes true', async () => {
      const w = factory({ ready: false })
      await w.setProps({ ready: true })
      expect(logger.info).toHaveBeenCalledWith(
        'admin-splash: auth ready — fading out splash', {}, 'AdminSplash',
      )
    })

    it('does not log info when ready stays false', () => {
      factory({ ready: false })
      expect(logger.info).not.toHaveBeenCalled()
    })

    it('logs debug when onAfterLeave fires', () => {
      const w = factory()
      vi.clearAllMocks()
      w.vm.onAfterLeave()
      expect(logger.debug).toHaveBeenCalledWith(
        'admin-splash: leave transition complete — splash removed', {}, 'AdminSplash',
      )
    })
  })
})
