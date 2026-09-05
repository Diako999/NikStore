import http from './http.service'

export const discountService = {
  list: (params) => http.get('/discounts', { params }),
  get: (id) => http.get(`/discounts/${id}`),
  create: (payload) => http.post('/discounts', payload),
  update: (id, payload) => http.patch(`/discounts/${id}`, payload),
  toggle: (id) => http.patch(`/discounts/${id}/toggle`),
  remove: (id) => http.delete(`/discounts/${id}`),
}
