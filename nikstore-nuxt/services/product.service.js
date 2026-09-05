import http from './http.service'

export const productService = {
  getAll: (params) => http.get('/products', { params }),
  getBySlug: (slug) => http.get(`/products/slug/${slug}`),
  getRelated: (slug) => http.get(`/products/${slug}/related`),
}
