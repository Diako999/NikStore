import http from './http.service'

export const userService = {
  getMe: () => http.get('/users/me'),
  updateMe: (payload) => http.patch('/users/me', payload),
  addAddress: (payload) => http.post('/users/me/addresses', payload),
  updateAddress: (addressId, payload) => http.patch(`/users/me/addresses/${addressId}`, payload),
  removeAddress: (addressId) => http.delete(`/users/me/addresses/${addressId}`),
  setDefaultAddress: (addressId) => http.patch(`/users/me/addresses/${addressId}/default`),
}
