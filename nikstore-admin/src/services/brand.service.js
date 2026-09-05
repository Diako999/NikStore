import http from './http.service'

export const brandService = {
  list: () => http.get('/brands/admin/all'),
  create: (payload) => http.post('/brands', payload),
  update: (id, payload) => http.patch(`/brands/${id}`, payload),
  remove: (id) => http.delete(`/brands/${id}`),
}
