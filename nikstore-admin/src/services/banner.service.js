import http from './http.service'

export const bannerService = {
  getAll:       ()        => http.get('/banners/admin/all'),
  create:       (dto)     => http.post('/banners', dto),
  update:       (id, dto) => http.patch(`/banners/${id}`, dto),
  remove:       (id)      => http.delete(`/banners/${id}`),
  toggleActive: (id)      => http.patch(`/banners/${id}/toggle`),
  reorder:      (ids)     => http.patch('/banners/reorder', { ids }),
}
