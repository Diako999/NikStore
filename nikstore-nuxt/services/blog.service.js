import http from './http.service'

export const blogService = {
  getAll:    (params) => http.get('/blog', { params }),
  getBySlug: (slug)   => http.get(`/blog/slug/${slug}`),
  getTags:   ()       => http.get('/blog/tags'),
}
