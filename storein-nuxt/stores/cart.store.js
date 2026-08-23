import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cartService } from '~/services/cart.service'
import { logger } from '~/utils/logger'
import { withRetry } from '~/utils/retry'

export const useCartStore = defineStore('cart', () => {
  const items   = ref([])
  const loading = ref(false)

  const totalItems = computed(() => items.value.reduce((s, i) => s + i.quantity, 0))
  const totalPrice = computed(() => items.value.reduce((s, i) => s + i.price * i.quantity, 0))

  async function fetchCart() {
    if (loading.value) return
    loading.value = true
    try {
      await withRetry(async () => {
        const { data } = await cartService.get()
        items.value = data.items ?? []
      }, 3, 1500)
    } catch (error) {
      logger.error('cart: fetchCart failed', error, {}, 'CartStore')
    } finally {
      loading.value = false
    }
  }

  async function addItem(productId, variantId, quantity = 1) {
    try {
      const { data } = await cartService.addItem(productId, variantId, quantity)
      items.value = data.items
    } catch (error) {
      logger.error('cart: addItem failed', error, { productId, variantId }, 'CartStore')
      throw error
    }
  }

  async function updateItem(productId, variantId, quantity) {
    try {
      const { data } = await cartService.updateItem(productId, variantId, quantity)
      items.value = data.items
    } catch (error) {
      logger.error('cart: updateItem failed', error, { productId, variantId }, 'CartStore')
      throw error
    }
  }

  async function removeItem(productId, variantId) {
    try {
      const { data } = await cartService.removeItem(productId, variantId)
      items.value = data.items
    } catch (error) {
      logger.error('cart: removeItem failed', error, { productId, variantId }, 'CartStore')
      throw error
    }
  }

  async function clearCart() {
    await cartService.clear()
    items.value = []
  }

  return {
    items, loading,
    totalItems, totalPrice,
    fetchCart, addItem, updateItem, removeItem, clearCart,
  }
})
