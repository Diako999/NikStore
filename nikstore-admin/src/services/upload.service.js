import http from './http.service'

// folder: 'products' | 'avatars' | 'reviews' | 'categories' | 'banners' | 'logos'
// (backend has no dedicated 'blog' folder — use 'banners' or 'products' for
// blog cover images, whichever reads more sensibly at the call site)
export const uploadService = {
  uploadImage(file, folder = 'products') {
    const form = new FormData()
    form.append('file', file)
    return http.post(`/upload/image?folder=${folder}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  uploadImages(files, folder = 'products') {
    const form = new FormData()
    for (const file of files) form.append('files', file)
    return http.post(`/upload/images?folder=${folder}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deleteFile(key) {
    return http.delete(`/upload/${key}`)
  },
}
