import axios from 'axios'

const http = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

// Lazy token accessor — avoids a circular import with the auth store.
let getToken = () => null
export function setTokenProvider(fn) {
  getToken = fn
}

let isRefreshing = false
let pendingQueue = []

function processQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)))
  pendingQueue = []
}

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => {
    // Backend wraps successful responses as { success, data } — unwrap so
    // call sites work with the raw DTO instead of the envelope.
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data
    ) {
      response.data = response.data.data
    }
    return response
  },
  async (error) => {
    const status = error.response?.status
    const originalRequest = error.config

    if (status === 503 && originalRequest && !originalRequest._503retried) {
      originalRequest._503retried = true
      await new Promise((resolve) => setTimeout(resolve, 2000))
      return http(originalRequest)
    }

    if (status === 401 && originalRequest && !originalRequest.url?.includes('/auth/refresh')) {
      if (originalRequest._retry) {
        getToken = () => null
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('nikstore:session-expired'))
        }
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject })
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return http(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await http.post('/auth/refresh')
        const newToken = data.accessToken

        const { useAuthStore } = await import('~/stores/auth.store')
        useAuthStore().token = newToken

        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return http(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        const { useAuthStore } = await import('~/stores/auth.store')
        const auth = useAuthStore()
        auth.token = null
        auth.user = null
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('nikstore:session-expired'))
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default http
