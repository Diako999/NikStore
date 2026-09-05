<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="mode === 'dark' ? 'فعال‌سازی حالت روشن' : 'فعال‌سازی حالت تاریک'"
    @click="toggle"
  >
    <AppIcon :name="mode === 'dark' ? 'sun' : 'moon'" :size="17" />
  </button>
</template>

<script setup>
import AppIcon from '../icons/AppIcon.vue'
import { useTheme } from '../../composables/useTheme'

const { mode, toggle } = useTheme()
</script>

<style scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  color: var(--text-primary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  cursor: pointer;
  transition: background .15s ease;
}
.theme-toggle:hover {
  background: var(--glass-strong);
}
</style>
