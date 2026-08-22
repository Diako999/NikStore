// Nuxt version: wraps built-in useHead() for global title template + favicon
import { watchEffect } from 'vue'
import { useSettingsStore } from '~/stores/settings.store'

export function useSiteHead() {
  const settings = useSettingsStore()

  // Favicon: update dynamically when settings load
  if (import.meta.client) {
    watchEffect(() => {
      const url = settings.faviconUrl
      if (!url) return
      let link = document.querySelector("link[rel~='icon']")
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = url
    })
  }

  useHead({
    titleTemplate: (title) => {
      const site = settings.siteName || 'نیک'
      return title ? `${title} | ${site}` : site
    },
  })
}
