import http from './http.service'

export const colorService = {
  getAll:      ()        => http.get('/colors/admin/all'),
  getActive:   ()        => http.get('/colors'),
  create:      (data)    => http.post('/colors', data),
  update:      (id, data)=> http.patch(`/colors/${id}`, data),
  remove:      (id)      => http.delete(`/colors/${id}`),
}
