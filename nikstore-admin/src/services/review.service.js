import http from './http.service'

export const reviewService = {
  getAdminList: (params) => http.get('/reviews/admin', { params }),
  updateStatus: (id, payload) => http.patch(`/reviews/admin/${id}/status`, payload),
  remove: (id) => http.delete(`/reviews/admin/${id}`),
}
