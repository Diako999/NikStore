import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { defineComponent, h } from 'vue'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/services/product.service', () => ({
  productService: {
    getAll:        vi.fn(),
    bulkDiscount:  vi.fn(),
  },
}))

vi.mock('@/services/time-discount.service', () => ({
  timeDiscountService: { create: vi.fn() },
}))

vi.mock('@/utils/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

vi.mock('@/stores/ui.store', () => ({
  useUiStore: () => ({ addToast: vi.fn() }),
}))

vi.mock('@/utils/formatters', () => ({
  formatPrice: (v) => (v ? `${v} تومان` : '—'),
}))

import BulkDiscountModal from './BulkDiscountModal.vue'
import { productService } from '@/services/product.service'
import { logger } from '@/utils/logger'

const PRODUCTS = [
  { _id: '1', name: 'Product A', minPrice: 100_000, thumbnail: '' },
  { _id: '2', name: 'Product B', minPrice: 200_000, thumbnail: '' },
  { _id: '3', name: 'Product C', minPrice: 150_000, thumbnail: '' },
]

function factory(props = {}) {
  return mount(BulkDiscountModal, {
    props: {
      modelValue:      true,
      initialProducts: [],
      categories:      [],
      brands:          [],
      ...props,
    },
    global: { stubs: { Teleport: true } },
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('BulkDiscountModal — initialisation', () => {
  it('renders when modelValue is true', () => {
    const wrapper = factory()
    expect(wrapper.find('[data-testid="apply-btn"]').exists()).toBe(true)
  })

  it('populates targetProducts from initialProducts prop', async () => {
    const wrapper = factory({ initialProducts: [PRODUCTS[0]] })
    expect(wrapper.find('[data-testid="count-badge"]').text()).toBe('1')
  })
})

describe('BulkDiscountModal — addSingle', () => {
  it('does not add duplicate products', async () => {
    const wrapper = factory({ initialProducts: [PRODUCTS[0]] })
    await wrapper.vm.addSingle(PRODUCTS[0])
    expect(wrapper.vm.targetProducts).toHaveLength(1)
  })

  it('adds a new product that is not in the list', async () => {
    const wrapper = factory({ initialProducts: [PRODUCTS[0]] })
    await wrapper.vm.addSingle(PRODUCTS[1])
    expect(wrapper.vm.targetProducts).toHaveLength(2)
  })
})

describe('BulkDiscountModal — removeProduct', () => {
  it('removes product by id', async () => {
    const wrapper = factory({ initialProducts: [PRODUCTS[0], PRODUCTS[1]] })
    await wrapper.vm.removeProduct(PRODUCTS[0]._id)
    expect(wrapper.vm.targetProducts).toHaveLength(1)
    expect(wrapper.vm.targetProducts[0]._id).toBe(PRODUCTS[1]._id)
  })
})

describe('BulkDiscountModal — addAllFiltered', () => {
  it('adds only products not already in the list', async () => {
    const wrapper = factory({ initialProducts: [PRODUCTS[0]] })
    wrapper.vm.filterResults = [...PRODUCTS]
    await wrapper.vm.addAllFiltered()
    expect(wrapper.vm.targetProducts).toHaveLength(3)
    expect(wrapper.vm.targetProducts.filter(p => p._id === PRODUCTS[0]._id)).toHaveLength(1)
  })

  it('clears filter state after adding', async () => {
    const wrapper = factory()
    wrapper.vm.filterResults  = [PRODUCTS[0]]
    wrapper.vm.filterSearched = true
    wrapper.vm.filterCategory = 'cat-1'
    await wrapper.vm.addAllFiltered()
    expect(wrapper.vm.filterResults).toHaveLength(0)
    expect(wrapper.vm.filterSearched).toBe(false)
    expect(wrapper.vm.filterCategory).toBe('')
  })
})

describe('BulkDiscountModal — fetchFiltered', () => {
  it('calls productService.getAll with category/brand params', async () => {
    productService.getAll.mockResolvedValue({ data: { products: PRODUCTS } })
    const wrapper = factory()
    wrapper.vm.filterCategory = 'cat-abc'
    wrapper.vm.filterBrand    = 'brand-xyz'
    await wrapper.vm.fetchFiltered()
    expect(productService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'cat-abc', brand: 'brand-xyz', limit: 200 })
    )
    expect(wrapper.vm.filterResults).toHaveLength(3)
    expect(wrapper.vm.filterSearched).toBe(true)
  })

  it('logs error and shows toast on failure', async () => {
    const err = new Error('Network error')
    productService.getAll.mockRejectedValue(err)
    const wrapper = factory()
    wrapper.vm.filterCategory = 'cat-abc'
    await wrapper.vm.fetchFiltered()
    expect(logger.error).toHaveBeenCalledWith(
      'BulkDiscountModal: fetchFiltered failed',
      err,
      expect.objectContaining({ category: 'cat-abc' }),
      'BulkDiscountModal'
    )
  })
})

describe('BulkDiscountModal — apply', () => {
  it('calls bulkDiscount with correct productIds and discountPct', async () => {
    productService.bulkDiscount.mockResolvedValue({ data: { updated: 2 } })
    const wrapper = factory({ initialProducts: [PRODUCTS[0], PRODUCTS[1]] })
    wrapper.vm.discountPct = 25
    await wrapper.vm.apply()
    expect(productService.bulkDiscount).toHaveBeenCalledWith({
      productIds:  [PRODUCTS[0]._id, PRODUCTS[1]._id],
      discountPct: 25,
    })
  })

  it('emits applied event with correct payload on success', async () => {
    productService.bulkDiscount.mockResolvedValue({ data: { updated: 1 } })
    const wrapper = factory({ initialProducts: [PRODUCTS[0]] })
    wrapper.vm.discountPct = 30
    await wrapper.vm.apply()
    expect(wrapper.emitted('applied')).toBeTruthy()
    expect(wrapper.emitted('applied')[0][0]).toMatchObject({
      productIds: [PRODUCTS[0]._id],
      discountPct: 30,
    })
  })

  it('does nothing when targetProducts is empty', async () => {
    const wrapper = factory()
    await wrapper.vm.apply()
    expect(productService.bulkDiscount).not.toHaveBeenCalled()
  })

  it('logs info before calling API', async () => {
    productService.bulkDiscount.mockResolvedValue({ data: { updated: 1, mode: 'permanent' } })
    const wrapper = factory({ initialProducts: [PRODUCTS[0]] })
    wrapper.vm.discountPct = 20
    await wrapper.vm.apply()
    expect(logger.info).toHaveBeenCalledWith(
      'BulkDiscountModal: applying discount',
      expect.objectContaining({ productCount: 1, discountPct: 20, mode: 'permanent' }),
      'BulkDiscountModal'
    )
  })

  it('logs error and shows toast on API failure', async () => {
    const err = new Error('Server error')
    productService.bulkDiscount.mockRejectedValue(err)
    const wrapper = factory({ initialProducts: [PRODUCTS[0]] })
    wrapper.vm.discountPct = 15
    await wrapper.vm.apply()
    expect(logger.error).toHaveBeenCalledWith(
      'BulkDiscountModal: apply failed',
      err,
      expect.objectContaining({ productCount: 1, discountPct: 15, mode: 'permanent' }),
      'BulkDiscountModal'
    )
  })

  it('rejects discountPct above 90 without calling API', async () => {
    const wrapper = factory({ initialProducts: [PRODUCTS[0]] })
    wrapper.vm.discountPct = 95
    await wrapper.vm.apply()
    expect(productService.bulkDiscount).not.toHaveBeenCalled()
  })
})

describe('BulkDiscountModal — close', () => {
  it('emits update:modelValue false when close is called', async () => {
    const wrapper = factory()
    wrapper.vm.close()
    expect(wrapper.emitted('update:modelValue')[0][0]).toBe(false)
  })

  it('close button emits close', async () => {
    const wrapper = factory()
    await wrapper.find('[data-testid="close-btn"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')[0][0]).toBe(false)
  })
})

describe('BulkDiscountModal — sliderFillPct', () => {
  it('returns correct percentage for slider fill', () => {
    const wrapper = factory()
    wrapper.vm.discountPct = 45
    expect(wrapper.vm.sliderFillPct).toBe('50%')
  })

  it('returns 0% when discountPct is 0', () => {
    const wrapper = factory()
    wrapper.vm.discountPct = 0
    expect(wrapper.vm.sliderFillPct).toBe('0%')
  })
})

describe('BulkDiscountModal — timed mode', () => {
  it('timedMode defaults to false', () => {
    const wrapper = factory()
    expect(wrapper.vm.timedMode).toBe(false)
  })

  it('toggle button flips timedMode', async () => {
    const wrapper = factory()
    await wrapper.find('[data-testid="timed-toggle"]').trigger('click')
    expect(wrapper.vm.timedMode).toBe(true)
    await wrapper.find('[data-testid="timed-toggle"]').trigger('click')
    expect(wrapper.vm.timedMode).toBe(false)
  })

  it('passes startDate/endDate/title to bulkDiscount in timed mode', async () => {
    productService.bulkDiscount.mockResolvedValue({ data: { updated: 2, mode: 'timed' } })
    const wrapper = factory({ initialProducts: [PRODUCTS[0], PRODUCTS[1]] })
    wrapper.vm.timedMode      = true
    wrapper.vm.startDate      = '2026-07-01T00:00:00.000Z'
    wrapper.vm.endDate        = '2026-07-15T23:59:59.000Z'
    wrapper.vm.discountTitle  = 'فروش ویژه'
    wrapper.vm.discountPct    = 20
    await wrapper.vm.apply()
    expect(productService.bulkDiscount).toHaveBeenCalledWith(
      expect.objectContaining({
        discountPct: 20,
        startDate:   '2026-07-01T00:00:00.000Z',
        endDate:     '2026-07-15T23:59:59.000Z',
        title:       'فروش ویژه',
      }),
    )
  })

  it('does NOT pass startDate/endDate in permanent mode', async () => {
    productService.bulkDiscount.mockResolvedValue({ data: { updated: 1, mode: 'permanent' } })
    const wrapper = factory({ initialProducts: [PRODUCTS[0]] })
    wrapper.vm.timedMode   = false
    wrapper.vm.startDate   = '2026-07-01T00:00:00.000Z'
    wrapper.vm.discountPct = 10
    await wrapper.vm.apply()
    const call = productService.bulkDiscount.mock.calls[0][0]
    expect(call.startDate).toBeUndefined()
    expect(call.endDate).toBeUndefined()
  })

  it('blocks apply and shows toast when timed mode is on but dates are missing', async () => {
    const toastFn = vi.fn()
    vi.mocked(vi.importActual('@/stores/ui.store')).useUiStore = () => ({ addToast: toastFn })

    const wrapper = factory({ initialProducts: [PRODUCTS[0]] })
    wrapper.vm.timedMode  = true
    wrapper.vm.startDate  = ''
    wrapper.vm.endDate    = ''
    wrapper.vm.discountPct = 20
    await wrapper.vm.apply()
    expect(productService.bulkDiscount).not.toHaveBeenCalled()
  })

  it('emits applied with mode: timed in timed mode', async () => {
    productService.bulkDiscount.mockResolvedValue({ data: { updated: 1, mode: 'timed' } })
    const wrapper = factory({ initialProducts: [PRODUCTS[0]] })
    wrapper.vm.timedMode   = true
    wrapper.vm.startDate   = '2026-07-01T00:00:00.000Z'
    wrapper.vm.endDate     = '2026-07-15T23:59:59.000Z'
    wrapper.vm.discountPct = 25
    await wrapper.vm.apply()
    const emitted = wrapper.emitted('applied')
    expect(emitted).toBeTruthy()
    expect(emitted[0][0]).toMatchObject({ discountPct: 25, mode: 'timed' })
  })

  it('resets timed state when modal opens again', async () => {
    const wrapper = factory({ initialProducts: [PRODUCTS[0]] })
    wrapper.vm.timedMode      = true
    wrapper.vm.startDate      = '2026-07-01T00:00:00.000Z'
    wrapper.vm.discountTitle  = 'Test'
    // Simulate close then re-open
    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.vm.timedMode).toBe(false)
    expect(wrapper.vm.startDate).toBe('')
    expect(wrapper.vm.discountTitle).toBe('')
  })

  it('timedValid is true when timedMode is off regardless of dates', () => {
    const wrapper = factory()
    wrapper.vm.timedMode  = false
    wrapper.vm.startDate  = ''
    wrapper.vm.endDate    = ''
    expect(wrapper.vm.timedValid).toBe(true)
  })

  it('timedValid is false when timedMode is on and dates are empty', () => {
    const wrapper = factory()
    wrapper.vm.timedMode  = true
    wrapper.vm.startDate  = ''
    wrapper.vm.endDate    = ''
    expect(wrapper.vm.timedValid).toBe(false)
  })

  it('timedValid is true when timedMode is on and both dates are set', () => {
    const wrapper = factory()
    wrapper.vm.timedMode  = true
    wrapper.vm.startDate  = '2026-07-01T00:00:00.000Z'
    wrapper.vm.endDate    = '2026-07-15T23:59:59.000Z'
    expect(wrapper.vm.timedValid).toBe(true)
  })
})
