import http from './http.service'

export const reviewService = {
  getByProduct: (productId, params = {}) =>
    http.get('/reviews', { params: { productId, ...params } }),

  create: (payload) =>
    http.post('/reviews', payload),

  markHelpful: (reviewId) =>
    http.post(`/reviews/${reviewId}/helpful`),

  getMyReviews: (params = {}) =>
    http.get('/reviews/my', { params }),
}
