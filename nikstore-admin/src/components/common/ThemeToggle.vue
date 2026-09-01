<template>
  <button
    type="button"
    class="glass-toggle"
    :aria-label="mode === 'dark' ? 'روشن کردن حالت روز' : 'روشن کردن حالت شب'"
    :title="mode === 'dark' ? 'حالت روز' : 'حالت شب'"
    @click="toggle"
  >
    <!-- Sun — shown when dark is active, click to go light -->
    <svg v-if="mode === 'dark'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor" class="w-[18px] h-[18px]">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-6.364-.386 1.591-1.591M3 12h2.25m.386-6.364 1.591 1.591M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
    <!-- Moon — shown when light is active, click to go dark -->
    <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor" class="w-[18px] h-[18px]">
      <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
  </button>
</template>

<script setup>
import { useThemeMode } from '@/composables/useThemeMode'

const { mode, toggle } = useThemeMode()
</script>

<style scoped>
.glass-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  color: var(--text-secondary);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  transition: color 150ms ease, background-color 150ms ease, transform 150ms ease;
}
.glass-toggle:hover {
  color: var(--text-primary);
  background: var(--glass-strong);
}
.glass-toggle:active { transform: scale(0.94); }
</style>
