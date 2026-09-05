import http from './http.service'

export const orderService = {
  // Creates an order from whatever is currently in the SERVER cart —
  // sync stores/cart.store.js into the server cart via cartService before
  // calling this. { addressId, note?, couponCode? }
  create: (payload) => http.post('/orders', payload),
  getMine: (params) => http.get('/orders/my', { params }),
  getMineById: (id) => http.get(`/orders/my/${id}`),
  cancelMine: (id) => http.patch(`/orders/my/${id}/cancel`),
}
