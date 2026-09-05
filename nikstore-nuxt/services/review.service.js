import http from './http.service'

export const reviewService = {
  getForProduct: (productId, params) => http.get('/reviews', { params: { productId, ...params } }),
  // { productId, rating, title?, body, pros?, cons?, images? }
  create: (payload) => http.post('/reviews', payload),
  getMine: (params) => http.get('/reviews/my', { params }),
  markHelpful: (id) => http.post(`/reviews/${id}/helpful`),
}
