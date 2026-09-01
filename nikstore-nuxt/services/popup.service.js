import http from './http.service'
export const popupService = {
  getActive: () => http.get('/popups/active'),
}
