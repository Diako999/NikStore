import { useAuthStore } from '~/stores/auth.store'
import { authService } from '~/services/auth.service'
import { useWishlistStore } from '~/stores/wishlist.store'

// Silently re-hydrates the session from the httpOnly refresh cookie on
// app start, so isLoggedIn is accurate before route middleware runs
// instead of only becoming true after the first 401-triggered refresh.
export default defineNuxtPlugin(async () => {
  const auth = useAuthStore()

  try {
    const { data } = await authService.refresh()
    auth.token = data.accessToken
    await auth.fetchMe()
    // Load the account's favorites (and push any stray guest ones) without blocking startup.
    useWishlistStore().mergeIntoAccount().catch(() => {})
  } catch {
    // No valid session — stay logged out, nothing to do.
  }
})
