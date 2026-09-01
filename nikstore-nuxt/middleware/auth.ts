// Protects routes that require login.
// auth.client.ts plugin runs first (async) so auth.initialized is true here.
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  if (!auth.isLoggedIn) {
    return navigateTo({ path: '/auth/login', query: { redirect: to.fullPath } })
  }
})
