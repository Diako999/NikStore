import http from './http.service'

export const bannerService = {
  getActive:      () => http.get('/banners'),
  getActivePromo: () => http.get('/banners/promo'),
}
