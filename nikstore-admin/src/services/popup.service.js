import http from './http.service'
export const popupService = {
  getAll:       ()        => http.get('/popups'),
  getById:      (id)      => http.get(`/popups/${id}`),
  create:       (data)    => http.post('/popups', data),
  update:       (id, d)   => http.patch(`/popups/${id}`, d),
  toggle:       (id)      => http.patch(`/popups/${id}/toggle`),
  remove:       (id)      => http.delete(`/popups/${id}`),
}
