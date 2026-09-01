import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    mainFields: ['browser', 'module', 'main', 'jsnext:main', 'jsnext'],
  },
  server: {
    port: 4000,
    proxy: {
      // Forward /uploads/* to the backend so <img src="/uploads/..."> works in dev.
      // Adjust the target port to match your local backend PORT.
      '/uploads': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
})
