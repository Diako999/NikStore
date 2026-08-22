// Apply theme before Vue mounts — prevents flash of unstyled content
;(function () {
  const stored = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (stored === 'dark' || (!stored && prefersDark)) {
    document.documentElement.classList.add('dark')
  }
})()

import { createApp }        from 'vue'
import { createPinia }       from 'pinia'
import '@/plugins/chartjs'
import App                   from './App.vue'
import router                from './router'
import { logger }            from '@/utils/logger'
import { setTokenProvider }  from '@/services/http.service'
import { useAuthStore }      from '@/stores/auth.store'
import '@/assets/styles/main.css'
import DatePicker from 'vue3-persian-datetime-picker'

const app = createApp(App)

// Vue component error handler (catches Chart.js and all component errors)
app.config.errorHandler = (error, componentInstance, info) => {
  logger.error(
    'Vue Component Error',
    error,
    {
      info,
      component: componentInstance?.$options?.name
               ?? componentInstance?.__name
               ?? 'Unknown',
    },
    'Vue',
  )
}

// Vue warning handler (dev only)
if (import.meta.env.DEV) {
  app.config.warnHandler = (msg, componentInstance, trace) => {
    logger.warn('Vue Warning', { msg, trace }, 'Vue')
  }
}

// Unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  logger.error(
    'Unhandled Promise Rejection',
    event.reason,
    { promise: String(event.promise) },
    'GlobalHandler',
  )
})

// Global JS errors outside Vue
window.addEventListener('error', (event) => {
  logger.error(
    'Global JavaScript Error',
    event.error,
    { filename: event.filename, lineno: event.lineno, colno: event.colno },
    'GlobalHandler',
  )
})

// Router navigation errors
router.onError((error) => {
  logger.error('Router Navigation Error', error, {
    from: router.currentRoute.value?.fullPath,
  }, 'Router')
})

const pinia = createPinia()
app.use(pinia)
app.use(router)
app.component('DatePicker', DatePicker)

// Wire access token from Pinia store into axios (memory-only, never localStorage)
setTokenProvider(() => useAuthStore().token)

app.mount('#app')

logger.info('nik-admin started', {
  version: import.meta.env.VITE_APP_VERSION,
  env:     import.meta.env.MODE,
}, 'Bootstrap')
