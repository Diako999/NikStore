import http from './http.service'

export const authService = {
  login: (phone, password) => http.post('/auth/admin-login', { phone, password }),
  refresh: () => http.post('/auth/refresh'),
  logout: () => http.post('/auth/logout'),
}
