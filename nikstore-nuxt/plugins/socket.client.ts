// Client-only placeholder: socket lifecycle is managed in app.vue
// This file ensures socket.io-client is bundled client-side only
export default defineNuxtPlugin(() => {
  // Socket connect/disconnect is handled reactively in app.vue
  // based on auth.isLoggedIn watcher
})
