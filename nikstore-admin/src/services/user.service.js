import http from './http.service'

export const userService = {
  getMe: () => http.get('/users/me'),
  updateMe: (payload) => http.patch('/users/me', payload),

  // ── Admin: customer management ──────────────────────────────
  getUsers: (params) => http.get('/users', { params }),
  getUser: (id) => http.get(`/users/${id}`),
  getUserReviews: (id, params) => http.get(`/users/${id}/reviews`, { params }),
  toggleUserBlock: (id) => http.patch(`/users/${id}/block`),
}
