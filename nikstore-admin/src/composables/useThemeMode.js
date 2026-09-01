import { ref } from 'vue'

const STORAGE_KEY = 'nik-admin-theme'

function resolveInitialMode() {
  if (typeof window === 'undefined') return 'dark'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

// Module-level so every consumer shares the same reactive mode
// (mirrors the attribute main.js already set before Vue mounted).
const mode = ref(resolveInitialMode())

function applyMode(value) {
  mode.value = value
  document.documentElement.setAttribute('data-theme', value)
  try { localStorage.setItem(STORAGE_KEY, value) } catch { /* storage blocked */ }
}

export function useThemeMode() {
  function setMode(next) {
    applyMode(next === 'light' ? 'light' : 'dark')
  }

  function toggle() {
    setMode(mode.value === 'dark' ? 'light' : 'dark')
  }

  return { mode, setMode, toggle }
}
