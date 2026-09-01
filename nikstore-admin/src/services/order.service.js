import http from './http.service'
export const orderService = {
  getAll:       (params) => http.get('/orders/admin',               { params }),
  getById:      (id)     => http.get(`/orders/admin/${id}`),
  updateStatus: (id, s)  => http.patch(`/orders/admin/${id}/status`, { status: s }),
}
