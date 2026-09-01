import http from './http.service'
export const userService = {
  getProfile:    ()          => http.get('/users/me'),
  updateProfile: (data)      => http.patch('/users/me', data),
  getAddresses:  ()          => http.get('/users/me'),
  addAddress:    (data)      => http.post('/users/me/addresses', data),
  updateAddress: (id, data)  => http.patch(`/users/me/addresses/${id}`, data),
  deleteAddress: (id)        => http.delete(`/users/me/addresses/${id}`),
  setDefault:    (id)        => http.patch(`/users/me/addresses/${id}/default`),
}
