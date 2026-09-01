import http from './http.service'
export const paymentService = {
  getBalance:     ()       => http.get('/payments/wallet'),
  payOrder:       (dto)    => http.post('/payments/pay', dto),
  verifyPayment:  (params) => http.get('/payments/verify', { params }),
}
