import { defineStore } from 'pinia'
import { ref } from 'vue'
import { wishlistService } from '~/services/wishlist.service'
import { useAuthStore } from '~/stores/auth.store'
import { useUiStore } from '~/stores/ui.store'
import { logger } from '~/utils/logger'
import { withRetry } from '~/utils/retry'

export const useWishlistStore = defineStore('wishlist', () => {
  // Set of product _id strings for O(1) lookup
  const wishlistIds = ref(new Set())
  const loading     = ref(false)

  function isInWishlist(productId) {
    return wishlistIds.value.has(String(productId))
  }

  async function fetchWishlist() {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) return
    if (loading.value) return
    loading.value = true
    try {
      await withRetry(async () => {
        const { data } = await wishlistService.getAll()
        const ids = (data?.products ?? data?.items ?? []).map((p) => String(p._id ?? p))
        wishlistIds.value = new Set(ids)
      }, 3, 1500)
    } catch {
      // all retries failed — wishlist stays empty, non-critical
    } finally {
      loading.value = false
    }
  }

  async function toggle(productId) {
    const auth = useAuthStore()
    const ui   = useUiStore()

    if (!auth.isLoggedIn) {
      ui.addToast('برای استفاده از علاقه‌مندی‌ها وارد شوید', 'info')
      return false
    }

    const id    = String(productId)
    const wasIn = wishlistIds.value.has(id)

    // Optimistic update
    if (wasIn) wishlistIds.value.delete(id)
    else       wishlistIds.value.add(id)

    try {
      await wishlistService.toggle(productId)
      ui.addToast(
        wasIn ? 'از علاقه‌مندی‌ها حذف شد' : 'به علاقه‌مندی‌ها افزوده شد',
        'success'
      )
      return !wasIn
    } catch (error) {
      // Rollback on error
      if (wasIn) wishlistIds.value.add(id)
      else       wishlistIds.value.delete(id)
      logger.error('wishlist: toggle failed', error, { productId }, 'WishlistStore')
      ui.addToast('خطا در بروزرسانی علاقه‌مندی‌ها', 'error')
      return wasIn
    }
  }

  return { wishlistIds, loading, isInWishlist, fetchWishlist, toggle }
})
