import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('~/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import AppSplash from './AppSplash.vue'
import { logger } from '~/utils/logger'

const factory = (props = {}) =>
  mount(AppSplash, { props: { ready: false, ...props } })

describe('AppSplash', () => {
  beforeEach(() => vi.clearAllMocks())

  // ── visibility ──────────────────────────────────────────────────────────────

  describe('visibility', () => {
    it('shows splash content when ready=false', () => {
      const w = factory({ ready: false })
      expect(w.find('[data-testid="splash-root"]').exists()).toBe(true)
    })

    it('hides splash content when ready=true', async () => {
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
      const w = factory()
      expect(w.find('svg').exists()).toBe(true)
    })

    it('SVG is aria-hidden (decorative)', () => {
      const w = factory()
      expect(w.find('[aria-hidden="true"]').exists()).toBe(true)
    })

    it('shows brand name نیک', () => {
      const w = factory()
      expect(w.find('.splash__brand').text()).toContain('نیک')
    })

    it('shows tagline containing نیک', () => {
      const w = factory()
      expect(w.find('.splash__tagline').text()).toContain('نیک')
    })

    it('renders exactly 3 loading dots', () => {
      const w = factory()
      expect(w.findAll('.dot')).toHaveLength(3)
    })

    it('loading dots container has accessible role and label', () => {
      const w = factory()
      const dots = w.find('.splash__dots')
      expect(dots.attributes('role')).toBe('status')
      expect(dots.attributes('aria-label')).toBeTruthy()
    })

    it('renders lens frames (sp-lens-l and sp-lens-r)', () => {
      const w = factory()
      const svg = w.find('svg')
      expect(svg.find('.sp-lens-l').exists()).toBe(true)
      expect(svg.find('.sp-lens-r').exists()).toBe(true)
    })

    it('renders bridge', () => {
      const w = factory()
      expect(w.find('.sp-bridge').exists()).toBe(true)
    })

    it('renders both temples', () => {
      const w = factory()
      expect(w.find('.sp-temple-l').exists()).toBe(true)
      expect(w.find('.sp-temple-r').exists()).toBe(true)
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
  })

  // ── logging ─────────────────────────────────────────────────────────────────

  describe('logging', () => {
    it('logs debug on mount', () => {
      factory()
      expect(logger.debug).toHaveBeenCalledWith(
        'splash: glasses animation started', {}, 'AppSplash',
      )
    })

    it('logs info when ready becomes true', async () => {
      const w = factory({ ready: false })
      await w.setProps({ ready: true })
      expect(logger.info).toHaveBeenCalledWith(
        'splash: app ready — fading out splash screen', {}, 'AppSplash',
      )
    })

    it('does not log info when ready stays false', async () => {
      factory({ ready: false })
      expect(logger.info).not.toHaveBeenCalled()
    })

    it('logs debug when onAfterLeave fires', () => {
      const w = factory()
      vi.clearAllMocks()
      w.vm.onAfterLeave()
      expect(logger.debug).toHaveBeenCalledWith(
        'splash: leave animation complete — splash removed from DOM', {}, 'AppSplash',
      )
    })
  })
})
