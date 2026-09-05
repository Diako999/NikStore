import { ref, watchEffect } from 'vue'

const STORAGE_KEY = 'nik-admin-theme'

function readStored() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    // localStorage unavailable (privacy mode, etc) — fall through to default
  }
  return null
}

function readSystemPreference() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Module-scoped so every component sharing this composable reads/writes the
// same reactive value instead of each call creating its own local state.
const mode = ref(readStored() ?? readSystemPreference())

watchEffect(() => {
  document.documentElement.setAttribute('data-theme', mode.value)
  try {
    localStorage.setItem(STORAGE_KEY, mode.value)
  } catch {
    // ignore write failures, theme just won't persist across reloads
  }
})

export function useTheme() {
  function setMode(next) {
    mode.value = next === 'light' ? 'light' : 'dark'
  }

  function toggle() {
    setMode(mode.value === 'dark' ? 'light' : 'dark')
  }

  return { mode, setMode, toggle }
}
