import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import http from '@/services/http.service'

const sidebarBg = ref('')
let fetched = false

function apply(theme) {
  if (!theme) return
  sidebarBg.value = theme.sidebarBg ?? ''
}

async function init() {
  if (fetched) return
  const auth = useAuthStore()
  if (!auth.token) return
  fetched = true
  try {
    const { data } = await http.get('/settings', { skipErrorLog: true })
    apply(data?.theme)
  } catch { /* non-critical — default sidebar color used */ }
}

function applyTheme(theme) {
  apply(theme)
}

export function useAdminTheme() {
  return { sidebarBg, init, applyTheme }
}
