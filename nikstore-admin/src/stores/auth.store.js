import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { setTokenProvider } from '../services/http.service'
import { authService } from '../services/auth.service'
import { userService } from '../services/user.service'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)

  setTokenProvider(() => token.value)

  const isLoggedIn = computed(() => !!token.value)
  const isSuperAdmin = computed(() => !!user.value?.isAdmin)

  async function login(phone, password) {
    const { data } = await authService.login(phone, password)
    token.value = data.accessToken
    await fetchMe()
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

  return { user, token, isLoggedIn, isSuperAdmin, login, fetchMe, logout }
})
