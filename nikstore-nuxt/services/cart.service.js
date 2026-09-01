import http from './http.service'
export const cartService = {
  get:        ()                     => http.get('/cart'),
  addItem:    (productId, variantId, quantity) => http.post('/cart/items', { productId, variantId, quantity }),
  updateItem: (productId, variantId, quantity) => http.patch(`/cart/items/${productId}`, { variantId, quantity }),
  removeItem: (productId, variantId) => http.delete(`/cart/items/${productId}/${variantId}`),
  clear:      ()                     => http.delete('/cart'),
}
