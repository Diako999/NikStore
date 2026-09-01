import http from './http.service'
export const brandService = {
  getActive: () => http.get('/brands'),
}
