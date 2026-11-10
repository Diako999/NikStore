import http from './http.service'

export const productService = {
  getAll: (params) => http.get('/products', { params }),
  // Several products by id (max 50) — used for a guest's favorites, which live only in the browser.
  getByIds: (ids) => http.get('/products', { params: { ids: ids.slice(0, 50).join(','), limit: 50 } }),
  getBySlug: (slug) => http.get(`/products/slug/${slug}`),
  getRelated: (slug) => http.get(`/products/${slug}/related`),
}
