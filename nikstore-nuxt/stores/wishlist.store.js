import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { wishlistService } from '~/services/wishlist.service'

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

// Guest-friendly wishlist: local ids persisted to localStorage so favorites
// survive across visits with no account needed. Once the user logs in,
// mergeIntoAccount() pushes any locally-favorited product ids into their
// server-side wishlist (the backend module already exists) and clears the
// local copy, so guest favorites carry over to the account exactly once.
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

  // Called right after login/signup (see stores/auth.store.js). Checks each
  // locally-favorited product against the server wishlist first — toggle()
  // on the backend flips state, so blindly calling it on an id the account
  // already has would incorrectly remove it.
  async function mergeIntoAccount() {
    if (!ids.value.length) return
    const localIds = ids.value.slice()
    await Promise.all(localIds.map(async (id) => {
      try {
        const { data } = await wishlistService.check(id)
        if (!data?.inWishlist) await wishlistService.toggle(id)
      } catch {
        // Product may no longer exist, or the request failed — skip it
        // rather than blocking the rest of the merge.
      }
    }))
    ids.value = []
  }

  return { ids, count, isWishlisted, toggle, mergeIntoAccount }
})
