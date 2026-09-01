import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, reactive, nextTick } from 'vue'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('~/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('~/components/layout/NavDropdownItem.vue', () => ({
  default: { template: '<li />' },
}))

const mockRoute = reactive({ name: 'home', params: {} })
vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}))

const mockCategories = ref([
  {
    _id: 'c1',
    name: 'عینک آفتابی',
    slug: 'sunglasses',
    icon: '🕶️',
    children: [{ _id: 'c1a', name: 'اسپرت', slug: 'sport', children: [] }],
  },
  {
    _id: 'c2',
    name: 'لوازم جانبی',
    slug: 'accessories',
    icon: null,
    children: [],
  },
])

vi.mock('~/stores/category.store', () => ({
  useCategoryStore: () => ({ categories: mockCategories }),
}))

// storeToRefs pass-through: our mock store already holds plain refs
vi.mock('pinia', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, storeToRefs: (s) => s }
})

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import { logger } from '~/utils/logger'
import AppHeaderNav from './AppHeaderNav.vue'

// ── Helpers ───────────────────────────────────────────────────────────────────

let _wrapper = null

function makeWrapper() {
  _wrapper = mount(AppHeaderNav, {
    global: {
      // Declare `to` as a prop so it doesn't bleed into $attrs and appear on the <a>
      stubs: { NuxtLink: { props: ['to'], template: '<a><slot /></a>' } },
    },
  })
  return _wrapper
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AppHeaderNav', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    mockRoute.name   = 'home'
    mockRoute.params = {}
  })

  afterEach(() => {
    if (_wrapper) { _wrapper.unmount(); _wrapper = null }
    vi.useRealTimers()
  })

  // ── Sub-panel clipping regression ────────────────────────────────────────

  describe('sub-panel clipping regression', () => {
    it('dropdown panel does not use overflow-hidden (would clip sub-category panels)', async () => {
      const w = makeWrapper()
      await w.find('[data-testid="cat-item-c1"]').trigger('mouseenter')
      await nextTick()
      const dropInner = w.find('[data-testid="dropdown-c1"] > div')
      // overflow-hidden on the panel clips absolute sub-panels from NavDropdownItem
      expect(dropInner.classes()).not.toContain('overflow-hidden')
    })
  })

  // ── Dropdown visibility ───────────────────────────────────────────────────

  describe('dropdown visibility', () => {
    it('all dropdowns are hidden on mount', async () => {
      const w = makeWrapper()
      const drops = w.findAll('[data-testid^="dropdown-"]')
      expect(drops.length).toBeGreaterThan(0)
      drops.forEach(d => expect(d.isVisible()).toBe(false))
    })

    it('shows dropdown on mouseenter for a category with children', async () => {
      const w = makeWrapper()
      await w.find('[data-testid="cat-item-c1"]').trigger('mouseenter')
      await nextTick()
      expect(w.find('[data-testid="dropdown-c1"]').isVisible()).toBe(true)
    })

    it('does not show dropdown for a category with no children', async () => {
      const w = makeWrapper()
      await w.find('[data-testid="cat-item-c2"]').trigger('mouseenter')
      await nextTick()
      expect(w.find('[data-testid="dropdown-c2"]').isVisible()).toBe(false)
    })

    it('dropdown remains visible until the 150 ms timer fires', async () => {
      // NOTE: in JSDOM, trigger('mouseleave') on the outer wrapper (cat-item-c1) also
      // fires mouseenter on its visible child (dropdown-c1), which clears the timer.
      // We trigger leave from the leaf element (dropdown-c1) to avoid this quirk.
      const w = makeWrapper()
      await w.find('[data-testid="cat-item-c1"]').trigger('mouseenter')
      await nextTick()
      await w.find('[data-testid="dropdown-c1"]').trigger('mouseleave')
      vi.advanceTimersByTime(149) // just before the 150 ms threshold
      await nextTick()
      expect(w.find('[data-testid="dropdown-c1"]').isVisible()).toBe(true)
    })

    it('dropdown stays visible when mouse moves from trigger into the panel', async () => {
      const w = makeWrapper()
      await w.find('[data-testid="cat-item-c1"]').trigger('mouseenter')
      await nextTick()

      // Simulate mouse moving into the dropdown panel before the timer fires
      await w.find('[data-testid="cat-item-c1"]').trigger('mouseleave')
      await w.find('[data-testid="dropdown-c1"]').trigger('mouseenter')
      vi.advanceTimersByTime(150)
      await nextTick()
      expect(w.find('[data-testid="dropdown-c1"]').isVisible()).toBe(true)
    })

    it('hides dropdown after leaving the panel', async () => {
      const w = makeWrapper()
      await w.find('[data-testid="cat-item-c1"]').trigger('mouseenter')
      await nextTick()
      await w.find('[data-testid="dropdown-c1"]').trigger('mouseleave')
      vi.advanceTimersByTime(150)
      await nextTick()
      expect(w.find('[data-testid="dropdown-c1"]').isVisible()).toBe(false)
    })
  })

  // ── Logger ────────────────────────────────────────────────────────────────

  describe('logger', () => {
    it('logs debug when a new category is hovered', async () => {
      const w = makeWrapper()
      await w.find('[data-testid="cat-item-c1"]').trigger('mouseenter')
      await nextTick()
      expect(logger.debug).toHaveBeenCalledWith(
        'desktop nav: hovering category', { id: 'c1' }, 'AppHeaderNav',
      )
    })

    it('does not log again when the same category is re-entered', async () => {
      const w = makeWrapper()
      await w.find('[data-testid="cat-item-c1"]').trigger('mouseenter')
      await nextTick()
      await w.find('[data-testid="cat-item-c1"]').trigger('mouseenter')
      await nextTick()
      expect(logger.debug).toHaveBeenCalledTimes(1)
    })

    it('logs separately for each distinct category entered', async () => {
      const w = makeWrapper()
      await w.find('[data-testid="cat-item-c1"]').trigger('mouseenter')
      await nextTick()
      await w.find('[data-testid="cat-item-c2"]').trigger('mouseenter')
      await nextTick()
      expect(logger.debug).toHaveBeenCalledTimes(2)
      expect(logger.debug).toHaveBeenNthCalledWith(1, 'desktop nav: hovering category', { id: 'c1' }, 'AppHeaderNav')
      expect(logger.debug).toHaveBeenNthCalledWith(2, 'desktop nav: hovering category', { id: 'c2' }, 'AppHeaderNav')
    })
  })

  // ── Active link detection ─────────────────────────────────────────────────

  describe('isLinkActive', () => {
    it('home link is active on the home route', async () => {
      mockRoute.name = 'home'
      const w = makeWrapper()
      expect(w.find('[data-testid="quick-home"]').classes()).toContain('bg-brand')
    })

    it('blog link is active on the blog route', async () => {
      mockRoute.name = 'blog'
      const w = makeWrapper()
      expect(w.find('[data-testid="quick-blog"]').classes()).toContain('bg-brand')
    })

    it('blog link is active on the blog-detail route', async () => {
      mockRoute.name = 'blog-detail'
      const w = makeWrapper()
      expect(w.find('[data-testid="quick-blog"]').classes()).toContain('bg-brand')
    })

    it('home link is not active on non-home routes', async () => {
      mockRoute.name = 'category'
      const w = makeWrapper()
      expect(w.find('[data-testid="quick-home"]').classes()).not.toContain('bg-brand')
    })

    it('blog link is not active on non-blog routes', async () => {
      mockRoute.name = 'home'
      const w = makeWrapper()
      expect(w.find('[data-testid="quick-blog"]').classes()).not.toContain('bg-brand')
    })
  })
})
