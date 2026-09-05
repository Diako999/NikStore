import http from './http.service'

// Server cart — requires auth. The local stores/cart.store.js is the
// always-available guest cart; sync into this at checkout time once the
// user is logged in (see order.service.js createFromCart, which reads
// from the server cart, not from a request body).
export const cartService = {
  get: () => http.get('/cart'),
  addItem: (payload) => http.post('/cart/items', payload),
  updateItem: (productId, payload) => http.patch(`/cart/items/${productId}`, payload),
  removeItem: (productId, variantId) => http.delete(`/cart/items/${productId}/${variantId}`),
  clear: () => http.delete('/cart'),
}
