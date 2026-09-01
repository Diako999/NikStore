import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('~/services/product.service', () => ({
  productService: {
    getAll:     vi.fn(),
    getBySlug:  vi.fn(),
  },
}))

vi.mock('~/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import { useProductStore } from './product.store'
import { productService } from '~/services/product.service'
import { logger } from '~/utils/logger'

const mockProducts = [
  { _id: 'p1', name: 'عینک آفتابی', slug: 'sunglasses', minPrice: 500_000 },
  { _id: 'p2', name: 'عینک طبی',   slug: 'glasses',    minPrice: 800_000 },
]

describe('useProductStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fetchProducts', () => {
    it('sets products and total on success', async () => {
      productService.getAll.mockResolvedValue({
        data: { products: mockProducts, total: 2 },
      })
      const store = useProductStore()
      await store.fetchProducts()
      expect(store.products).toEqual(mockProducts)
      expect(store.total).toBe(2)
      expect(store.loading).toBe(false)
    })

    it('resets state and logs error on failure', async () => {
      const err = new Error('API down')
      productService.getAll.mockRejectedValue(err)
      const store = useProductStore()
      store.products = [...mockProducts]
      store.total    = 2
      await store.fetchProducts()
      expect(store.products).toEqual([])
      expect(store.total).toBe(0)
      expect(logger.error).toHaveBeenCalledWith(
        'product: fetchProducts failed', err, {}, 'ProductStore',
      )
    })

    it('passes active filters as query params', async () => {
      productService.getAll.mockResolvedValue({ data: { products: [], total: 0 } })
      const store = useProductStore()
      store.filters.category = 'sunglasses'
      store.filters.inStock  = true
      store.filters.genders  = ['male', 'female']
      await store.fetchProducts()
      const [params] = productService.getAll.mock.calls[0]
      expect(params.category).toBe('sunglasses')
      expect(params.inStock).toBe(true)
      expect(params.gender).toBe('male,female')
    })
  })

  describe('fetchProductBySlug', () => {
    it('sets currentProduct on success', async () => {
      productService.getBySlug.mockResolvedValue({ data: mockProducts[0] })
      const store = useProductStore()
      await store.fetchProductBySlug('sunglasses')
      expect(store.currentProduct).toEqual(mockProducts[0])
    })

    it('logs error and re-throws on failure', async () => {
      const err = new Error('not found')
      productService.getBySlug.mockRejectedValue(err)
      const store = useProductStore()
      await expect(store.fetchProductBySlug('unknown')).rejects.toThrow('not found')
      expect(logger.error).toHaveBeenCalledWith(
        'product: fetchProductBySlug failed', err, { slug: 'unknown' }, 'ProductStore',
      )
    })
  })

  describe('setFilter', () => {
    it('updates filter and resets page to 1', () => {
      const store = useProductStore()
      store.setPage(3)
      store.setFilter('category', 'frames')
      expect(store.filters.category).toBe('frames')
      expect(store.page).toBe(1)
    })
  })

  describe('resetFilters', () => {
    it('resets all filters to defaults', () => {
      const store = useProductStore()
      store.filters.category = 'sunglasses'
      store.filters.inStock  = true
      store.filters.genders  = ['male']
      store.resetFilters()
      expect(store.filters.category).toBeNull()
      expect(store.filters.inStock).toBe(false)
      expect(store.filters.genders).toEqual([])
      expect(store.filters.sortBy).toBe('newest')
      expect(store.page).toBe(1)
    })
  })

  describe('fromQueryParams / toQueryParams', () => {
    it('round-trips filters through URL params', () => {
      const store = useProductStore()
      store.fromQueryParams({
        sort: 'price_asc',
        category: 'glasses',
        gender: 'male,female',
        inStock: '1',
        page: '2',
      })
      expect(store.filters.sortBy).toBe('price_asc')
      expect(store.filters.category).toBe('glasses')
      expect(store.filters.genders).toEqual(['male', 'female'])
      expect(store.filters.inStock).toBe(true)
      expect(store.page).toBe(2)

      const params = store.toQueryParams()
      expect(params.sort).toBe('price_asc')
      expect(params.category).toBe('glasses')
      expect(params.gender).toBe('male,female')
      expect(params.inStock).toBe('1')
      expect(params.page).toBe(2)
    })
  })

  describe('totalPages', () => {
    it('calculates totalPages from total and limit', async () => {
      productService.getAll.mockResolvedValue({ data: { products: [], total: 50 } })
      const store = useProductStore()
      await store.fetchProducts()
      expect(store.totalPages).toBe(Math.ceil(50 / 24))
    })
  })
})
