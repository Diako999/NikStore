import http from './http.service'

export const orderService = {
  adminList: (params) => http.get('/orders/admin', { params }),
  adminGet: (id) => http.get(`/orders/admin/${id}`),
  updateStatus: (id, payload) => http.patch(`/orders/admin/${id}/status`, payload),
}
