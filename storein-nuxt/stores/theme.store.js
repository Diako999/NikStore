import { defineStore } from 'pinia'
import { ref } from 'vue'

// Holds the *current* resolved theme in memory for reactive consumers
// (e.g. the header toggle icon). Persistence/SSR-safe resolution lives in
// composables/useThemeMode.js — it drives this store via setMode()/toggle().
export const useThemeStore = defineStore('theme', () => {
  const mode = ref('dark') // 'dark' | 'light'

  function setMode(next) {
    mode.value = next === 'light' ? 'light' : 'dark'
  }

  function toggle() {
    setMode(mode.value === 'dark' ? 'light' : 'dark')
  }

  return { mode, setMode, toggle }
})
