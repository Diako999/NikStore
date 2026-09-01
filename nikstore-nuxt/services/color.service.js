import http from './http.service'

export const colorService = {
  getActive: () => http.get('/colors'),
}
