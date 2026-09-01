import http from './http.service'
export const orderService = {
  createOrder:  (dto)    => http.post('/orders', dto),
  getMyOrders:  (params) => http.get('/orders/my', { params }),
  getMyOrder:   (id)     => http.get(`/orders/my/${id}`),
  cancelOrder:  (id)     => http.patch(`/orders/my/${id}/cancel`),
}
