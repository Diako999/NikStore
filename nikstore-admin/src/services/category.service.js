import http from './http.service'
export const categoryService = {
  getAll:  (params) => http.get('/categories',              { params }),
  create:  (data)   => http.post('/categories',              data),
  update:  (id, d)  => http.patch(`/categories/${id}`,       d),
  remove:  (id)     => http.delete(`/categories/${id}`),
  getTree: ()       => http.get('/categories/tree'),
}
