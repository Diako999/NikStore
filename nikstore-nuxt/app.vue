<template>
  <NuxtLoadingIndicator color="linear-gradient(90deg, #6EB082, #E7C878)" :height="2" />
  <AppSplash v-if="showSplash" @done="showSplash = false" />
  <ThemeToggle v-if="route.path !== '/'" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
import ThemeToggle from '~/components/ui/ThemeToggle.vue'

const route = useRoute()

// data-theme drives every glass/color token in assets/styles/theme.css.
// useHead renders it server-side from the theme cookie so there is no
// flash-of-wrong-theme on first paint / before hydration.
const { mode } = useTheme()

useHead({
  // Runs before first paint: decides whether the splash plays at all (first visit of the
  // session, home page only, not for reduced-motion users) so there is no flash of it.
  script: [{
    innerHTML: "try{if(sessionStorage.getItem('nik-splash')||location.pathname!=='/'||matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('no-splash')}catch(e){document.documentElement.classList.add('no-splash')}",
  }],
  htmlAttrs: {
    'data-theme': computed(() => mode.value),
  },
  titleTemplate: (title) => (title ? `${title} | نیک` : 'نیک | فروشگاه پوشاک'),
})

// Whether it actually plays is decided before paint (see the inline script in useHead above).
// It mounts once per full page load (not on client-side route navigation,
// since app.vue only mounts once per session unless the page is reloaded).
const showSplash = ref(true)
</script>
