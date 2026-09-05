<template>
  <NuxtLoadingIndicator color="linear-gradient(90deg, #6EB082, #E7C878)" :height="2" />
  <ClientOnly>
    <AppSplash v-if="showSplash" @done="showSplash = false" />
  </ClientOnly>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
// data-theme drives every glass/color token in assets/styles/theme.css.
// useHead renders it server-side from the theme cookie so there is no
// flash-of-wrong-theme on first paint / before hydration.
const { mode } = useTheme()

useHead({
  htmlAttrs: {
    'data-theme': computed(() => mode.value),
  },
  titleTemplate: (title) => (title ? `${title} | نیک` : 'نیک | فروشگاه پوشاک'),
})

// Plays once per full page load (not on client-side route navigation,
// since app.vue only mounts once per session unless the page is reloaded).
const showSplash = ref(true)
</script>
