import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'nikstore-wishlist'

function loadPersisted() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Guest-friendly wishlist: local ids only for now, same localStorage
// pattern as the cart store. The backend already has a wishlist module —
// swap this for server-synced state once auth/account pages need it.
export const useWishlistStore = defineStore('wishlist', () => {
  const ids = ref(loadPersisted())

  if (typeof window !== 'undefined') {
    watch(ids, (val) => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    }, { deep: true })
  }

  const count = computed(() => ids.value.length)

  function isWishlisted(productId) {
    return ids.value.includes(productId)
  }

  function toggle(productId) {
    const idx = ids.value.indexOf(productId)
    if (idx === -1) ids.value.push(productId)
    else ids.value.splice(idx, 1)
  }

  return { ids, count, isWishlisted, toggle }
})
