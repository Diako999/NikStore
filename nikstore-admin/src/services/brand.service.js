import http from './http.service'

export const brandService = {
  getAll:  ()        => http.get('/brands/admin/all'),
  getById: (id)      => http.get(`/brands/${id}`),
  create:  (data)    => http.post('/brands', data),
  update:  (id, d)   => http.patch(`/brands/${id}`, d),
  remove:  (id)      => http.delete(`/brands/${id}`),
}
