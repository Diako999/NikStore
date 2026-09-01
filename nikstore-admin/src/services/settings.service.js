import http from './http.service'

export const settingsService = {
  get:    ()    => http.get('/settings'),
  update: (dto) => http.patch('/settings', dto),
}
