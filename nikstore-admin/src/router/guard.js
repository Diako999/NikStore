import { authService } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'

// Silently re-hydrates the session from the httpOnly refresh cookie before
// the first navigation resolves, so isLoggedIn is accurate on a hard reload
// instead of only becoming true after the first 401-triggered refresh.
// Memoized so every route change beyond the first doesn't refetch.
let hydration = null

function ensureHydrated(auth) {
  if (!hydration) {
    hydration = (async () => {
      try {
        const { data } = await authService.refresh()
        auth.token = data.accessToken
        await auth.fetchMe()
      } catch {
        // no valid session — stay logged out, nothing to do
      }
    })()
  }
  return hydration
}

export function setupGuard(router) {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()
    await ensureHydrated(auth)

    if (to.path !== '/login' && !auth.isLoggedIn) {
      return { path: '/login' }
    }
    if (to.path === '/login' && auth.isLoggedIn) {
      return { path: '/' }
    }
    return true
  })
}
