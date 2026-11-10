import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

function fakeStorage(seed = {}) {
  const m = new Map(Object.entries(seed))
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }
}

async function freshStore(seed) {
  vi.resetModules()
  globalThis.window = { localStorage: fakeStorage(seed) }
  setActivePinia(createPinia())
  const { useCartStore } = await import('~/stores/cart.store')
  return useCartStore()
}

const shorts = (over = {}) => ({
  productId: 'p1',
  variantId: 'v-green-6',
  name: 'شلوارک',
  image: '/img.webp',
  price: 390000,
  slug: 'shorts',
  variant: 'سایز: 6، رنگ: سبز',
  qty: 1,
  ...over,
})

describe('cart store', () => {
  beforeEach(() => {
    delete globalThis.window
  })

  it('keeps the variant id on the line (checkout orders by id, not by label)', async () => {
    const cart = await freshStore()
    cart.addItem(shorts())
    expect(cart.items).toHaveLength(1)
    expect(cart.items[0].variantId).toBe('v-green-6')
    expect(cart.items[0].variant).toBe('سایز: 6، رنگ: سبز') // label is display-only
  })

  it('adds the same variant twice -> one line with summed quantity', async () => {
    const cart = await freshStore()
    cart.addItem(shorts({ qty: 1 }))
    cart.addItem(shorts({ qty: 2 }))
    expect(cart.items).toHaveLength(1)
    expect(cart.items[0].qty).toBe(3)
    expect(cart.totalCount).toBe(3)
    expect(cart.totalPrice).toBe(390000 * 3)
  })

  it('different variants of one product are separate lines', async () => {
    const cart = await freshStore()
    cart.addItem(shorts())
    cart.addItem(shorts({ variantId: 'v-orange-4', variant: 'سایز: 4، رنگ: نارنجی' }))
    expect(cart.items).toHaveLength(2)
  })

  it('a product whose variants have identical labels still keys on the id', async () => {
    const cart = await freshStore()
    cart.addItem(shorts({ variantId: 'a', variant: null }))
    cart.addItem(shorts({ variantId: 'b', variant: null }))
    expect(cart.items).toHaveLength(2)
  })

  it('ignores an add without a variant id', async () => {
    const cart = await freshStore()
    cart.addItem(shorts({ variantId: undefined }))
    expect(cart.items).toHaveLength(0)
  })

  it('updateQty / removeItem address the line by variant id; qty 0 removes it', async () => {
    const cart = await freshStore()
    cart.addItem(shorts())
    cart.updateQty('p1', 'v-green-6', 4)
    expect(cart.items[0].qty).toBe(4)
    cart.updateQty('p1', 'v-green-6', 0)
    expect(cart.items).toHaveLength(0)
    cart.addItem(shorts())
    cart.removeItem('p1', 'v-green-6')
    expect(cart.items).toHaveLength(0)
  })

  it('drops legacy lines saved with only a variant label (they could never be ordered)', async () => {
    const legacy = { productId: 'p1', name: 'x', price: 1, slug: 's', variant: 'سایز: 6، رنگ: سبز', qty: 1 }
    const good = shorts({ variantId: 'v-ok' })
    const cart = await freshStore({ 'nikstore-cart': JSON.stringify([legacy, good]) })
    expect(cart.items).toHaveLength(1)
    expect(cart.items[0].variantId).toBe('v-ok')
  })

  it('survives corrupt storage', async () => {
    const cart = await freshStore({ 'nikstore-cart': '{not json' })
    expect(cart.items).toEqual([])
  })
})
