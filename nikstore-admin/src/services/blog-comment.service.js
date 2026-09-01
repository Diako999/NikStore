import http from './http.service'

export const blogCommentService = {
  getAll:  (params) => http.get('/blog/comments',               { params }),
  approve: (id)     => http.patch(`/blog/comments/${id}/approve`),
  remove:  (id)     => http.delete(`/blog/comments/${id}`),
}
