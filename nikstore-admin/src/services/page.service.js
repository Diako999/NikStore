import http from './http.service'

export const pageService = {
  getAll:    ()       => http.get('/pages/admin'),
  getById:   (id)     => http.get(`/pages/admin/${id}`),
  create:    (data)   => http.post('/pages', data),
  update:    (id, d)  => http.patch(`/pages/${id}`, d),
  remove:    (id)     => http.delete(`/pages/${id}`),
}
