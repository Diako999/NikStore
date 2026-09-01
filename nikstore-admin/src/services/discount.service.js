import http from './http.service'

export const discountService = {
  getAll:     (params) => http.get('/discounts', { params }),
  getActive:  ()       => http.get('/discounts/active'),
  getById:    (id)     => http.get(`/discounts/${id}`),
  create:     (data)   => http.post('/discounts', data),
  update:     (id, data) => http.patch(`/discounts/${id}`, data),
  toggle:     (id)     => http.patch(`/discounts/${id}/toggle`),
  softDelete: (id)     => http.delete(`/discounts/${id}`),
}
