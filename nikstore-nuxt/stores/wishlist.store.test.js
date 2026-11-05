import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'

const loggedIn = { value: false }
const server = { ids: new Set() }

vi.mock('~/stores/auth.store', () => ({ useAuthStore: () => ({ get isLoggedIn() { return loggedIn.value } }) }))
vi.mock('~/services/wishlist.service', () => ({
  wishlistService: {
    get: vi.fn(async () => ({ data: { products: [...server.ids].map((_id) => ({ _id })), totalPages: 1 } })),
    toggle: vi.fn(async (id) => {
      const added = !server.ids.has(id)
      added ? server.ids.add(id) : server.ids.delete(id)
      return { data: { added } }
    }),
    check: vi.fn(async (id) => ({ data: { inWishlist: server.ids.has(id) } })),
  },
}))

function fakeStorage() {
  const m = new Map()
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }
}

async function freshStore() {
  vi.resetModules()
  setActivePinia(createPinia())
  const { useWishlistStore } = await import('~/stores/wishlist.store')
  return useWishlistStore()
}

beforeEach(() => {
  loggedIn.value = false
  server.ids = new Set()
  globalThis.window = { localStorage: fakeStorage() }
})

describe('wishlist store', () => {
  it('guest favorites go to localStorage, not the server', async () => {
    const s = await freshStore()
    const { wishlistService } = await import('~/services/wishlist.service')
    await s.toggle('p1')
    await nextTick()
    expect(JSON.parse(window.localStorage.getItem('nikstore-wishlist'))).toEqual(['p1'])
    expect(wishlistService.toggle).not.toHaveBeenCalled()
  })

  it('logged-in favorites go to the server and are not stored locally', async () => {
    loggedIn.value = true
    const s = await freshStore()
    await s.toggle('p2')
    await nextTick()
    expect(server.ids.has('p2')).toBe(true)
    expect(s.isWishlisted('p2')).toBe(true)
    expect(window.localStorage.getItem('nikstore-wishlist')).toBeNull()
    await s.toggle('p2')
    expect(server.ids.has('p2')).toBe(false)
    expect(s.isWishlisted('p2')).toBe(false)
  })

  it('rolls back the optimistic update when the server call fails', async () => {
    loggedIn.value = true
    const s = await freshStore()
    const { wishlistService } = await import('~/services/wishlist.service')
    wishlistService.toggle.mockRejectedValueOnce(new Error('offline'))
    await s.toggle('p3')
    expect(s.isWishlisted('p3')).toBe(false)
  })

  it('merges guest favorites into the account on login without un-favoriting existing ones', async () => {
    const s = await freshStore()
    await s.toggle('a')
    await s.toggle('b')
    server.ids = new Set(['b', 'c']) // account already has b and c
    loggedIn.value = true
    await s.mergeIntoAccount()
    expect([...server.ids].sort()).toEqual(['a', 'b', 'c'])
    expect([...s.ids].sort()).toEqual(['a', 'b', 'c'])
    expect(window.localStorage.getItem('nikstore-wishlist')).toBeNull()
  })

  it('resetToGuest clears account favorites on logout', async () => {
    loggedIn.value = true
    const s = await freshStore()
    await s.toggle('x')
    loggedIn.value = false
    s.resetToGuest()
    await nextTick()
    expect(s.ids).toEqual([])
  })
})
