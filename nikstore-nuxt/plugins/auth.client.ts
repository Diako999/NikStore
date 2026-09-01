// Client-only: restores session from HttpOnly refresh-token cookie on app start.
// Runs before any page/middleware so auth.initialized is true by first navigation.
export default defineNuxtPlugin(async () => {
  const auth = useAuthStore()
  if (!auth.initialized) {
    await auth.initAuth()
  }
})
