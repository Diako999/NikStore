<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="mode === 'dark' ? 'تغییر به حالت روشن' : 'تغییر به حالت تیره'"
    @click="toggle"
  >
    <Transition name="theme-toggle__swap" mode="out-in">
      <AppIcon :key="mode" :name="mode === 'dark' ? 'sun' : 'moon'" :size="17" :stroke-width="2" />
    </Transition>
  </button>
</template>

<script setup>
import AppIcon from '~/components/icons/AppIcon.vue'

const { mode, toggle } = useTheme()
</script>

<style scoped>
.theme-toggle {
  position: fixed;
  top: max(14px, env(safe-area-inset-top));
  inset-inline-end: 14px;
  z-index: 60;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  cursor: pointer;
}
[data-theme='light'] .theme-toggle {
  box-shadow: var(--glass-shadow);
}

.theme-toggle__swap-enter-active,
.theme-toggle__swap-leave-active {
  transition: opacity .2s ease, transform .2s ease;
}
.theme-toggle__swap-enter-from {
  opacity: 0;
  transform: rotate(-45deg) scale(.6);
}
.theme-toggle__swap-leave-to {
  opacity: 0;
  transform: rotate(45deg) scale(.6);
}
</style>
