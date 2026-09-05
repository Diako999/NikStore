import http from './http.service'

export const blogService = {
  // Admin listing/detail
  getAdminList: (params) => http.get('/blog/admin', { params }),
  getAdminDetail: (id) => http.get(`/blog/admin/${id}`),

  create: (payload) => http.post('/blog', payload),
  update: (id, payload) => http.patch(`/blog/${id}`, payload),
  remove: (id) => http.delete(`/blog/${id}`),

  // Comment moderation
  getPendingComments: () => http.get('/blog/comments/pending'),
  getAllComments: (params) => http.get('/blog/comments', { params }),
  approveComment: (commentId) => http.patch(`/blog/comments/${commentId}/approve`),
  deleteComment: (commentId) => http.delete(`/blog/comments/${commentId}`),
}
