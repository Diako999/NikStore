import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'nikstore-cart'

function loadPersisted() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Guest-friendly cart: lives in localStorage, keyed by productId + variant
// signature. Server-side sync (cart module already exists on the backend)
// can be layered on top later without changing this store's public shape.
export const useCartStore = defineStore('cart', () => {
  const items = ref(loadPersisted())

  if (typeof window !== 'undefined') {
    watch(items, (val) => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    }, { deep: true })
  }

  const totalCount = computed(() => items.value.reduce((sum, i) => sum + i.qty, 0))
  const totalPrice = computed(() => items.value.reduce((sum, i) => sum + i.price * i.qty, 0))

  function lineKey(productId, variant) {
    return variant ? `${productId}::${variant}` : productId
  }

  function addItem({ productId, name, image, price, slug, variant = null, qty = 1 }) {
    const key = lineKey(productId, variant)
    const existing = items.value.find((i) => lineKey(i.productId, i.variant) === key)
    if (existing) {
      existing.qty += qty
    } else {
      items.value.push({ productId, name, image, price, slug, variant, qty })
    }
  }

  function removeItem(productId, variant = null) {
    const key = lineKey(productId, variant)
    items.value = items.value.filter((i) => lineKey(i.productId, i.variant) !== key)
  }

  function updateQty(productId, variant, qty) {
    const key = lineKey(productId, variant)
    const line = items.value.find((i) => lineKey(i.productId, i.variant) === key)
    if (!line) return
    if (qty <= 0) return removeItem(productId, variant)
    line.qty = qty
  }

  function clear() {
    items.value = []
  }

  return { items, totalCount, totalPrice, addItem, removeItem, updateQty, clear }
})
