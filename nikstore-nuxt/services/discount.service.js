import http from './http.service'

export const discountService = {
  validate: (code, cartTotal) => http.post('/discounts/validate', { code, cartTotal }),
}
