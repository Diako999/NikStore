<template>
  <AppSplash v-if="showSplash" @done="showSplash = false" />
  <RouteLoadingBar />
  <router-view />
</template>

<script setup>
import { ref } from 'vue'
import { useTheme } from './composables/useTheme'
import AppSplash from './components/AppSplash.vue'
import RouteLoadingBar from './components/RouteLoadingBar.vue'

// Touching the composable here (rather than only inside ThemeToggle) makes
// sure the data-theme attribute is applied on first paint regardless of
// which page mounts first.
useTheme()

const showSplash = ref(true)
</script>
