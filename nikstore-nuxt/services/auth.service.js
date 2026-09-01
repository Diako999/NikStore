import http from './http.service'

export const authService = {
  sendOtp:    (phone)       => http.post('/auth/send-otp',  { phone }),
  verifyOtp:  (phone, code) => http.post('/auth/verify-otp', { phone, code }),
  getProfile: ()            => http.get('/users/me'),
  logout:     ()            => http.post('/auth/logout'),
  // Cookie is sent automatically via withCredentials:true — no Authorization header needed.
  // skipErrorLog suppresses the expected 401 when there is no active session.
  refresh:    ()            => http.post('/auth/refresh', {}, { skipErrorLog: true }),
}
