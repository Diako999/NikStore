import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// ── Hoisted mocks (referenced inside vi.mock factories) ───────────────────────

const { svcMock, uiMock } = vi.hoisted(() => ({
  svcMock: {
    getAll:  vi.fn(),
    create:  vi.fn(),
    update:  vi.fn(),
    remove:  vi.fn(),
    toggle:  vi.fn(),
  },
  uiMock: { addToast: vi.fn() },
}))

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('@/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('@/utils/constants',  () => ({ ITEMS_PER_PAGE: 20 }))

vi.mock('@/utils/formatters', () => ({
  formatPrice:  vi.fn((v) => `${v}`),
  formatNumber: vi.fn((v) => `${v}`),
  formatDate:   vi.fn((v) => v ?? ''),
}))

vi.mock('@/composables/useDebounce', () => ({
  useDebounce: vi.fn((r) => r),
}))

vi.mock('@/services/discount.service', () => ({ discountService: svcMock }))
vi.mock('@/stores/ui.store',           () => ({ useUiStore: () => uiMock }))

// ── Imports ───────────────────────────────────────────────────────────────────

import { logger }    from '@/utils/logger'
import DiscountsView from './DiscountsView.vue'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockCoupons = [
  { _id: 'c1', code: 'SAVE10',  type: 'percentage', value: 10,    usedCount: 3, usageLimit: 50,   endDate: '2025-12-31', isActive: true  },
  { _id: 'c2', code: 'FLAT50K', type: 'fixed',       value: 50000, usedCount: 0, usageLimit: null, endDate: null,         isActive: false },
]

const okResponse = (overrides = {}) => ({
  data: { coupons: mockCoupons, total: 2, totalPages: 1, ...overrides },
})

// ── Stubs ─────────────────────────────────────────────────────────────────────

const stubs = {
  AdminTable: {
    name:     'AdminTable',
    props:    ['columns', 'rows', 'loading', 'skeletonRows', 'emptyText'],
    template: '<div data-testid="table" />',
  },
  AdminButton:     { template: '<button @click="$emit(\'click\')"><slot/></button>', emits: ['click'] },
  AdminInput:      { props: ['modelValue'], emits: ['update:modelValue'], template: '<input data-testid="search-input" />' },
  AdminSelect:     { props: ['modelValue', 'options'], emits: ['update:modelValue'], template: '<select data-testid="filter-select" />' },
  AdminPagination: { props: ['modelValue', 'totalPages', 'loading'], emits: ['update:modelValue'], template: '<div />' },
  AdminConfirm:    { props: ['modelValue', 'loading'], emits: ['update:modelValue', 'confirm'], template: '<div />' },
  DiscountFormModal: { props: ['modelValue', 'discount'], emits: ['update:modelValue', 'saved'], template: '<div />' },
}

const factory = () => mount(DiscountsView, { global: { stubs } })

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DiscountsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    svcMock.getAll.mockResolvedValue(okResponse())
  })

  // ── data loading ──────────────────────────────────────────────────────────

  describe('data loading', () => {
    it('calls discountService.getAll on mount', async () => {
      factory()
      await flushPromises()
      expect(svcMock.getAll).toHaveBeenCalledOnce()
    })

    it('passes page and limit to getAll', async () => {
      factory()
      await flushPromises()
      expect(svcMock.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 20 }),
      )
    })

    it('populates discounts from data.coupons', async () => {
      const w = factory()
      await flushPromises()
      const table = w.findComponent({ name: 'AdminTable' })
      expect(table.props('rows')).toHaveLength(2)
      expect(table.props('rows')[0].code).toBe('SAVE10')
    })

    it('reads total from data.total', async () => {
      const w = factory()
      await flushPromises()
      expect(w.vm.total).toBe(2)
    })

    it('handles empty list without error', async () => {
      svcMock.getAll.mockResolvedValue({ data: { coupons: [], total: 0, totalPages: 0 } })
      const w = factory()
      await flushPromises()
      expect(w.vm.discounts).toHaveLength(0)
      expect(w.vm.total).toBe(0)
    })

    it('shows error toast on fetch failure', async () => {
      svcMock.getAll.mockRejectedValue(new Error('network'))
      factory()
      await flushPromises()
      expect(uiMock.addToast).toHaveBeenCalledWith(
        expect.stringContaining('خطا'), 'error',
      )
    })

    it('leaves discounts empty on error', async () => {
      svcMock.getAll.mockRejectedValue(new Error('network'))
      const w = factory()
      await flushPromises()
      expect(w.vm.discounts).toHaveLength(0)
    })
  })

  // ── logging ───────────────────────────────────────────────────────────────

  describe('logging', () => {
    it('logs debug on mount', async () => {
      factory()
      await flushPromises()
      expect(logger.debug).toHaveBeenCalledWith(
        'discounts: view mounted', {}, 'DiscountsView',
      )
    })

    it('logs debug before fetch starts', async () => {
      factory()
      await flushPromises()
      expect(logger.debug).toHaveBeenCalledWith(
        'discounts: fetching',
        expect.objectContaining({ page: 1 }),
        'DiscountsView',
      )
    })

    it('logs info after successful fetch', async () => {
      factory()
      await flushPromises()
      expect(logger.info).toHaveBeenCalledWith(
        'discounts: loaded',
        { count: 2, total: 2 },
        'DiscountsView',
      )
    })

    it('logs error on fetch failure', async () => {
      svcMock.getAll.mockRejectedValue(new Error('oops'))
      factory()
      await flushPromises()
      expect(logger.error).toHaveBeenCalledWith(
        'discounts: fetch failed',
        expect.objectContaining({ err: expect.any(Error) }),
        'DiscountsView',
      )
    })

    it('logs info after successful toggle', async () => {
      svcMock.toggle.mockResolvedValue({ data: { isActive: false } })
      const w = factory()
      await flushPromises()
      vi.clearAllMocks()

      await w.vm.toggleActive({ ...mockCoupons[0] })
      await flushPromises()

      expect(logger.info).toHaveBeenCalledWith(
        'discounts: toggled',
        expect.objectContaining({ code: 'SAVE10' }),
        'DiscountsView',
      )
    })

    it('logs error on toggle failure', async () => {
      svcMock.toggle.mockRejectedValue(new Error('fail'))
      const w = factory()
      await flushPromises()
      vi.clearAllMocks()

      await w.vm.toggleActive({ ...mockCoupons[0] })
      await flushPromises()

      expect(logger.error).toHaveBeenCalledWith(
        'discounts: toggle failed',
        expect.objectContaining({ err: expect.any(Error) }),
        'DiscountsView',
      )
    })

    it('logs info after successful delete', async () => {
      svcMock.remove.mockResolvedValue({})
      const w = factory()
      await flushPromises()
      vi.clearAllMocks()

      w.vm.confirmDelete(mockCoupons[0])
      await w.vm.doDelete()
      await flushPromises()

      expect(logger.info).toHaveBeenCalledWith(
        'discounts: deleted',
        { code: 'SAVE10' },
        'DiscountsView',
      )
    })

    it('logs error on delete failure', async () => {
      svcMock.remove.mockRejectedValue(new Error('fail'))
      const w = factory()
      await flushPromises()
      vi.clearAllMocks()

      w.vm.confirmDelete(mockCoupons[0])
      await w.vm.doDelete()
      await flushPromises()

      expect(logger.error).toHaveBeenCalledWith(
        'discounts: delete failed',
        expect.objectContaining({ err: expect.any(Error) }),
        'DiscountsView',
      )
    })
  })

  // ── toggleActive ──────────────────────────────────────────────────────────

  describe('toggleActive', () => {
    it('calls discountService.toggle with the row id', async () => {
      svcMock.toggle.mockResolvedValue({ data: { isActive: false } })
      const w = factory()
      await flushPromises()

      await w.vm.toggleActive({ ...mockCoupons[0] })
      expect(svcMock.toggle).toHaveBeenCalledWith('c1')
    })

    it('updates row.isActive from API response', async () => {
      svcMock.toggle.mockResolvedValue({ data: { isActive: false } })
      const w = factory()
      await flushPromises()

      const row = { ...mockCoupons[0], isActive: true }
      await w.vm.toggleActive(row)
      await flushPromises()
      expect(row.isActive).toBe(false)
    })

    it('reverts isActive on error', async () => {
      svcMock.toggle.mockRejectedValue(new Error())
      const w = factory()
      await flushPromises()

      const row = { ...mockCoupons[0], isActive: true }
      await w.vm.toggleActive(row)
      await flushPromises()
      expect(row.isActive).toBe(true)
    })

    it('shows error toast on toggle failure', async () => {
      svcMock.toggle.mockRejectedValue(new Error())
      const w = factory()
      await flushPromises()
      vi.clearAllMocks()

      await w.vm.toggleActive({ ...mockCoupons[0] })
      await flushPromises()
      expect(uiMock.addToast).toHaveBeenCalledWith(expect.any(String), 'error')
    })
  })

  // ── doDelete ──────────────────────────────────────────────────────────────

  describe('doDelete', () => {
    it('calls discountService.remove with correct id', async () => {
      svcMock.remove.mockResolvedValue({})
      const w = factory()
      await flushPromises()

      w.vm.confirmDelete(mockCoupons[0])
      await w.vm.doDelete()
      expect(svcMock.remove).toHaveBeenCalledWith('c1')
    })

    it('removes item from discounts list on success', async () => {
      svcMock.remove.mockResolvedValue({})
      const w = factory()
      await flushPromises()

      w.vm.confirmDelete(mockCoupons[0])
      await w.vm.doDelete()
      await flushPromises()

      expect(w.vm.discounts.find(d => d._id === 'c1')).toBeUndefined()
    })

    it('decrements total on success', async () => {
      svcMock.remove.mockResolvedValue({})
      const w = factory()
      await flushPromises()

      w.vm.confirmDelete(mockCoupons[0])
      await w.vm.doDelete()
      await flushPromises()

      expect(w.vm.total).toBe(1)
    })

    it('shows error toast on delete failure', async () => {
      svcMock.remove.mockRejectedValue(new Error())
      const w = factory()
      await flushPromises()
      vi.clearAllMocks()

      w.vm.confirmDelete(mockCoupons[0])
      await w.vm.doDelete()
      await flushPromises()

      expect(uiMock.addToast).toHaveBeenCalledWith(expect.any(String), 'error')
    })

    it('does not remove item from list on failure', async () => {
      svcMock.remove.mockRejectedValue(new Error())
      const w = factory()
      await flushPromises()

      w.vm.confirmDelete(mockCoupons[0])
      await w.vm.doDelete()
      await flushPromises()

      expect(w.vm.discounts).toHaveLength(2)
    })
  })
})
