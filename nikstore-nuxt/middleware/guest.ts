// Redirects already-logged-in users away from auth pages
export default defineNuxtRouteMiddleware(() => {
  const auth = useAuthStore()
  if (auth.isLoggedIn) {
    return navigateTo('/')
  }
})
