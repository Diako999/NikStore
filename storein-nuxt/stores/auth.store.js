import { defineStore }    from 'pinia'
import { ref, computed }  from 'vue'
import { authService }    from '~/services/auth.service'
import { setTokenProvider } from '~/services/http.service'
import { logger }         from '~/utils/logger'

export const useAuthStore = defineStore('auth', () => {
  // ── State ─────────────────────────────────────────────────────
  const user         = ref(null)
  const token        = ref(null)   // access token lives in memory ONLY — never localStorage
  const loading      = ref(false)
  const pendingPhone = ref('')
  const initialized  = ref(false)
  const initializing = ref(false)

  // Register token provider so http.service can read it without circular import
  setTokenProvider(() => token.value)

  // ── Computed ──────────────────────────────────────────────────
  const isLoggedIn = computed(() => !!token.value)

  // ── Send OTP ──────────────────────────────────────────────────
  async function sendOtp(phone) {
    loading.value = true
    try {
      await authService.sendOtp(phone)
      pendingPhone.value = phone
    } catch (error) {
      logger.error('auth: sendOtp failed', error, {}, 'AuthStore')
      throw error
    } finally {
      loading.value = false
    }
  }

  // ── Verify OTP ────────────────────────────────────────────────
  async function verifyOtp(phone, code) {
    loading.value = true
    try {
      const { data } = await authService.verifyOtp(phone, code)

      token.value = data.accessToken
      // refresh_token is an HttpOnly cookie set by the server — never touch it here

      await fetchProfile()
      pendingPhone.value = ''
      await _postLoginSync()
      return data
    } catch (error) {
      logger.error('auth: verifyOtp failed', error, {}, 'AuthStore')
      throw error
    } finally {
      loading.value = false
    }
  }

  // ── Post-login background sync ────────────────────────────────
  async function _postLoginSync() {
    // Small delay so AppHeader.onMounted fires first; the loading guard in each
    // store then prevents a duplicate in-flight request.
    await new Promise(r => setTimeout(r, 100))
    const { useCartStore }     = await import('~/stores/cart.store')
    const { useWishlistStore } = await import('~/stores/wishlist.store')
    Promise.allSettled([
      useCartStore().fetchCart(),
      useWishlistStore().fetchWishlist(),
    ])
  }

  // ── Fetch profile ─────────────────────────────────────────────
  async function fetchProfile() {
    if (!token.value) return
    try {
      const { data } = await authService.getProfile()
      user.value = data
    } catch {
      // Token expired — 401 interceptor in http.service handles refresh
    }
  }

  // ── Logout ────────────────────────────────────────────────────
  async function logout() {
    try {
      // Server clears the HttpOnly cookie via Set-Cookie: refresh_token=; Max-Age=0
      await authService.logout()
    } catch { /* silent */ }

    user.value         = null
    token.value        = null
    pendingPhone.value = ''
    // No localStorage to clean — tokens were never stored there

    const { useCartStore }     = await import('~/stores/cart.store')
    const { useWishlistStore } = await import('~/stores/wishlist.store')
    useCartStore().items           = []
    useWishlistStore().wishlistIds = new Set()
  }

  // ── Init (called once on app startup) ─────────────────────────
  async function initAuth() {
    // Guard against: already done and in-flight concurrent calls
    if (initialized.value || initializing.value) return
    initializing.value = true
    try {
      const { data } = await authService.refresh()
      token.value = data.accessToken
      await fetchProfile()
      logger.info('auth: session restored from refresh token', {}, 'AuthStore')
      if (user.value) _postLoginSync()
    } catch (error) {
      const status = error?.response?.status
      if (status === 401) {
        logger.info('auth: initAuth — no active session', { status }, 'AuthStore')
        token.value = null
        user.value  = null
      } else if (status === 429) {
        logger.warn('auth: initAuth rate-limited — not clearing session', { status }, 'AuthStore')
      } else {
        // 5xx, network error, or timeout — transient failure, do not clear session
        logger.warn('auth: initAuth server error — not clearing session', { status }, 'AuthStore')
      }
    } finally {
      initialized.value  = true
      initializing.value = false
    }
  }

  return {
    user, token, loading, pendingPhone, initialized, initializing,
    isLoggedIn,
    sendOtp, verifyOtp, fetchProfile, logout, initAuth,
  }
})
