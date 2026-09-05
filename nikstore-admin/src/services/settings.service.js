import http from './http.service'

export const settingsService = {
  getSettings: () => http.get('/settings'),
  updateSettings: (payload) => http.patch('/settings', payload),
}
