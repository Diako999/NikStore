import http from './http.service'

// Server wishlist — requires auth. stores/wishlist.store.js is the
// always-available guest/local version; call these once logged in.
export const wishlistService = {
  get: (params) => http.get('/wishlist', { params }),
  toggle: (productId) => http.post(`/wishlist/${productId}`),
  check: (productId) => http.get(`/wishlist/${productId}/check`),
  clear: () => http.delete('/wishlist'),
}
