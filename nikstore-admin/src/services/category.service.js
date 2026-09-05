import http from './http.service'

export const categoryService = {
  list: () => http.get('/categories'),
  tree: () => http.get('/categories/tree'),
  getById: (id) => http.get(`/categories/${id}`),
  create: (payload) => http.post('/categories', payload),
  update: (id, payload) => http.patch(`/categories/${id}`, payload),
  remove: (id) => http.delete(`/categories/${id}`),
}
