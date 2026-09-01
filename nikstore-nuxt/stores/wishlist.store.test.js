import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('~/services/wishlist.service', () => ({
  wishlistService: {
    getAll:  vi.fn(),
    toggle:  vi.fn(),
  },
}))

vi.mock('~/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

vi.mock('~/stores/auth.store', () => ({
  useAuthStore: vi.fn(() => ({ isLoggedIn: true })),
}))

vi.mock('~/stores/ui.store', () => ({
  useUiStore: vi.fn(() => ({ addToast: vi.fn() })),
}))

import { useWishlistStore } from './wishlist.store'
import { wishlistService } from '~/services/wishlist.service'
import { useAuthStore } from '~/stores/auth.store'
import { useUiStore } from '~/stores/ui.store'
import { logger } from '~/utils/logger'

describe('useWishlistStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    useAuthStore.mockReturnValue({ isLoggedIn: true })
    useUiStore.mockReturnValue({ addToast: vi.fn() })
  })

  describe('isInWishlist', () => {
    it('returns true when product is in wishlist', () => {
      const store = useWishlistStore()
      store.wishlistIds = new Set(['prod-1', 'prod-2'])
      expect(store.isInWishlist('prod-1')).toBe(true)
      expect(store.isInWishlist('prod-3')).toBe(false)
    })
  })

  describe('toggle — not logged in', () => {
    it('shows toast and returns false without calling API', async () => {
      useAuthStore.mockReturnValue({ isLoggedIn: false })
      const mockAddToast = vi.fn()
      useUiStore.mockReturnValue({ addToast: mockAddToast })

      const store = useWishlistStore()
      const result = await store.toggle('prod-1')

      expect(result).toBe(false)
      expect(wishlistService.toggle).not.toHaveBeenCalled()
      expect(mockAddToast).toHaveBeenCalledWith(expect.any(String), 'info')
    })
  })

  describe('toggle — add to wishlist', () => {
    it('optimistically adds and returns true on success', async () => {
      wishlistService.toggle.mockResolvedValue({})
      const store = useWishlistStore()
      store.wishlistIds = new Set()

      const result = await store.toggle('prod-1')

      expect(result).toBe(true)
      expect(store.wishlistIds.has('prod-1')).toBe(true)
    })
  })

  describe('toggle — remove from wishlist', () => {
    it('optimistically removes and returns false on success', async () => {
      wishlistService.toggle.mockResolvedValue({})
      const store = useWishlistStore()
      store.wishlistIds = new Set(['prod-1'])

      const result = await store.toggle('prod-1')

      expect(result).toBe(false)
      expect(store.wishlistIds.has('prod-1')).toBe(false)
    })
  })

  describe('toggle — rollback on failure', () => {
    it('restores previous state and logs error', async () => {
      const err = new Error('server error')
      wishlistService.toggle.mockRejectedValue(err)
      const store = useWishlistStore()
      store.wishlistIds = new Set()

      await store.toggle('prod-1')

      expect(store.wishlistIds.has('prod-1')).toBe(false) // rolled back
      expect(logger.error).toHaveBeenCalledWith(
        'wishlist: toggle failed', err, { productId: 'prod-1' }, 'WishlistStore',
      )
    })
  })

  describe('fetchWishlist', () => {
    it('populates wishlistIds from API', async () => {
      wishlistService.getAll.mockResolvedValue({
        data: { products: [{ _id: 'p1' }, { _id: 'p2' }] },
      })
      const store = useWishlistStore()
      await store.fetchWishlist()
      expect(store.wishlistIds.has('p1')).toBe(true)
      expect(store.wishlistIds.has('p2')).toBe(true)
    })

    it('skips fetch when not logged in', async () => {
      useAuthStore.mockReturnValue({ isLoggedIn: false })
      const store = useWishlistStore()
      await store.fetchWishlist()
      expect(wishlistService.getAll).not.toHaveBeenCalled()
    })
  })
})
