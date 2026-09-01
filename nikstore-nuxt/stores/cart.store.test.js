import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('~/services/cart.service', () => ({
  cartService: {
    get:        vi.fn(),
    addItem:    vi.fn(),
    updateItem: vi.fn(),
    removeItem: vi.fn(),
    clear:      vi.fn(),
  },
}))

vi.mock('~/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import { useCartStore } from './cart.store'
import { cartService } from '~/services/cart.service'
import { logger } from '~/utils/logger'

const mockItems = [
  { productId: 'p1', variantId: 'v1', name: 'عینک', price: 500_000, quantity: 2 },
  { productId: 'p2', variantId: 'v2', name: 'فریم', price: 300_000, quantity: 1 },
]

describe('useCartStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fetchCart', () => {
    it('sets items on success', async () => {
      cartService.get.mockResolvedValue({ data: { items: mockItems } })
      const store = useCartStore()
      await store.fetchCart()
      expect(store.items).toEqual(mockItems)
      expect(store.loading).toBe(false)
    })

    it('logs error and keeps items empty on failure', async () => {
      cartService.get.mockRejectedValue(new Error('network'))
      const store = useCartStore()
      await store.fetchCart()
      expect(store.items).toEqual([])
      expect(logger.error).toHaveBeenCalledWith(
        'cart: fetchCart failed', expect.any(Error), {}, 'CartStore',
      )
    })
  })

  describe('addItem', () => {
    it('updates items on success', async () => {
      cartService.addItem.mockResolvedValue({ data: { items: mockItems } })
      const store = useCartStore()
      await store.addItem('p1', 'v1', 1)
      expect(store.items).toEqual(mockItems)
    })

    it('logs error and re-throws on failure', async () => {
      const err = new Error('out of stock')
      cartService.addItem.mockRejectedValue(err)
      const store = useCartStore()
      await expect(store.addItem('p1', 'v1', 1)).rejects.toThrow('out of stock')
      expect(logger.error).toHaveBeenCalledWith(
        'cart: addItem failed', err, { productId: 'p1', variantId: 'v1' }, 'CartStore',
      )
    })
  })

  describe('removeItem', () => {
    it('updates items after removal', async () => {
      cartService.removeItem.mockResolvedValue({ data: { items: [mockItems[1]] } })
      const store = useCartStore()
      store.items = [...mockItems]
      await store.removeItem('p1', 'v1')
      expect(store.items).toHaveLength(1)
    })

    it('logs error and re-throws on failure', async () => {
      cartService.removeItem.mockRejectedValue(new Error('fail'))
      const store = useCartStore()
      await expect(store.removeItem('p1', 'v1')).rejects.toThrow('fail')
      expect(logger.error).toHaveBeenCalled()
    })
  })

  describe('clearCart', () => {
    it('empties items', async () => {
      cartService.clear.mockResolvedValue({})
      const store = useCartStore()
      store.items = [...mockItems]
      await store.clearCart()
      expect(store.items).toEqual([])
    })
  })

  describe('computed values', () => {
    it('totalItems sums quantities', () => {
      const store = useCartStore()
      store.items = mockItems
      expect(store.totalItems).toBe(3) // 2 + 1
    })

    it('totalPrice sums price × quantity', () => {
      const store = useCartStore()
      store.items = mockItems
      expect(store.totalPrice).toBe(1_300_000) // 500_000*2 + 300_000*1
    })

    it('returns 0 when cart is empty', () => {
      const store = useCartStore()
      expect(store.totalItems).toBe(0)
      expect(store.totalPrice).toBe(0)
    })
  })
})
