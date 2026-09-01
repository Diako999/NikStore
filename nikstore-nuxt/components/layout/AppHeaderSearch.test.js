import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('~/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

vi.mock('@vueuse/core', () => ({
  onClickOutside: vi.fn(),
  useDebounceFn:  (fn) => fn,   // no 300ms delay in tests
}))

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockHttp = { get: vi.fn() }
vi.mock('~/services/http.service', () => ({ default: mockHttp }))

import AppHeaderSearch from './AppHeaderSearch.vue'

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeProducts = (names = ['عینک آفتابی ری‌بن', 'عینک طبی تیتانیوم']) =>
  names.map((name, i) => ({ name, slug: `p-slug-${i}` }))

const makeCategories = (names = ['عینک آفتابی']) =>
  names.map((name, i) => ({ name, slug: `c-slug-${i}` }))

function factory() {
  return mount(AppHeaderSearch, {
    attachTo: document.body,
    global:   { stubs: { transition: false } },
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AppHeaderSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHttp.get.mockResolvedValue({
      data: { products: makeProducts(), categories: makeCategories() },
    })
  })

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders search input and button', () => {
    const w = factory()
    expect(w.find('input[type="text"]').exists()).toBe(true)
    expect(w.find('button').text()).toBe('جستجو')
  })

  it('dropdown is hidden before input', () => {
    const w = factory()
    expect(w.find('.rounded-2xl').exists()).toBe(false)
  })

  // ── Suggestions ────────────────────────────────────────────────────────────

  it('calls /search/suggest and shows results after typing', async () => {
    const w = factory()
    await w.find('input').trigger('focus')
    await w.find('input').setValue('عینک')
    await flushPromises()

    expect(mockHttp.get).toHaveBeenCalledWith('/search/suggest', { params: { q: 'عینک' } })
    expect(w.text()).toContain('عینک آفتابی ری‌بن')
  })

  it('shows "محصولات" label when products exist', async () => {
    const w = factory()
    await w.find('input').trigger('focus')
    await w.find('input').setValue('عینک')
    await flushPromises()
    expect(w.text()).toContain('محصولات')
  })

  it('shows "دسته‌بندی‌ها" label and category name', async () => {
    const w = factory()
    await w.find('input').trigger('focus')
    await w.find('input').setValue('عینک')
    await flushPromises()
    expect(w.text()).toContain('دسته‌بندی‌ها')
    expect(w.text()).toContain('عینک آفتابی')
  })

  it('shows no-results message when API returns empty', async () => {
    mockHttp.get.mockResolvedValue({ data: { products: [], categories: [] } })
    const w = factory()
    await w.find('input').trigger('focus')
    await w.find('input').setValue('xyz')
    await flushPromises()
    expect(w.text()).toContain('نتیجه‌ای برای')
  })

  it('shows no-results and logs error when API throws', async () => {
    const { logger } = await import('~/utils/logger')
    mockHttp.get.mockRejectedValue(new Error('Network error'))
    const w = factory()
    await w.find('input').trigger('focus')
    await w.find('input').setValue('عینک')
    await flushPromises()

    expect(w.text()).toContain('نتیجه‌ای برای')
    expect(logger.error).toHaveBeenCalledWith(
      'search: suggest request failed',
      expect.anything(),
      'AppHeaderSearch',
    )
  })

  it('does not call API for empty query', async () => {
    const w = factory()
    await w.find('input').trigger('focus')
    await w.find('input').setValue('')
    await nextTick()
    expect(mockHttp.get).not.toHaveBeenCalled()
  })

  it('does not call API for single-character query', async () => {
    const w = factory()
    await w.find('input').trigger('focus')
    await w.find('input').setValue('ع')
    await nextTick()
    expect(mockHttp.get).not.toHaveBeenCalled()
  })

  it('normalizes legacy string[] response to { products, categories }', async () => {
    mockHttp.get.mockResolvedValue({ data: ['عینک آفتابی', 'عینک طبی'] })
    const w = factory()
    await w.find('input').trigger('focus')
    await w.find('input').setValue('عینک')
    await flushPromises()
    expect(w.text()).toContain('عینک آفتابی')
    expect(w.text()).toContain('محصولات')
  })

  it('legacy format product with no slug navigates to /search', async () => {
    mockHttp.get.mockResolvedValue({ data: ['عینک آفتابی'] })
    const w = factory()
    await w.find('input').trigger('focus')
    await w.find('input').setValue('عینک')
    await flushPromises()

    const btn = w.findAll('button').find(b => b.text().includes('عینک آفتابی'))
    await btn.trigger('click')

    expect(mockPush).toHaveBeenCalledWith({ path: '/search', query: { q: 'عینک آفتابی' } })
  })

  // ── Navigation ─────────────────────────────────────────────────────────────

  it('clicking a product navigates to /product/:slug and clears input', async () => {
    const w = factory()
    await w.find('input').trigger('focus')
    await w.find('input').setValue('عینک')
    await flushPromises()

    const btn = w.findAll('button').find(b => b.text().includes('عینک آفتابی ری‌بن'))
    await btn.trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/product/p-slug-0')
    expect(w.find('input').element.value).toBe('')
  })

  it('clicking a category navigates to /category/:slug', async () => {
    const w = factory()
    await w.find('input').trigger('focus')
    await w.find('input').setValue('عینک')
    await flushPromises()

    // category button has a "دسته‌بندی" chip inside it
    const btn = w.findAll('button').find(b => b.text().includes('دسته‌بندی'))
    await btn.trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/category/c-slug-0')
  })

  it('Enter key pushes to /search with query param', async () => {
    const w = factory()
    const input = w.find('input')
    await input.setValue('عینک')
    await input.trigger('keydown', { key: 'Enter' })
    expect(mockPush).toHaveBeenCalledWith({ path: '/search', query: { q: 'عینک' } })
  })

  it('search button click pushes to /search', async () => {
    const w = factory()
    await w.find('input').setValue('فریم')
    const btn = w.findAll('button').find(b => b.text() === 'جستجو')
    await btn.trigger('click')
    expect(mockPush).toHaveBeenCalledWith({ path: '/search', query: { q: 'فریم' } })
  })

  it('Escape key closes the dropdown', async () => {
    const w = factory()
    await w.find('input').trigger('focus')
    await w.find('input').setValue('عینک')
    await w.find('input').trigger('keydown', { key: 'Escape' })
    await nextTick()
    expect(w.find('.rounded-2xl').exists()).toBe(false)
  })

  // ── Keyboard shortcut ──────────────────────────────────────────────────────

  it('Ctrl+K focuses the search input', async () => {
    const w = factory()
    const input = w.find('input').element
    const focusSpy = vi.spyOn(input, 'focus')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    await nextTick()

    expect(focusSpy).toHaveBeenCalled()
  })
})
