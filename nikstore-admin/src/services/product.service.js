import http from './http.service'
export const productService = {
  getAll:       (params) => http.get('/products/admin',           { params }),
  getById:      (id)     => http.get(`/products/admin/${id}`),
  create:       (data)   => http.post('/products',                 data),
  update:       (id, d)  => http.patch(`/products/${id}`,          d),
  remove:       (id)     => http.delete(`/products/${id}`),
  toggleStatus: (id, s)  => http.patch(`/products/${id}/status`,   { status: s }),
  duplicate:    (id)     => http.post(`/products/${id}/duplicate`),
  bulkDiscount: (data)   => http.patch('/products/bulk-discount',   data),
}
