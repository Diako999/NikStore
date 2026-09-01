import http from './http.service'

export const blogService = {
  getAll:    (params) => http.get('/blog/admin', { params }),
  getById:   (id)     => http.get(`/blog/admin/${id}`),
  create:    (data)   => http.post('/blog', data),
  update:    (id, d)  => http.patch(`/blog/${id}`, d),
  remove:    (id)     => http.delete(`/blog/${id}`),
}
