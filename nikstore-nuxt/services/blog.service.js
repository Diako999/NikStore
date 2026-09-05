import http from './http.service'

export const blogService = {
  getAll: (params) => http.get('/blog', { params }),
  getTags: () => http.get('/blog/tags'),
  getBySlug: (slug) => http.get(`/blog/slug/${slug}`),
  like: (id) => http.post(`/blog/${id}/like`),
  getLikeStatus: (id) => http.get(`/blog/${id}/like-status`),
  getComments: (id, params) => http.get(`/blog/${id}/comments`, { params }),
  addComment: (id, payload) => http.post(`/blog/${id}/comments`, payload),
}
