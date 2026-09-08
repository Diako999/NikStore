import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { setTokenProvider } from '~/services/http.service'
import { authService } from '~/services/auth.service'
import { userService } from '~/services/user.service'
import { useWishlistStore } from '~/stores/wishlist.store'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)

  setTokenProvider(() => token.value)

  const isLoggedIn = computed(() => !!token.value)

  async function verifyOtp(phone, code) {
    const { data } = await authService.verifyOtp(phone, code)
    token.value = data.accessToken
    await fetchMe()
    // Carry over anything favorited as a guest into the now-known account.
    useWishlistStore().mergeIntoAccount().catch(() => {})
    return data
  }

  async function fetchMe() {
    const { data } = await userService.getMe()
    user.value = data
    return data
  }

  async function logout() {
    try {
      await authService.logout()
    } finally {
      token.value = null
      user.value = null
    }
  }

  return { user, token, isLoggedIn, verifyOtp, fetchMe, logout }
})
