import { useAuthStore } from '~/stores/auth.store'

// Keeps already-logged-in users off /auth/** screens.
export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return
  const auth = useAuthStore()
  if (auth.isLoggedIn) {
    return navigateTo('/user')
  }
})
