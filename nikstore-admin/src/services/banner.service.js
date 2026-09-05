import http from './http.service'

export const bannerService = {
  adminList: () => http.get('/banners/admin/all'),
  create: (payload) => http.post('/banners', payload),
  update: (id, payload) => http.patch(`/banners/${id}`, payload),
  toggle: (id) => http.patch(`/banners/${id}/toggle`),
  reorder: (ids) => http.patch('/banners/reorder', { ids }),
  remove: (id) => http.delete(`/banners/${id}`),
}
