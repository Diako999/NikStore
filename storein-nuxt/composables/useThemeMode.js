import { computed, watchEffect } from 'vue'
import { useThemeStore } from '~/stores/theme.store'

// SSR-safe dark/light mode resolution + persistence.
// Resolution order: cookie value ?? (client) prefers-color-scheme ?? 'dark'.
// The 'dark' fallback also covers SSR/no-JS (no window to read matchMedia from),
// matching the mockups' primary/default look.
export function useThemeMode() {
  const themeCookie = useCookie('nik-theme', {
    default: () => null,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  const themeStore = useThemeStore()

  const mode = computed(() => {
    if (themeCookie.value === 'dark' || themeCookie.value === 'light') return themeCookie.value
    if (import.meta.client) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'dark'
  })

  // Keep the Pinia store mirrored so any component can read the live mode
  // reactively without re-deriving the cookie/matchMedia resolution itself.
  watchEffect(() => { themeStore.setMode(mode.value) })

  function setMode(next) {
    const value = next === 'light' ? 'light' : 'dark'
    themeCookie.value = value
    themeStore.setMode(value)
  }

  function toggle() {
    setMode(mode.value === 'dark' ? 'light' : 'dark')
  }

  return { mode, setMode, toggle }
}
