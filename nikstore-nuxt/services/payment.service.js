import http from './http.service'

export const PaymentMethod = {
  WALLET: 'wallet',
  GATEWAY: 'gateway',
  MIXED: 'mixed',
}

export const paymentService = {
  getWalletBalance: () => http.get('/payments/wallet'),
  getTransactions: (params) => http.get('/payments/transactions', { params }),
  // { orderId, method: PaymentMethod, walletAmount?, callbackUrl? }
  pay: (payload) => http.post('/payments/pay', payload),
  // Public endpoint the gateway redirects back to — not usually called
  // directly from the client except to re-check status on the result page.
  verify: (authority, status) => http.get('/payments/verify', { params: { authority, status } }),
}
