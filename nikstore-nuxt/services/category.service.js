import http from './http.service'

export const categoryService = {
  getRoots: () => http.get('/categories/roots'),
  getTree: () => http.get('/categories/tree'),
  getBySlug: (slug) => http.get(`/categories/slug/${slug}`),
}
