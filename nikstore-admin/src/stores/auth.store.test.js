import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/services/auth.service', () => ({
  authService: {
    sendOtp:    vi.fn(),
    verifyOtp:  vi.fn(),
    adminLogin: vi.fn(),
    refresh:    vi.fn(),
    getProfile: vi.fn(),
    logout:     vi.fn(),
  },
}))

vi.mock('@/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

vi.mock('@/services/socket.service', () => ({
  socketService: { disconnect: vi.fn() },
}))

import { useAuthStore } from './auth.store'
import { authService } from '@/services/auth.service'
import { logger } from '@/utils/logger'
import { socketService } from '@/services/socket.service'

const adminProfile   = { _id: 'u1', isAdmin: true,  role: 'admin',   name: 'Admin' }
const managerProfile = { _id: 'u2', isAdmin: false, role: 'manager', name: 'Mgr'   }
const userProfile    = { _id: 'u3', isAdmin: false, role: 'user',    name: 'User'  }

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('sendOtp', () => {
    it('calls authService.sendOtp and sets pendingPhone', async () => {
      authService.sendOtp.mockResolvedValue({})
      const store = useAuthStore()
      await store.sendOtp('09123456789')
      expect(authService.sendOtp).toHaveBeenCalledWith('09123456789')
      expect(store.pendingPhone).toBe('09123456789')
      expect(store.loading).toBe(false)
    })

    it('logs error and re-throws on failure', async () => {
      const err = new Error('network error')
      authService.sendOtp.mockRejectedValue(err)
      const store = useAuthStore()
      await expect(store.sendOtp('09123456789')).rejects.toThrow('network error')
      expect(logger.error).toHaveBeenCalledWith(
        'admin-auth: sendOtp failed', err,
        expect.objectContaining({ phone: expect.stringContaining('****') }),
        'AuthStore',
      )
      expect(store.loading).toBe(false)
    })

    it('masks phone number in log', async () => {
      const err = new Error('fail')
      authService.sendOtp.mockRejectedValue(err)
      const store = useAuthStore()
      await store.sendOtp('09123456789').catch(() => {})
      const [, , meta] = logger.error.mock.calls[0]
      expect(meta.phone).toBe('0912345****')
    })
  })

  describe('verifyOtp', () => {
    it('stores accessToken in memory (not localStorage) on success', async () => {
      authService.verifyOtp.mockResolvedValue({
        data: { accessToken: 'tok123', isNewUser: false },
      })
      authService.getProfile.mockResolvedValue({ data: adminProfile })

      const store = useAuthStore()
      await store.verifyOtp('09123456789', '1234')

      expect(store.token).toBe('tok123')
      // Refresh token is HttpOnly cookie — no localStorage entry
      expect(localStorage.getItem('admin_refresh_token')).toBeNull()
      expect(store.user).toEqual(adminProfile)
      expect(store.isAdmin).toBe(true)
      expect(store.isLoggedIn).toBe(true)
    })

    it('accepts manager role', async () => {
      authService.verifyOtp.mockResolvedValue({
        data: { accessToken: 'mgr-tok' },
      })
      authService.getProfile.mockResolvedValue({ data: managerProfile })

      const store = useAuthStore()
      await store.verifyOtp('09123456789', '1234')

      expect(store.isManager).toBe(true)
      expect(store.isLoggedIn).toBe(true)
    })

    it('throws isAdminError when profile has no admin access', async () => {
      authService.verifyOtp.mockResolvedValue({
        data: { accessToken: 'tok' },
      })
      authService.getProfile.mockResolvedValue({ data: userProfile })

      const store = useAuthStore()
      const err = await store.verifyOtp('09123456789', '1234').catch(e => e)
      expect(err.isAdminError).toBe(true)
    })

    it('logs error and re-throws on API failure', async () => {
      const err = new Error('401')
      authService.verifyOtp.mockRejectedValue(err)
      const store = useAuthStore()
      await expect(store.verifyOtp('09123456789', '1234')).rejects.toThrow('401')
      expect(logger.error).toHaveBeenCalledWith(
        'admin-auth: verifyOtp failed', err, {}, 'AuthStore',
      )
    })
  })

  describe('initAuth', () => {
    it('restores session via cookie (no localStorage needed)', async () => {
      authService.refresh.mockResolvedValue({ data: { accessToken: 'restored' } })
      authService.getProfile.mockResolvedValue({ data: adminProfile })

      const store = useAuthStore()
      await store.initAuth()

      expect(authService.refresh).toHaveBeenCalled()
      expect(store.token).toBe('restored')
      expect(store.user).toEqual(adminProfile)
    })

    it('sets initialized to true on success', async () => {
      authService.refresh.mockResolvedValue({ data: { accessToken: 'tok' } })
      authService.getProfile.mockResolvedValue({ data: adminProfile })

      const store = useAuthStore()
      expect(store.initialized).toBe(false)
      await store.initAuth()
      expect(store.initialized).toBe(true)
    })

    it('logs info when session is restored', async () => {
      authService.refresh.mockResolvedValue({ data: { accessToken: 'tok' } })
      authService.getProfile.mockResolvedValue({ data: adminProfile })

      const store = useAuthStore()
      await store.initAuth()

      expect(logger.info).toHaveBeenCalledWith(
        'admin-auth: session restored from refresh token', {}, 'AuthStore',
      )
    })

    it('logs out when refresh fails', async () => {
      authService.refresh.mockRejectedValue(new Error('expired'))

      const store = useAuthStore()
      store.token = 'old'
      await store.initAuth()

      expect(store.token).toBeNull()
      expect(logger.warn).toHaveBeenCalledWith(
        'admin-auth: initAuth failed, clearing session',
        expect.any(Object),
        'AuthStore',
      )
    })

    it('sets initialized to true even when refresh fails', async () => {
      authService.refresh.mockRejectedValue(new Error('no cookie'))

      const store = useAuthStore()
      await store.initAuth()
      expect(store.initialized).toBe(true)
    })

    it('sets initialized to true when profile has no admin access', async () => {
      authService.refresh.mockResolvedValue({ data: { accessToken: 'tok' } })
      authService.getProfile.mockResolvedValue({ data: userProfile })

      const store = useAuthStore()
      await store.initAuth()
      expect(store.initialized).toBe(true)
      expect(store.token).toBeNull()
    })

    it('skips API calls when already initialized', async () => {
      const store = useAuthStore()
      store.initialized = true

      await store.initAuth()

      expect(authService.refresh).not.toHaveBeenCalled()
      expect(authService.getProfile).not.toHaveBeenCalled()
    })

    it('is idempotent — second call is a no-op', async () => {
      authService.refresh.mockResolvedValue({ data: { accessToken: 'tok' } })
      authService.getProfile.mockResolvedValue({ data: adminProfile })

      const store = useAuthStore()
      await store.initAuth()
      await store.initAuth()

      expect(authService.refresh).toHaveBeenCalledTimes(1)
    })

    it('two concurrent calls result in only one refresh request (initializing lock)', async () => {
      authService.refresh.mockResolvedValue({ data: { accessToken: 'tok' } })
      authService.getProfile.mockResolvedValue({ data: adminProfile })

      const store = useAuthStore()
      // Fire both without awaiting — second sees initializing=true and returns early
      await Promise.all([store.initAuth(), store.initAuth()])

      expect(authService.refresh).toHaveBeenCalledTimes(1)
    })

    it('does NOT call logout on 429 rate-limit error', async () => {
      const err = Object.assign(new Error('Too Many Requests'), { response: { status: 429 } })
      authService.refresh.mockRejectedValue(err)

      const store = useAuthStore()
      await store.initAuth()

      expect(socketService.disconnect).not.toHaveBeenCalled()
      expect(store.initialized).toBe(true)
    })

    it('logs warn with status 429 when rate-limited', async () => {
      const err = Object.assign(new Error('Too Many Requests'), { response: { status: 429 } })
      authService.refresh.mockRejectedValue(err)

      const store = useAuthStore()
      await store.initAuth()

      expect(logger.warn).toHaveBeenCalledWith(
        'admin-auth: initAuth rate-limited — not clearing session',
        expect.objectContaining({ status: 429 }),
        'AuthStore',
      )
    })

    it('includes HTTP status code in warn log for non-429 failures', async () => {
      const err = Object.assign(new Error('no refresh token'), { response: { status: 401 } })
      authService.refresh.mockRejectedValue(err)

      const store = useAuthStore()
      await store.initAuth()

      expect(logger.warn).toHaveBeenCalledWith(
        'admin-auth: initAuth failed, clearing session',
        expect.objectContaining({ status: 401 }),
        'AuthStore',
      )
    })

    it('resets initializing flag after success', async () => {
      authService.refresh.mockResolvedValue({ data: { accessToken: 'tok' } })
      authService.getProfile.mockResolvedValue({ data: adminProfile })

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

  describe('fetchProfile', () => {
    it('skips when no token', async () => {
      const store = useAuthStore()
      store.token = null
      await store.fetchProfile()
      expect(authService.getProfile).not.toHaveBeenCalled()
    })

    it('sets user on success', async () => {
      authService.getProfile.mockResolvedValue({ data: adminProfile })
      const store = useAuthStore()
      store.token = 'existing-token'
      await store.fetchProfile()
      expect(store.user).toEqual(adminProfile)
    })

    it('logs warn and logs out when profile fetch fails', async () => {
      authService.getProfile.mockRejectedValue(new Error('expired'))
      const store = useAuthStore()
      store.token = 'bad-token'
      await store.fetchProfile()
      expect(logger.warn).toHaveBeenCalledWith(
        'admin-auth: fetchProfile failed, logging out',
        expect.any(Object),
        'AuthStore',
      )
      expect(store.token).toBeNull()
    })
  })

  describe('hasPermission', () => {

    // ── Admin bypass ──────────────────────────────────────────────────────────

    it('admin always returns true regardless of permissions', () => {
      const store = useAuthStore()
      store.user = { ...adminProfile, permissions: [] }
      expect(store.hasPermission('products:delete')).toBe(true)
      expect(store.hasPermission('products')).toBe(true)
      expect(store.hasPermission('nonexistent')).toBe(true)
    })

    // ── Action-level checks (section:action format) ───────────────────────────

    it('exact sub-permission grants access', () => {
      const store = useAuthStore()
      store.user = { ...managerProfile, permissions: ['products:view'] }
      expect(store.hasPermission('products:view')).toBe(true)
    })

    it('ungranted sub-permission is denied', () => {
      const store = useAuthStore()
      store.user = { ...managerProfile, permissions: ['products:view'] }
      expect(store.hasPermission('products:delete')).toBe(false)
    })

    it('legacy flat section key grants access to any sub-permission (backward compat)', () => {
      const store = useAuthStore()
      store.user = { ...managerProfile, permissions: ['products'] }
      expect(store.hasPermission('products:view')).toBe(true)
      expect(store.hasPermission('products:delete')).toBe(true)
      expect(store.hasPermission('products:view_buy_price')).toBe(true)
    })

    it('other section key does NOT grant access', () => {
      const store = useAuthStore()
      store.user = { ...managerProfile, permissions: ['orders'] }
      expect(store.hasPermission('products:view')).toBe(false)
    })

    it('partial prefix match does not grant access', () => {
      const store = useAuthStore()
      // 'products:view' should not grant 'products:view_buy_price'
      store.user = { ...managerProfile, permissions: ['products:view'] }
      expect(store.hasPermission('products:view_buy_price')).toBe(false)
    })

    it('multiple actions granted independently', () => {
      const store = useAuthStore()
      store.user = { ...managerProfile, permissions: ['products:view', 'products:edit'] }
      expect(store.hasPermission('products:view')).toBe(true)
      expect(store.hasPermission('products:edit')).toBe(true)
      expect(store.hasPermission('products:delete')).toBe(false)
    })

    // ── Section-level checks (no colon) ──────────────────────────────────────

    it('section-level check returns true when any sub-permission exists', () => {
      const store = useAuthStore()
      store.user = { ...managerProfile, permissions: ['products:view', 'products:edit'] }
      expect(store.hasPermission('products')).toBe(true)
    })

    it('section-level check with legacy flat key returns true', () => {
      const store = useAuthStore()
      store.user = { ...managerProfile, permissions: ['products'] }
      expect(store.hasPermission('products')).toBe(true)
    })

    it('section-level check returns false when no matching permission', () => {
      const store = useAuthStore()
      store.user = { ...managerProfile, permissions: ['orders'] }
      expect(store.hasPermission('products')).toBe(false)
    })

    it('section-level check does not bleed between sections', () => {
      const store = useAuthStore()
      store.user = { ...managerProfile, permissions: ['products:view'] }
      expect(store.hasPermission('orders')).toBe(false)
    })

    // ── Edge cases ────────────────────────────────────────────────────────────

    it('returns false when permissions array is empty', () => {
      const store = useAuthStore()
      store.user = { ...managerProfile, permissions: [] }
      expect(store.hasPermission('products')).toBe(false)
      expect(store.hasPermission('products:view')).toBe(false)
    })

    it('returns false when user has no permissions field', () => {
      const store = useAuthStore()
      store.user = { ...managerProfile }
      expect(store.hasPermission('products:view')).toBe(false)
    })

    it('returns false when user is null', () => {
      const store = useAuthStore()
      store.user = null
      expect(store.hasPermission('products:view')).toBe(false)
    })

    // ── Price visibility sub-permissions ─────────────────────────────────────

    it('view_buy_price and view_sell_price are independently gated', () => {
      const store = useAuthStore()
      store.user = { ...managerProfile, permissions: ['products:view_buy_price'] }
      expect(store.hasPermission('products:view_buy_price')).toBe(true)
      expect(store.hasPermission('products:view_sell_price')).toBe(false)
    })

    it('flat products key grants both price sub-permissions', () => {
      const store = useAuthStore()
      store.user = { ...managerProfile, permissions: ['products'] }
      expect(store.hasPermission('products:view_buy_price')).toBe(true)
      expect(store.hasPermission('products:view_sell_price')).toBe(true)
    })
  })

  describe('logout', () => {
    async function loggedInStore() {
      const store = useAuthStore()
      store.user        = adminProfile
      store.token       = 'tok'
      store.initialized = true
      return store
    }

    it('clears user and token from memory — no localStorage involved', async () => {
      authService.logout.mockResolvedValue({})
      const store = await loggedInStore()
      await store.logout()
      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
      expect(localStorage.getItem('admin_refresh_token')).toBeNull()
    })

    it('calls POST /auth/logout to invalidate the refresh token cookie on the server', async () => {
      authService.logout.mockResolvedValue({})
      const store = await loggedInStore()
      await store.logout()
      expect(authService.logout).toHaveBeenCalledTimes(1)
    })

    it('resets initialized to false so the guard re-runs initAuth on next navigation', async () => {
      // ROOT CAUSE FIX: without this, router.push fires before state is cleared
      // and the guard sees isLoggedIn=true, blocking navigation to /login
      authService.logout.mockResolvedValue({})
      const store = await loggedInStore()
      expect(store.initialized).toBe(true)
      await store.logout()
      expect(store.initialized).toBe(false)
    })

    it('isLoggedIn is false immediately after logout resolves', async () => {
      authService.logout.mockResolvedValue({})
      const store = await loggedInStore()
      await store.logout()
      expect(store.isLoggedIn).toBe(false)
    })

    it('still clears all state even when the server call fails', async () => {
      authService.logout.mockRejectedValue(new Error('network'))
      const store = await loggedInStore()
      await store.logout()
      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
      expect(store.initialized).toBe(false)
      expect(store.isLoggedIn).toBe(false)
    })

    it('logs info at start and completion', async () => {
      authService.logout.mockResolvedValue({})
      const store = await loggedInStore()
      await store.logout()
      expect(logger.info).toHaveBeenCalledWith('admin-auth: logging out',  {}, 'AuthStore')
      expect(logger.info).toHaveBeenCalledWith('admin-auth: logout complete', {}, 'AuthStore')
    })

    it('allows initAuth to run again after logout (initialized was reset)', async () => {
      authService.logout.mockResolvedValue({})
      authService.refresh.mockResolvedValue({ data: { accessToken: 'new-tok' } })
      authService.getProfile.mockResolvedValue({ data: adminProfile })

      const store = await loggedInStore()
      await store.logout()
      expect(store.initialized).toBe(false)

      await store.initAuth()
      expect(authService.refresh).toHaveBeenCalledTimes(1)
      expect(store.initialized).toBe(true)
    })
  })

  describe('adminLogin', () => {
    it('stores token in memory and sets user on success', async () => {
      authService.adminLogin.mockResolvedValue({ data: { accessToken: 'pw-tok' } })
      authService.getProfile.mockResolvedValue({ data: adminProfile })

      const store = useAuthStore()
      await store.adminLogin('09123456789', 'secret123')

      expect(authService.adminLogin).toHaveBeenCalledWith('09123456789', 'secret123')
      expect(store.token).toBe('pw-tok')
      expect(store.user).toEqual(adminProfile)
      expect(store.isLoggedIn).toBe(true)
      expect(store.loading).toBe(false)
    })

    it('accepts manager role', async () => {
      authService.adminLogin.mockResolvedValue({ data: { accessToken: 'mgr-tok' } })
      authService.getProfile.mockResolvedValue({ data: managerProfile })

      const store = useAuthStore()
      await store.adminLogin('09123456789', 'secret123')

      expect(store.isManager).toBe(true)
      expect(store.isLoggedIn).toBe(true)
    })

    it('throws isAdminError when profile has no admin access', async () => {
      authService.adminLogin.mockResolvedValue({ data: { accessToken: 'tok' } })
      authService.getProfile.mockResolvedValue({ data: userProfile })

      const store = useAuthStore()
      const err = await store.adminLogin('09123456789', 'secret123').catch(e => e)

      expect(err.isAdminError).toBe(true)
      expect(store.token).toBeNull()
    })

    it('logs info with masked phone on success', async () => {
      authService.adminLogin.mockResolvedValue({ data: { accessToken: 'tok' } })
      authService.getProfile.mockResolvedValue({ data: adminProfile })

      const store = useAuthStore()
      await store.adminLogin('09123456789', 'secret123')

      expect(logger.info).toHaveBeenCalledWith(
        'admin-auth: password login success',
        expect.objectContaining({ phone: '0912345****' }),
        'AuthStore',
      )
    })

    it('logs error with masked phone and re-throws on API failure', async () => {
      const err = new Error('401 Unauthorized')
      authService.adminLogin.mockRejectedValue(err)

      const store = useAuthStore()
      await expect(store.adminLogin('09123456789', 'wrongpass')).rejects.toThrow('401')

      expect(logger.error).toHaveBeenCalledWith(
        'admin-auth: adminLogin failed',
        err,
        expect.objectContaining({ phone: '0912345****' }),
        'AuthStore',
      )
      expect(store.loading).toBe(false)
    })

    it('resets loading to false even when error thrown', async () => {
      authService.adminLogin.mockRejectedValue(new Error('network'))
      const store = useAuthStore()
      await store.adminLogin('09123456789', 'pass').catch(() => {})
      expect(store.loading).toBe(false)
    })
  })
})
