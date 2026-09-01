import http from './http.service'

export const pageService = {
  getAll:      ()      => http.get('/pages'),
  getBySlug:   (slug)  => http.get(`/pages/slug/${slug}`),
}
