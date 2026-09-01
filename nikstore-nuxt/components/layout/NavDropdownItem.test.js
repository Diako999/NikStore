import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('~/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('vue-router', () => ({
  RouterLink: { props: ['to'], template: '<a><slot /></a>' },
}))

// ── Imports ───────────────────────────────────────────────────────────────────

import { logger } from '~/utils/logger'
import NavDropdownItem from './NavDropdownItem.vue'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const leafItem = {
  _id: 'leaf1',
  name: 'عینک آفتابی مردانه',
  slug: 'men-sunglasses',
  children: [],
}

const parentItem = {
  _id: 'parent1',
  name: 'عینک آفتابی لاکچری',
  slug: 'luxury-sunglasses',
  children: [
    { _id: 'child1', name: 'مدل A', slug: 'model-a', children: [] },
    { _id: 'child2', name: 'مدل B', slug: 'model-b', children: [] },
  ],
}

const deepItem = {
  _id: 'deep1',
  name: 'دسته عمیق',
  slug: 'deep',
  children: [
    {
      _id: 'mid1',
      name: 'میانی',
      slug: 'mid',
      children: [
        { _id: 'leaf2', name: 'برگ', slug: 'leaf', children: [] },
      ],
    },
  ],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

let _wrapper = null

function makeWrapper(item) {
  _wrapper = mount(NavDropdownItem, {
    props: { item },
    global: {
      stubs: { RouterLink: { props: ['to'], template: '<a><slot /></a>' } },
    },
  })
  return _wrapper
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('NavDropdownItem', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })
  afterEach(() => {
    if (_wrapper) { _wrapper.unmount(); _wrapper = null }
    vi.useRealTimers()
  })

  // ── Leaf item ─────────────────────────────────────────────────────────────

  describe('leaf item (no children)', () => {
    it('renders the item name', () => {
      const w = makeWrapper(leafItem)
      expect(w.text()).toContain('عینک آفتابی مردانه')
    })

    it('does not render the expand chevron', () => {
      const w = makeWrapper(leafItem)
      expect(w.find('[data-testid="sub-chevron"]').exists()).toBe(false)
    })

    it('does not render a sub-panel', () => {
      const w = makeWrapper(leafItem)
      expect(w.find('[data-testid="sub-panel"]').exists()).toBe(false)
    })

    it('does not log on hover (no sub-panel to open)', async () => {
      const w = makeWrapper(leafItem)
      await w.find('li').trigger('mouseenter')
      await nextTick()
      expect(logger.debug).not.toHaveBeenCalled()
    })
  })

  // ── Parent item (has children) ────────────────────────────────────────────

  describe('parent item (has children)', () => {
    it('renders the expand chevron', () => {
      const w = makeWrapper(parentItem)
      expect(w.find('[data-testid="sub-chevron"]').exists()).toBe(true)
    })

    it('sub-panel is hidden on mount', () => {
      const w = makeWrapper(parentItem)
      expect(w.find('[data-testid="sub-panel"]').isVisible()).toBe(false)
    })

    it('shows sub-panel on mouseenter', async () => {
      const w = makeWrapper(parentItem)
      await w.find('li').trigger('mouseenter')
      await nextTick()
      expect(w.find('[data-testid="sub-panel"]').isVisible()).toBe(true)
    })

    it('hides sub-panel after mouseleave + 150 ms', async () => {
      const w = makeWrapper(parentItem)
      await w.find('li').trigger('mouseenter')
      await nextTick()
      await w.find('[data-testid="sub-panel"]').trigger('mouseleave')
      vi.advanceTimersByTime(150)
      await nextTick()
      expect(w.find('[data-testid="sub-panel"]').isVisible()).toBe(false)
    })

    it('keeps sub-panel open when mouse moves from trigger into sub-panel', async () => {
      const w = makeWrapper(parentItem)
      await w.find('li').trigger('mouseenter')
      await nextTick()
      // leave li, enter sub-panel — timer should be cancelled
      await w.find('[data-testid="sub-panel"]').trigger('mouseenter')
      vi.advanceTimersByTime(150)
      await nextTick()
      expect(w.find('[data-testid="sub-panel"]').isVisible()).toBe(true)
    })

    it('renders all children inside the sub-panel', async () => {
      const w = makeWrapper(parentItem)
      await w.find('li').trigger('mouseenter')
      await nextTick()
      const panel = w.find('[data-testid="sub-panel"]')
      expect(panel.text()).toContain('مدل A')
      expect(panel.text()).toContain('مدل B')
    })

    it('sub-panel is positioned to the right (RTL outward direction)', () => {
      const w = makeWrapper(parentItem)
      const panel = w.find('[data-testid="sub-panel"]')
      expect(panel.attributes('style')).toContain('right:')
    })

    it('logs debug when opening the sub-panel', async () => {
      const w = makeWrapper(parentItem)
      await w.find('li').trigger('mouseenter')
      await nextTick()
      expect(logger.debug).toHaveBeenCalledWith(
        'nav dropdown: opening sub-panel',
        { name: 'عینک آفتابی لاکچری' },
        'NavDropdownItem',
      )
    })

    it('does not log again on repeated mouseenter while panel is already open', async () => {
      const w = makeWrapper(parentItem)
      await w.find('li').trigger('mouseenter')
      await nextTick()
      await w.find('li').trigger('mouseenter')
      await nextTick()
      expect(logger.debug).toHaveBeenCalledTimes(1)
    })
  })

  // ── Deep nesting ──────────────────────────────────────────────────────────

  describe('deep nesting', () => {
    it('renders grand-child items inside a nested sub-panel', async () => {
      const w = makeWrapper(deepItem)
      await w.find('li').trigger('mouseenter')
      await nextTick()
      const panel = w.find('[data-testid="sub-panel"]')
      expect(panel.text()).toContain('میانی')
    })
  })
})
