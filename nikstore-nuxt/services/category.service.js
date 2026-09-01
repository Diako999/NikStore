import http from './http.service'

export const categoryService = {
  getTree:     ()             => http.get('/categories/tree'),
  getAll:      ()             => http.get('/categories'),
  getRoots:    ()             => http.get('/categories/roots'),
  getBySlug:   (slug)         => http.get(`/categories/${slug}`),
  getProducts: (slug, params) => http.get(`/categories/${slug}/products`, { params }),
}
