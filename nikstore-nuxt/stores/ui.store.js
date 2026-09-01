import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const toasts       = ref([])
  const isMenuOpen   = ref(false)
  const isSearchOpen = ref(false)
  // true once auth + settings have initialised — controls splash screen visibility
  const appReady     = ref(false)
  let   _nextId      = 1

  function addToast(message, type = 'info', duration = 3000) {
    const id = _nextId++
    toasts.value.push({ id, message, type })
    setTimeout(() => removeToast(id), duration)
  }
  function removeToast(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }
  function toggleMenu()   { isMenuOpen.value   = !isMenuOpen.value }
  function toggleSearch() { isSearchOpen.value = !isSearchOpen.value }
  function markAppReady() { appReady.value      = true }

  return { toasts, isMenuOpen, isSearchOpen, appReady, addToast, removeToast, toggleMenu, toggleSearch, markAppReady }
})
