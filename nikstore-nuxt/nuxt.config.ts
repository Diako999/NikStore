export default defineNuxtConfig({
  devtools: { enabled: true },

  devServer: {
    port: 3005,
  },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
  ],

  // CSS is injected by @nuxtjs/tailwindcss via cssPath below (avoids duplicate @tailwind directives)

  runtimeConfig: {
    apiInternalUrl: process.env.API_INTERNAL_URL || 'http://localhost:3001',
    public: {
      siteUrl:    process.env.NUXT_PUBLIC_SITE_URL || 'https://nikstore.ir',
      apiBaseUrl: '/api/v1',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fa', dir: 'rtl' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      meta: [
        { name: 'theme-color',      content: '#171717' },
        { name: 'application-name', content: 'نیک' },
        { name: 'format-detection', content: 'telephone=no' },
        { property: 'og:site_name', content: 'نیک' },
        { property: 'og:locale',    content: 'fa_IR' },
      ],
      link: [
        { rel: 'icon',      href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'manifest',  href: '/site.webmanifest' },
        { rel: 'alternate', hreflang: 'fa-IR', href: 'https://nikstore.ir/' },
      ],
    },
  },

  nitro: {
    routeRules: {
      '/**': {
        headers: {
          'X-Content-Type-Options':    'nosniff',
          'X-Frame-Options':           'SAMEORIGIN',
          'Referrer-Policy':           'strict-origin-when-cross-origin',
          'Permissions-Policy':        'camera=(), microphone=(), geolocation=()',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        },
      },
    },
  },

  // Hybrid rendering: SSR for public pages, CSR for private pages
  // Note: /api, /uploads, /socket.io are proxied via server/middleware/proxy.ts
  // using useRuntimeConfig() so the backend URL is read at runtime, not build time.
  routeRules: {
    '/':            { swr: 60 },
    '/products':    { swr: 60 },
    '/category/**': { swr: 60 },
    '/product/**':  { swr: 300 },
    '/blog':        { swr: 300 },
    '/blog/**':     { swr: 3600 },
    '/pages/**':    { swr: 3600 },
    '/search':      { ssr: false },

    // Private pages — CSR only
    '/auth/**':    { ssr: false },
    '/cart':       { ssr: false },
    '/checkout':   { ssr: false },
    '/payment/**': { ssr: false },
    '/user/**':    { ssr: false },
  },

  tailwindcss: {
    configPath: '~/tailwind.config.js',
    cssPath: '~/assets/styles/main.css',
  },

  pinia: {
    storesDirs: ['./stores/**'],
  },

  compatibilityDate: '2025-01-01',
})
