<template>
  <div class="min-h-screen flex flex-col">
    <header class="h-16 flex items-center justify-center border-b border-glass-border shrink-0 bg-glass backdrop-blur-md">
      <NuxtLink to="/" class="flex flex-col items-center leading-tight">
        <span class="text-glass-brand font-bold text-xl">{{ settingsStore.siteName }}</span>
        <span class="text-glass-text-secondary text-xs">{{ settingsStore.tagline }}</span>
      </NuxtLink>
    </header>

    <main class="flex-1 flex items-center justify-center px-4 py-8">
      <slot />
    </main>

    <BaseToast />
  </div>
</template>

<script setup>
import BaseToast from '~/components/common/BaseToast.vue'
const settingsStore = useSettingsStore()
</script>
