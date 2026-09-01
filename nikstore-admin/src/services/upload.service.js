import http from './http.service'
export const uploadService = {
  uploadImage: (file, folder = 'products') => {
    const form = new FormData()
    form.append('file', file)
    return http.post(`/upload/image?folder=${folder}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
