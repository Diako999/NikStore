// Guest checkout storage. Customers without an account keep their contact/address
// and their orders in this browser's localStorage so they can come back later:
//  - profile: last used recipient/address, to pre-fill the next checkout
//  - orders:  { orderId, orderNumber, token, total, createdAt } — `token` is the
//             secret issued once at checkout; it is the key to look the order up.
// Everything is wrapped in try/catch — localStorage can be blocked or full.

const PROFILE_KEY = 'nikstore-guest-profile'
const ORDERS_KEY = 'nikstore-guest-orders'
const MAX_ORDERS = 50

export const EMPTY_PROFILE = {
  recipientName: '',
  recipientPhone: '',
  province: '',
  city: '',
  street: '',
  detail: '',
  postalCode: '',
}

function read(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage unavailable/full — the order still exists server-side
  }
}

export function loadGuestProfile() {
  const saved = read(PROFILE_KEY, {})
  // Only copy known string fields, so a tampered value can't inject anything.
  const out = { ...EMPTY_PROFILE }
  for (const k of Object.keys(EMPTY_PROFILE)) {
    if (typeof saved?.[k] === 'string') out[k] = saved[k]
  }
  return out
}

export function saveGuestProfile(profile) {
  const out = {}
  for (const k of Object.keys(EMPTY_PROFILE)) out[k] = String(profile?.[k] ?? '')
  write(PROFILE_KEY, out)
}

export function loadGuestOrders() {
  const list = read(ORDERS_KEY, [])
  return Array.isArray(list)
    ? list.filter((o) => o && typeof o.orderId === 'string' && typeof o.token === 'string')
    : []
}

export function addGuestOrder({ orderId, orderNumber, token, total }) {
  const rest = loadGuestOrders().filter((o) => o.orderId !== orderId)
  rest.unshift({ orderId, orderNumber, token, total, createdAt: new Date().toISOString() })
  write(ORDERS_KEY, rest.slice(0, MAX_ORDERS))
}

export function findGuestOrder(orderId) {
  return loadGuestOrders().find((o) => o.orderId === orderId) || null
}

export function removeGuestOrder(orderId) {
  write(ORDERS_KEY, loadGuestOrders().filter((o) => o.orderId !== orderId))
}
