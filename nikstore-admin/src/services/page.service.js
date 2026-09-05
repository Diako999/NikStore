import http from './http.service'

export const pageService = {
  getAdminList: () => http.get('/pages/admin'),
  getAdminDetail: (id) => http.get(`/pages/admin/${id}`),
  create: (payload) => http.post('/pages', payload),
  update: (id, payload) => http.patch(`/pages/${id}`, payload),
  remove: (id) => http.delete(`/pages/${id}`),
}
