export default defineNuxtPlugin(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }

  // Capture beforeinstallprompt as early as possible — it can fire before
  // any Vue component mounts, so we store it on window for AppPwaInstall to read.
  window._pwaPrompt = null

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    window._pwaPrompt = e
    window.dispatchEvent(new CustomEvent('pwa-install-ready'))
  })

  window.addEventListener('appinstalled', () => {
    window._pwaPrompt = null
    try { localStorage.setItem('pwa_install_dismissed', '1') } catch {}
    window.dispatchEvent(new Event('pwa-installed'))
  })
})
