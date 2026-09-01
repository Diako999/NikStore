<template>
  <AppSplash :ready="uiStore.appReady" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import AppSplash from '~/components/AppSplash.vue'

const settingsStore = useSettingsStore()
const auth          = useAuthStore()
const notifStore    = useNotificationStore()
const uiStore       = useUiStore()
const { theme }     = storeToRefs(settingsStore)

// ── Global SEO defaults (overridden per-page via useSeoMeta) ─────
useSeoMeta({
  ogSiteName:    () => settingsStore.siteName,
  description:   () => settingsStore.description,
  ogDescription: () => settingsStore.description,
  ogImage: () => {
    const img = settingsStore.ogImage
    if (!img) return undefined
    return img.startsWith('http') ? img : `${siteUrl}${img}`
  },
  ogLocale:      'fa_IR',
  twitterCard:   'summary_large_image',
})

useHead({
  titleTemplate: (t) => {
    const site = settingsStore.siteName || 'نیک'
    return t ? `${t} | ${site}` : site
  },
  link: [
    { rel: 'icon', href: () => settingsStore.faviconUrl || '/favicon.svg' },
  ],
})

// ── Organization + WebSite JSON-LD ───────────────────────────────
const config  = useRuntimeConfig()
const siteUrl = config.public.siteUrl

const organizationSchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type':    'Organization',
  name:       settingsStore.siteName,
  url:        siteUrl,
  ...(settingsStore.logoUrl ? { logo: settingsStore.logoUrl.startsWith('http') ? settingsStore.logoUrl : `${siteUrl}${settingsStore.logoUrl}` } : {}),
  ...(settingsStore.phone ? {
    contactPoint: [{ '@type': 'ContactPoint', telephone: settingsStore.phone, contactType: 'customer service', areaServed: 'IR', availableLanguage: 'Persian' }],
  } : {}),
  sameAs: [
    settingsStore.social?.instagram ? `https://instagram.com/${settingsStore.social.instagram}` : null,
    settingsStore.social?.telegram  ? `https://t.me/${settingsStore.social.telegram}`           : null,
  ].filter(Boolean),
}))

const websiteSchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type':    'WebSite',
  name:       settingsStore.siteName,
  url:        siteUrl,
  potentialAction: {
    '@type':       'SearchAction',
    target:        `${siteUrl}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}))

useHead({
  script: [
    { type: 'application/ld+json', innerHTML: computed(() => settingsStore.siteName ? JSON.stringify(organizationSchema.value) : ''), key: 'jsonld-org' },
    { type: 'application/ld+json', innerHTML: computed(() => JSON.stringify(websiteSchema.value)), key: 'jsonld-web' },
  ],
})

// ── Theme ─────────────────────────────────────────────────────────
if (import.meta.client) {
  const { applyFromSettings } = useTheme()
  watch(theme, (t) => { if (t) applyFromSettings(t) }, { immediate: true })
}

// ── Dark/light mode — reflected as data-theme on <html> for SSR-safe,
// no-flash rendering (see composables/useThemeMode.js) ──────────────
const { mode: themeMode } = useThemeMode()
useHead({
  htmlAttrs: { 'data-theme': computed(() => themeMode.value) },
})

// ── Settings fetch ───────────────────────────────────────────────
onMounted(() => settingsStore.fetchSettings())

// ── Splash gate ───────────────────────────────────────────────────
// Normal path: wait for auth init + settings fetch + a minimum splash
// duration, then dismiss. Both settingsStore.fetchSettings() and
// auth.initAuth() (plugins/auth.client.ts) already swallow their own
// errors, so this shouldn't hang — but if anything upstream ever does
// stall (a slow/hanging request, a route whose extra onMounted work
// throws before this watch's chain resolves, etc.), the splash must
// never stay stuck forever blocking the whole page's clicks. The
// safety-net timeout below guarantees a dismissal no matter what.
if (import.meta.client) {
  setTimeout(() => uiStore.markAppReady(), 6000)
}

watch(
  () => auth.initialized,
  async (initialized) => {
    if (!initialized) return
    await Promise.all([
      settingsStore.fetchSettings(),
      new Promise((r) => setTimeout(r, 1600)),
    ])
    uiStore.markAppReady()
  },
  { immediate: true },
)

// ── Session expiry handler ────────────────────────────────────────
if (import.meta.client) {
  window.addEventListener('nikstore:session-expired', () => {
    navigateTo('/auth/login')
  })
}

// ── Socket + Notifications ────────────────────────────────────────
if (import.meta.client) {
  let socketService = null

  async function initSocket() {
    const mod = await import('~/services/socket.service')
    socketService = mod.socketService
  }

  function onNotification(notif) {
    notifStore.addIncoming(notif)
    uiStore.addToast(`${notif.title}: ${notif.body}`, 'info', 5000)
  }

  onMounted(async () => {
    await initSocket()

    watch(
      () => auth.isLoggedIn,
      (loggedIn) => {
        if (loggedIn && auth.token && socketService) {
          socketService.connect(() => auth.token)
          socketService.on('notification', onNotification)
          notifStore.fetchUnreadCount()
        } else if (socketService) {
          socketService.off('notification', onNotification)
          socketService.disconnect()
          notifStore.reset()
        }
      },
      { immediate: true },
    )
  })

  onUnmounted(() => {
    socketService?.off('notification', onNotification)
  })
}
</script>
