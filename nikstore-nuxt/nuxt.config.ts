export default defineNuxtConfig({
  devtools: { enabled: true },

  devServer: {
    port: 3005,
  },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
  ],

  runtimeConfig: {
    apiInternalUrl: process.env.API_INTERNAL_URL || 'http://localhost:3001',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://nikstore.ir',
      apiBaseUrl: '/api/v1',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fa', dir: 'rtl' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      meta: [
        { name: 'theme-color', content: '#0B1310' },
        { name: 'application-name', content: 'نیک' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
      link: [
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      ],
    },
  },

  // Hybrid rendering: public pages use SWR, private/CSR-only routes listed
  // for when they exist — /api, /uploads, /socket.io are proxied at request
  // time via server/middleware/proxy.ts, not baked in here.
  routeRules: {
    '/': { swr: 60 },
    '/products': { swr: 60 },
    '/category/**': { swr: 60 },
    '/product/**': { swr: 60 },
    '/blog/**': { swr: 60 },
    '/pages/**': { swr: 60 },
    '/search': { ssr: false },
    '/auth/**': { ssr: false },
    '/cart': { ssr: false },
    '/checkout': { ssr: false },
    '/payment/**': { ssr: false },
    '/user/**': { ssr: false },
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
