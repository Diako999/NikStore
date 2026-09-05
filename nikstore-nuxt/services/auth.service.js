import http from './http.service'

export const authService = {
  sendOtp: (phone) => http.post('/auth/send-otp', { phone }),
  verifyOtp: (phone, code) => http.post('/auth/verify-otp', { phone, code }),
  refresh: () => http.post('/auth/refresh'),
  logout: () => http.post('/auth/logout'),
}
