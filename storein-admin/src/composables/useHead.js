import { watchEffect } from 'vue'

function upsertFavicon(url) {
  if (!url) return
  let link = document.querySelector("link[rel~='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.href = url
}

/**
 * Reactively syncs site name + page title to document.title for the admin panel.
 * Format: "صفحه – نیک | پنل مدیریت"  or  "نیک | پنل مدیریت"
 *
 * @param {import('vue').Ref} settings — reactive settings ref from settingsStore
 * @param {import('vue').Ref<string>} [routeTitle] — optional current page title
 */
export function useAdminHead(settings, routeTitle) {
  watchEffect(() => {
    const s = settings.value
    const siteName = s?.siteName ?? 'نیک'
    const base = `${siteName} | پنل مدیریت`
    const page = routeTitle?.value
    document.title = page ? `${page} – ${base}` : base
    if (s?.faviconUrl) upsertFavicon(s.faviconUrl)
  })
}
