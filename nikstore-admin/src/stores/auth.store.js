import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/auth.service'
import { logger } from '@/utils/logger'

export const useAuthStore = defineStore('auth', () => {
  // Access token lives in memory only — never persisted to localStorage (XSS protection)
  const user         = ref(null)
  const token        = ref(null)
  const loading      = ref(false)
  const pendingPhone = ref('')
  const initialized  = ref(false)
  const initializing = ref(false)

  const isAdmin     = computed(() => user.value?.isAdmin === true)
  const isManager   = computed(() => user.value?.role === 'manager')
  const isLoggedIn  = computed(() => !!token.value && (user.value?.isAdmin === true || user.value?.role === 'manager'))
  const permissions = computed(() => user.value?.permissions ?? [])

  /**
   * Checks whether the current user has a given permission.
   *
   * Supports two formats:
   *   'products'        — section-level: true if the user has the legacy key OR any products:* sub-permission
   *   'products:edit'   — action-level:  true if the user has the exact key OR the legacy section key
   *
   * Admins always pass regardless of permissions.
   */
  function hasPermission(perm) {
    if (isAdmin.value) return true
    const perms = permissions.value

    if (perm.includes(':')) {
      // Action-level check: exact sub-permission OR legacy section key grants full access
      const section = perm.split(':')[0]
      return perms.includes(perm) || perms.includes(section)
    }

    // Section-level check: legacy flat key OR any sub-permission for this section
    return perms.includes(perm) || perms.some(p => p.startsWith(perm + ':'))
  }

  function hasAdminAccess(profile) {
    return profile?.isAdmin === true || profile?.role === 'manager'
  }

  async function sendOtp(phone) {
    loading.value = true
    try {
      await authService.sendOtp(phone)
      pendingPhone.value = phone
    } catch (error) {
      logger.error('admin-auth: sendOtp failed', error, { phone: phone.slice(0, -4) + '****' }, 'AuthStore')
      throw error
    } finally { loading.value = false }
  }

  async function adminLogin(phone, password) {
    loading.value = true
    const masked = phone.slice(0, -4) + '****'
    try {
      const { data } = await authService.adminLogin(phone, password)
      token.value = data.accessToken
      const { data: profile } = await authService.getProfile()
      if (!hasAdminAccess(profile)) {
        logout()
        throw { isAdminError: true, message: 'شما دسترسی به پنل مدیریت ندارید' }
      }
      user.value = profile
      logger.info('admin-auth: password login success', { phone: masked }, 'AuthStore')
      return data
    } catch (error) {
      logger.error('admin-auth: adminLogin failed', error, { phone: masked }, 'AuthStore')
      throw error
    } finally { loading.value = false }
  }

  async function verifyOtp(phone, code) {
    loading.value = true
    try {
      const { data } = await authService.verifyOtp(phone, code)

      token.value = data.accessToken
      // Refresh token is now an HttpOnly cookie — browser handles it automatically

      const { data: profile } = await authService.getProfile()
      if (!hasAdminAccess(profile)) {
        logout()
        throw { isAdminError: true, message: 'شما دسترسی به پنل مدیریت ندارید' }
      }

      user.value         = profile
      pendingPhone.value = ''
      return data
    } catch (error) {
      logger.error('admin-auth: verifyOtp failed', error, {}, 'AuthStore')
      throw error
    } finally { loading.value = false }
  }

  async function initAuth() {
    // Guard against both: already done and in-flight (prevents concurrent refresh calls)
    if (initialized.value || initializing.value) return
    initializing.value = true
    try {
      const { data } = await authService.refresh()
      token.value = data.accessToken
      const { data: profile } = await authService.getProfile()
      if (!hasAdminAccess(profile)) { await logout(); return }
      user.value = profile
      logger.info('admin-auth: session restored from refresh token', {}, 'AuthStore')
    } catch (error) {
      const status = error.response?.status
      if (status === 429) {
        // Rate-limited — can't determine session validity, don't clear credentials
        logger.warn('admin-auth: initAuth rate-limited — not clearing session', { status }, 'AuthStore')
      } else {
        logger.warn('admin-auth: initAuth failed, clearing session', { status, error: error?.message }, 'AuthStore')
        await logout()
      }
    } finally {
      initialized.value  = true
      initializing.value = false
    }
  }

  async function fetchProfile() {
    if (!token.value) return
    try {
      const { data } = await authService.getProfile()
      if (!hasAdminAccess(data)) { logout(); return }
      user.value = data
    } catch (error) {
      logger.warn('admin-auth: fetchProfile failed, logging out', { error: error?.message }, 'AuthStore')
      logout()
    }
  }

  async function logout() {
    logger.info('admin-auth: logging out', {}, 'AuthStore')
    try { await authService.logout() } catch { /* cookie may already be expired — ignore */ }
    user.value         = null
    token.value        = null
    pendingPhone.value = ''
    initialized.value  = false   // force guard to re-run initAuth on next navigation
    const { socketService } = await import('@/services/socket.service')
    socketService.disconnect()
    logger.info('admin-auth: logout complete', {}, 'AuthStore')
  }

  return { user, token, loading, pendingPhone, initialized, initializing, isLoggedIn, isAdmin, isManager, permissions, hasPermission, sendOtp, adminLogin, verifyOtp, fetchProfile, initAuth, logout }
})
