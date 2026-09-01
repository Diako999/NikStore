import { useAuthStore } from '@/stores/auth.store'

export async function authGuard(to, _from, next) {
  const auth = useAuthStore()

  // Restore session from HttpOnly refresh-token cookie on first navigation (page refresh)
  if (!auth.initialized) {
    await auth.initAuth()
  }

  if (to.meta.guestOnly && auth.isLoggedIn)
    return next({ name: 'dashboard' })

  if (to.meta.layout === 'admin' && !auth.isLoggedIn)
    return next({ name: 'login', query: { redirect: to.fullPath } })

  if (to.meta.adminOnly && !auth.isAdmin)
    return next({ name: 'dashboard' })

  if (to.meta.permission && auth.isManager && !auth.hasPermission(to.meta.permission))
    return next({ name: 'dashboard' })

  next()
}
