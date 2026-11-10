import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'nikstore-cart'

// A cart line needs the variant's *id* — that is what the API orders by.
// `variant` is only the human-readable label ("سایز: 6، رنگ: سبز") for display.
// Lines saved by older versions only had the label, so they can never be ordered
// and are dropped on load instead of failing at checkout.
function isValidLine(i) {
  return !!i && typeof i.productId === 'string' && typeof i.variantId === 'string' && !!i.variantId
    && Number.isFinite(i.qty) && i.qty > 0
}

function loadPersisted() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter(isValidLine) : []
  } catch {
    return []
  }
}

// Guest-friendly cart: lives in localStorage, one line per product + variant.
export const useCartStore = defineStore('cart', () => {
  const items = ref(loadPersisted())

  if (typeof window !== 'undefined') {
    watch(items, (val) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
      } catch {
        // storage full/blocked — the cart still works for this session
      }
    }, { deep: true })
  }

  const totalCount = computed(() => items.value.reduce((sum, i) => sum + i.qty, 0))
  const totalPrice = computed(() => items.value.reduce((sum, i) => sum + i.price * i.qty, 0))

  const sameLine = (i, productId, variantId) => i.productId === productId && i.variantId === variantId

  function addItem({ productId, variantId, name, image, price, slug, variant = null, qty = 1 }) {
    if (!productId || !variantId) return
    const existing = items.value.find((i) => sameLine(i, productId, variantId))
    if (existing) {
      existing.qty += qty
    } else {
      items.value.push({ productId, variantId, name, image, price, slug, variant, qty })
    }
  }

  function removeItem(productId, variantId) {
    items.value = items.value.filter((i) => !sameLine(i, productId, variantId))
  }

  function updateQty(productId, variantId, qty) {
    const line = items.value.find((i) => sameLine(i, productId, variantId))
    if (!line) return
    if (qty <= 0) return removeItem(productId, variantId)
    line.qty = qty
  }

  function clear() {
    items.value = []
  }

  return { items, totalCount, totalPrice, addItem, removeItem, updateQty, clear }
})
