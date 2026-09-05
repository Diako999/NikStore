import { useAuthStore } from '~/stores/auth.store'
import { authService } from '~/services/auth.service'

// Silently re-hydrates the session from the httpOnly refresh cookie on
// app start, so isLoggedIn is accurate before route middleware runs
// instead of only becoming true after the first 401-triggered refresh.
export default defineNuxtPlugin(async () => {
  const auth = useAuthStore()

  try {
    const { data } = await authService.refresh()
    auth.token = data.accessToken
    await auth.fetchMe()
  } catch {
    // No valid session — stay logged out, nothing to do.
  }
})
