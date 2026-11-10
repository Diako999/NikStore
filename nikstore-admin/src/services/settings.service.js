import http from './http.service'

export const settingsService = {
  // Full settings (incl. SMS credentials) — super-admin only. The public GET /settings strips secrets.
  getSettings: () => http.get('/settings/admin'),
  updateSettings: (payload) => http.patch('/settings', payload),
}
