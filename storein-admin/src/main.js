// Apply dark/light mode before Vue mounts — prevents flash of wrong theme.
// Resolution order: localStorage 'nik-admin-theme' ?? prefers-color-scheme ?? 'dark'.
// Sets data-theme on <html> (glass-theme.css keys off this attribute) —
// NOT a `.dark` class; darkMode:'class' is intentionally not enabled in
// tailwind.config.js for this app, this styles off CSS vars directly.
;(function () {
  const stored = localStorage.getItem('nik-admin-theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const mode = stored === 'light' || stored === 'dark' ? stored : (prefersDark ? 'dark' : 'light')
  document.documentElement.setAttribute('data-theme', mode)
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
