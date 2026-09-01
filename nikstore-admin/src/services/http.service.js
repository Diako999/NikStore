import axios    from 'axios'
import { logger } from '@/utils/logger'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

// Lazy store accessor — avoids circular import at module load time
let _getToken = () => null
export function setTokenProvider(fn) { _getToken = fn }

http.interceptors.request.use(
  (config) => {
    // Access token lives in Pinia store (memory only — never localStorage)
    const token = _getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    config.metadata = { startTime: Date.now() }
    return config
  },
  (error) => {
    logger.error('Request setup failed', error, {}, 'HTTP')
    return Promise.reject(error)
  },
)

http.interceptors.response.use(
  (response) => {
    if (response.data && 'data' in response.data) response.data = response.data.data

    const duration = Date.now() - (response.config.metadata?.startTime ?? 0)
    if (duration > 3000) {
      logger.warn('Slow API call', {
        url:      response.config.url,
        method:   response.config.method?.toUpperCase(),
        duration: `${duration}ms`,
      }, 'Performance')
    }

    return response
  },
  (error) => {
    const status   = error.response?.status
    const url      = error.config?.url ?? 'unknown'
    const method   = error.config?.method?.toUpperCase() ?? 'UNKNOWN'
    const message  = error.response?.data?.message ?? error.message
    const duration = Date.now() - (error.config?.metadata?.startTime ?? 0)

    if (!error.config?.skipErrorLog) {
      logger.apiError(`${method} ${url}`, status ?? 0, message, { duration: `${duration}ms` })

      if (!error.response) {
        logger.error('Network error — no response from server', error, { url, method }, 'HTTP')
      }
    }

    // Skip redirect for requests that handle their own auth errors (e.g. /auth/refresh)
    if (status === 401 && !error.config?.skipAuthRedirect) {
      logger.warn('HTTP: 401 unauthorized — redirecting to login', { url }, 'HTTP')
      window.location.href = '/login'
    }
    if (status === 403) {
      logger.warn('HTTP: 403 forbidden — redirecting to login', { url }, 'HTTP')
      window.location.href = '/login?error=forbidden'
    }

    return Promise.reject(error)
  },
)

export default http
