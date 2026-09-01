import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { authGuard } from './guard'

// ── Auth store mock ────────────────────────────────────────────────────────

let auth

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => auth,
}))

// ── Helpers ────────────────────────────────────────────────────────────────

/** Fake Vue Router route object — only the fields the guard uses */
const makeRoute = (meta = {}, fullPath = '/test') => ({ meta, fullPath, query: {} })

/** next() spy that records what it was called with */
function makeNext() {
  const next = vi.fn()
  next.allowedNav  = () => next.mock.calls.some(([arg]) => arg === undefined)
  next.redirectTo  = () => next.mock.calls.find(([arg]) => arg !== undefined)?.[0]
  return next
}

function makeAuth(overrides = {}) {
  return {
    initialized:   false,
    isLoggedIn:    false,
    isAdmin:       false,
    isManager:     false,
    initAuth:      vi.fn(async () => { auth.initialized = true }),
    hasPermission: vi.fn(() => false),
    ...overrides,
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('authGuard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    auth = makeAuth()
  })

  // ── Session initialisation ───────────────────────────────────────────────

  describe('session initialisation', () => {
    it('calls initAuth on the first navigation (not yet initialized)', async () => {
      const next = makeNext()
      await authGuard(makeRoute(), {}, next)
      expect(auth.initAuth).toHaveBeenCalledTimes(1)
    })

    it('skips initAuth when already initialized', async () => {
      auth.initialized = true
      const next = makeNext()
      await authGuard(makeRoute(), {}, next)
      expect(auth.initAuth).not.toHaveBeenCalled()
    })

    it('makes the auth decision AFTER initAuth resolves', async () => {
      auth.initAuth = vi.fn(async () => {
        auth.initialized = true
        auth.isLoggedIn  = true
        auth.isAdmin     = true
      })
      const next = makeNext()
      await authGuard(makeRoute({ layout: 'admin' }, '/dashboard'), {}, next)
      // initAuth restored session — navigation should be allowed
      expect(next).toHaveBeenCalledWith()
    })

    it('redirects to login if initAuth fails to restore session', async () => {
      auth.initAuth = vi.fn(async () => {
        auth.initialized = true
        // isLoggedIn stays false — refresh cookie expired
      })
      const next = makeNext()
      await authGuard(makeRoute({ layout: 'admin' }, '/dashboard'), {}, next)
      expect(next).toHaveBeenCalledWith({ name: 'login', query: { redirect: '/dashboard' } })
    })
  })

  // ── guestOnly routes ─────────────────────────────────────────────────────

  describe('guestOnly routes', () => {
    it('allows unauthenticated user to access guestOnly route', async () => {
      auth.initialized = true
      auth.isLoggedIn  = false
      const next = makeNext()
      await authGuard(makeRoute({ guestOnly: true }, '/login'), {}, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('redirects logged-in user away from guestOnly route to dashboard', async () => {
      auth.initialized = true
      auth.isLoggedIn  = true
      const next = makeNext()
      await authGuard(makeRoute({ guestOnly: true }, '/login'), {}, next)
      expect(next).toHaveBeenCalledWith({ name: 'dashboard' })
    })
  })

  // ── admin layout routes ──────────────────────────────────────────────────

  describe('admin layout routes', () => {
    it('redirects unauthenticated user to login with redirect param', async () => {
      auth.initialized = true
      auth.isLoggedIn  = false
      const next = makeNext()
      await authGuard(makeRoute({ layout: 'admin' }, '/dashboard'), {}, next)
      expect(next).toHaveBeenCalledWith({ name: 'login', query: { redirect: '/dashboard' } })
    })

    it('allows authenticated user to access admin route', async () => {
      auth.initialized = true
      auth.isLoggedIn  = true
      auth.isAdmin     = true
      const next = makeNext()
      await authGuard(makeRoute({ layout: 'admin' }, '/dashboard'), {}, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('redirects non-admin from adminOnly route to dashboard', async () => {
      auth.initialized = true
      auth.isLoggedIn  = true
      auth.isAdmin     = false
      const next = makeNext()
      await authGuard(makeRoute({ layout: 'admin', adminOnly: true }, '/settings'), {}, next)
      expect(next).toHaveBeenCalledWith({ name: 'dashboard' })
    })

    it('allows admin to access adminOnly route', async () => {
      auth.initialized = true
      auth.isLoggedIn  = true
      auth.isAdmin     = true
      const next = makeNext()
      await authGuard(makeRoute({ layout: 'admin', adminOnly: true }, '/settings'), {}, next)
      expect(next).toHaveBeenCalledWith()
    })
  })

  // ── permission-based routes ──────────────────────────────────────────────

  describe('permission-based routes (manager)', () => {
    it('redirects manager without permission to dashboard', async () => {
      auth.initialized  = true
      auth.isLoggedIn   = true
      auth.isAdmin      = false
      auth.isManager    = true
      auth.hasPermission.mockReturnValue(false)
      const next = makeNext()
      await authGuard(makeRoute({ layout: 'admin', permission: 'orders' }, '/orders'), {}, next)
      expect(next).toHaveBeenCalledWith({ name: 'dashboard' })
    })

    it('allows manager with the required permission', async () => {
      auth.initialized  = true
      auth.isLoggedIn   = true
      auth.isAdmin      = false
      auth.isManager    = true
      auth.hasPermission.mockReturnValue(true)
      const next = makeNext()
      await authGuard(makeRoute({ layout: 'admin', permission: 'orders' }, '/orders'), {}, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('allows admin regardless of permission meta (admin bypasses check)', async () => {
      auth.initialized  = true
      auth.isLoggedIn   = true
      auth.isAdmin      = true
      auth.isManager    = false
      auth.hasPermission.mockReturnValue(false)   // would block a manager
      const next = makeNext()
      await authGuard(makeRoute({ layout: 'admin', permission: 'orders' }, '/orders'), {}, next)
      // admin is not a manager so the permission branch is never reached
      expect(next).toHaveBeenCalledWith()
    })
  })

  // ── public routes ────────────────────────────────────────────────────────

  describe('public routes (no meta)', () => {
    it('always allows navigation to routes with no layout meta', async () => {
      auth.initialized = true
      auth.isLoggedIn  = false
      const next = makeNext()
      await authGuard(makeRoute({}, '/some-public-page'), {}, next)
      expect(next).toHaveBeenCalledWith()
    })
  })
})
