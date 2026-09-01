import http from './http.service'

export const settingsService = {
  getSettings: () => http.get('/settings'),
}
