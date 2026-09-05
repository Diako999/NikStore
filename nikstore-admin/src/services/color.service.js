import http from './http.service'

export const colorService = {
  list: () => http.get('/colors/admin/all'),
  create: (payload) => http.post('/colors', payload),
  update: (id, payload) => http.patch(`/colors/${id}`, payload),
  remove: (id) => http.delete(`/colors/${id}`),
}
