import http from './http.service'

export const productService = {
  adminList: (params) => http.get('/products/admin', { params }),
  getById: (id) => http.get(`/products/admin/${id}`),
  create: (payload) => http.post('/products', payload),
  update: (id, payload) => http.patch(`/products/${id}`, payload),
  remove: (id) => http.delete(`/products/${id}`),
  duplicate: (id) => http.post(`/products/${id}/duplicate`),
  bulkDiscount: (payload) => http.patch('/products/bulk-discount', payload),
  addVariant: (id, payload) => http.post(`/products/${id}/variants`, payload),
  updateVariant: (id, variantId, payload) => http.patch(`/products/${id}/variants/${variantId}`, payload),
  removeVariant: (id, variantId) => http.delete(`/products/${id}/variants/${variantId}`),
  adjustStock: (id, variantId, delta) => http.patch(`/products/${id}/variants/${variantId}/stock`, { delta }),
}
