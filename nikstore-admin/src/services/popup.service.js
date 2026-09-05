import http from './http.service'

// Backend module is mounted at /popups (plural) — verified against
// nikstore/src/modules/popup/popup.controller.ts.
export const popupService = {
  list: () => http.get('/popups'),
  get: (id) => http.get(`/popups/${id}`),
  create: (payload) => http.post('/popups', payload),
  update: (id, payload) => http.patch(`/popups/${id}`, payload),
  toggle: (id) => http.patch(`/popups/${id}/toggle`),
  remove: (id) => http.delete(`/popups/${id}`),
}
