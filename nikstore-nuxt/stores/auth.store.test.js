import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('~/services/auth.service', () => ({
  authService: {
    sendOtp:    vi.fn(),
    verifyOtp:  vi.fn(),
    getProfile: vi.fn(),
    logout:     vi.fn(),
    refresh:    vi.fn(),
  },
}))

vi.mock('~/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

vi.mock('~/stores/cart.store', () => ({
  useCartStore: vi.fn(() => ({ fetchCart: vi.fn(), items: [] })),
}))

vi.mock('~/stores/wishlist.store', () => ({
  useWishlistStore: vi.fn(() => ({ fetchWishlist: vi.fn(), wishlistIds: new Set() })),
}))

// setTokenProvider is a side-effect called in store setup — let the real http module handle it
vi.mock('~/services/http.service', () => ({
  default: {},
  setTokenProvider: vi.fn(),
}))

import { useAuthStore } from './auth.store'
import { authService } from '~/services/auth.service'
import { logger } from '~/utils/logger'

const fakeProfile = { _id: 'u1', phone: '09121234567' }

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // ── sendOtp ─────────────────────────────────────────────────────────────────

  describe('sendOtp', () => {
    it('sets pendingPhone on success', async () => {
      authService.sendOtp.mockResolvedValue({})
      const store = useAuthStore()
      await store.sendOtp('09121234567')
      expect(store.pendingPhone).toBe('09121234567')
      expect(store.loading).toBe(false)
    })

    it('logs error and re-throws on failure', async () => {
      const err = new Error('network error')
      authService.sendOtp.mockRejectedValue(err)
      const store = useAuthStore()
      await expect(store.sendOtp('09121234567')).rejects.toThrow('network error')
      expect(logger.error).toHaveBeenCalledWith(
        'auth: sendOtp failed', err, {}, 'AuthStore',
      )
      expect(store.loading).toBe(false)
    })
  })

  // ── verifyOtp ────────────────────────────────────────────────────────────────

  describe('verifyOtp', () => {
    it('sets token and isLoggedIn on success', async () => {
      authService.verifyOtp.mockResolvedValue({
        data: { accessToken: 'at-123', isNewUser: false },
      })
      authService.getProfile.mockResolvedValue({ data: fakeProfile })

      const store = useAuthStore()
      const result = await store.verifyOtp('09121234567', '123456')

      expect(store.token).toBe('at-123')
      expect(store.isLoggedIn).toBe(true)
      expect(result.accessToken).toBe('at-123')
    })

    it('access token stays in memory — not in localStorage', async () => {
      authService.verifyOtp.mockResolvedValue({ data: { accessToken: 'at-123', isNewUser: false } })
      authService.getProfile.mockResolvedValue({ data: fakeProfile })

      const store = useAuthStore()
      await store.verifyOtp('09121234567', '123456')

      // Refresh token is an HttpOnly cookie — the JS store must never write tokens to localStorage
      expect(localStorage.getItem('access_token')).toBeNull()
      expect(localStorage.getItem('refresh_token')).toBeNull()
    })

    it('logs error and re-throws on failure', async () => {
      const err = new Error('invalid code')
      authService.verifyOtp.mockRejectedValue(err)
      const store = useAuthStore()
      await expect(store.verifyOtp('09121234567', 'wrong')).rejects.toThrow('invalid code')
      expect(logger.error).toHaveBeenCalledWith(
        'auth: verifyOtp failed', err, {}, 'AuthStore',
      )
    })
  })

  // ── logout ───────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('clears token and user from memory', async () => {
      authService.logout.mockResolvedValue({})
      const store = useAuthStore()
      store.token = 'at-old'
      store.user  = { _id: 'u1' }

      await store.logout()

      expect(store.token).toBeNull()
      expect(store.user).toBeNull()
    })

    it('does not touch localStorage (tokens were never stored there)', async () => {
      authService.logout.mockResolvedValue({})
      localStorage.setItem('access_token', 'should-stay')

      const store = useAuthStore()
      await store.logout()

      // We must not accidentally wipe unrelated localStorage keys
      expect(localStorage.getItem('access_token')).toBe('should-stay')
    })
  })

  // ── isLoggedIn ───────────────────────────────────────────────────────────────

  describe('isLoggedIn', () => {
    it('is false when no token', () => {
      const store = useAuthStore()
      expect(store.isLoggedIn).toBe(false)
    })

    it('is true when token is set', () => {
      const store = useAuthStore()
      store.token = 'some-token'
      expect(store.isLoggedIn).toBe(true)
    })
  })

  // ── initAuth ─────────────────────────────────────────────────────────────────

  describe('initAuth', () => {
    it('restores session when refresh cookie is valid', async () => {
      authService.refresh.mockResolvedValue({ data: { accessToken: 'restored-tok' } })
      authService.getProfile.mockResolvedValue({ data: fakeProfile })

      const store = useAuthStore()
      await store.initAuth()

      expect(store.token).toBe('restored-tok')
      expect(store.user).toEqual(fakeProfile)
      expect(store.isLoggedIn).toBe(true)
    })

    it('logs info on successful session restore', async () => {
      authService.refresh.mockResolvedValue({ data: { accessToken: 'tok' } })
      authService.getProfile.mockResolvedValue({ data: fakeProfile })

      const store = useAuthStore()
      await store.initAuth()

      expect(logger.info).toHaveBeenCalledWith(
        'auth: session restored from refresh token', {}, 'AuthStore',
      )
    })

    it('sets initialized=true on success', async () => {
      authService.refresh.mockResolvedValue({ data: { accessToken: 'tok' } })
      authService.getProfile.mockResolvedValue({ data: fakeProfile })

      const store = useAuthStore()
      expect(store.initialized).toBe(false)
      await store.initAuth()
      expect(store.initialized).toBe(true)
    })

    it('clears token/user and logs warn when no active session (401)', async () => {
      const err = Object.assign(new Error('Unauthorized'), { response: { status: 401 } })
      authService.refresh.mockRejectedValue(err)

      const store = useAuthStore()
      store.token = 'stale'
      await store.initAuth()

      expect(store.token).toBeNull()
      expect(store.user).toBeNull()
      expect(logger.warn).toHaveBeenCalledWith(
        'auth: initAuth failed — no active session',
        expect.objectContaining({ status: 401 }),
        'AuthStore',
      )
    })

    it('sets initialized=true even when refresh fails', async () => {
      authService.refresh.mockRejectedValue(new Error('no cookie'))

      const store = useAuthStore()
      await store.initAuth()

      expect(store.initialized).toBe(true)
    })

    it('skips refresh when already initialized', async () => {
      const store = useAuthStore()
      store.initialized = true

      await store.initAuth()

      expect(authService.refresh).not.toHaveBeenCalled()
    })

    it('is idempotent — second sequential call is a no-op', async () => {
      authService.refresh.mockResolvedValue({ data: { accessToken: 'tok' } })
      authService.getProfile.mockResolvedValue({ data: fakeProfile })

      const store = useAuthStore()
      await store.initAuth()
      await store.initAuth()

      expect(authService.refresh).toHaveBeenCalledTimes(1)
    })

    it('two concurrent calls result in only one refresh request (initializing lock)', async () => {
      authService.refresh.mockResolvedValue({ data: { accessToken: 'tok' } })
      authService.getProfile.mockResolvedValue({ data: fakeProfile })

      const store = useAuthStore()
      await Promise.all([store.initAuth(), store.initAuth()])

      expect(authService.refresh).toHaveBeenCalledTimes(1)
    })

    it('does NOT clear session on 429 rate-limit', async () => {
      const err = Object.assign(new Error('Too Many Requests'), { response: { status: 429 } })
      authService.refresh.mockRejectedValue(err)

      const store = useAuthStore()
      store.token = 'existing'
      await store.initAuth()

      // 429 should not wipe an existing token — session validity is unknown
      expect(store.token).toBe('existing')
      expect(logger.warn).toHaveBeenCalledWith(
        'auth: initAuth rate-limited — not clearing session',
        expect.objectContaining({ status: 429 }),
        'AuthStore',
      )
    })

    it('resets initializing flag after success', async () => {
      authService.refresh.mockResolvedValue({ data: { accessToken: 'tok' } })
      authService.getProfile.mockResolvedValue({ data: fakeProfile })

      const store = useAuthStore()
      await store.initAuth()

      expect(store.initializing).toBe(false)
    })

    it('resets initializing flag after failure', async () => {
      authService.refresh.mockRejectedValue(new Error('fail'))

      const store = useAuthStore()
      await store.initAuth()

      expect(store.initializing).toBe(false)
    })
  })
})
