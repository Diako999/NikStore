import http from './http.service'
export const reviewService = {
  getAll:  (params) => http.get('/reviews/admin',              { params }),
  approve: (id)     => http.patch(`/reviews/admin/${id}/status`, { status: 'approved' }),
  reject:  (id)     => http.patch(`/reviews/admin/${id}/status`, { status: 'rejected' }),
  remove:  (id)     => http.delete(`/reviews/admin/${id}`),
}
