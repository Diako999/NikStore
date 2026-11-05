import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { wishlistService } from '~/services/wishlist.service'
import { useAuthStore } from '~/stores/auth.store'

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

// Wishlist with two modes:
//  - Guest: ids live only in localStorage so favorites survive across visits
//    with no account.
//  - Logged in: the server (Mongo) is the source of truth. `ids` mirrors it for
//    instant UI state; every toggle is sent to the backend and nothing is
//    written to localStorage.
// On login, mergeIntoAccount() pushes the guest ids to the account once, clears
// the local copy, then loads the server list.
export const useWishlistStore = defineStore('wishlist', () => {
  const ids = ref(loadPersisted())

  const loggedIn = () => useAuthStore().isLoggedIn

  if (typeof window !== 'undefined') {
    watch(ids, (val) => {
      if (loggedIn()) return // server mode — never persist account favorites locally
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    }, { deep: true })
  }

  const count = computed(() => ids.value.length)

  function isWishlisted(productId) {
    return ids.value.includes(productId)
  }

  function flipLocal(productId) {
    const idx = ids.value.indexOf(productId)
    if (idx === -1) ids.value.push(productId)
    else ids.value.splice(idx, 1)
  }

  async function toggle(productId) {
    if (!loggedIn()) {
      flipLocal(productId)
      return
    }
    // Optimistic update, rolled back if the server call fails.
    flipLocal(productId)
    try {
      const { data } = await wishlistService.toggle(productId)
      const has = ids.value.includes(productId)
      if (data?.added && !has) ids.value.push(productId)
      else if (data && data.added === false && has) flipLocal(productId)
    } catch {
      flipLocal(productId)
    }
  }

  // Replace local state with the account's server wishlist.
  async function sync() {
    if (!loggedIn()) return
    const all = []
    for (let page = 1; page <= 50; page++) {
      const { data } = await wishlistService.get({ page, limit: 100 })
      all.push(...(data?.products || []).map((p) => p._id))
      if (page >= (data?.totalPages || 0)) break
    }
    ids.value = all
  }

  // Called right after login (see stores/auth.store.js) with the guest ids still
  // in `ids`. Checks each against the server first — toggle() on the backend
  // flips state, so blindly calling it on an id the account already has would
  // remove it.
  async function mergeIntoAccount() {
    const localIds = ids.value.slice()
    await Promise.all(localIds.map(async (id) => {
      try {
        const { data } = await wishlistService.check(id)
        if (!data?.inWishlist) await wishlistService.toggle(id)
      } catch {
        // Product may no longer exist, or the request failed — skip it.
      }
    }))
    try { window.localStorage.removeItem(STORAGE_KEY) } catch {}
    await sync()
  }

  // On logout, drop the account's favorites from memory and go back to the
  // (empty) guest list.
  function resetToGuest() {
    ids.value = []
    try { window.localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  return { ids, count, isWishlisted, toggle, sync, mergeIntoAccount, resetToGuest }
})
