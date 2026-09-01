import http from './http.service'
export const userService = {
  getAll:         (params)          => http.get('/users',                          { params }),
  getById:        (id)              => http.get(`/users/${id}`),
  getReviews:     (id, params = {}) => http.get(`/users/${id}/reviews`,           { params }),
  block:          (id)              => http.patch(`/users/${id}/block`),
  setRole:        (id, role)        => http.patch(`/admin/users/${id}/role`,       { role }),
  setPermissions: (id, permissions) => http.patch(`/admin/users/${id}/permissions`, { permissions }),
}
