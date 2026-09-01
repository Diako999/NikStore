import axios from 'axios'

const http = axios.create({
  baseURL:         '/api/v1',
  timeout:         15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

// Lazy token accessor — avoids circular import with auth.store
let _getToken = () => null
export function setTokenProvider(fn) { _getToken = fn }

// Token refresh state
let isRefreshing = false
let pendingQueue = []

function processQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  )
  pendingQueue = []
}

// Request interceptor
http.interceptors.request.use(
  (config) => {
    const token = _getToken()
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }
    config.metadata = { startTime: Date.now() }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor
http.interceptors.response.use(
  (response) => {
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
    const status          = error.response?.status
    const url             = error.config?.url ?? 'unknown'
    const originalRequest = error.config

    if (status === 503 && originalRequest && !originalRequest._503retried) {
      originalRequest._503retried = true
      await new Promise(r => setTimeout(r, 2000))
      return http(originalRequest)
    }

    if (status === 401) {

      if (url.includes('/auth/refresh')) {
        return Promise.reject(error)
      }

      if (originalRequest._retry) {
        _getToken = () => null
        // Emit event instead of window.location.href (works with Nuxt navigateTo in app.vue)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('nikstore:session-expired'))
        }
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject })
        }).then(newToken => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return http(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await http.post('/auth/refresh', {}, { skipErrorLog: true })
        const newToken = data.accessToken

        const { useAuthStore } = await import('~/stores/auth.store')
        const auth = useAuthStore()
        auth.token = newToken

        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return http(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        const { useAuthStore } = await import('~/stores/auth.store')
        const auth = useAuthStore()
        auth.token = null
        auth.user  = null
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
