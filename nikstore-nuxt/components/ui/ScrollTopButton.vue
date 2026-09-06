<template>
  <Transition name="scrolltop">
    <button
      v-if="visible"
      type="button"
      class="scrolltop"
      aria-label="برو به بالای صفحه"
      @click="scrollToTop"
    >
      <AppIcon name="chevron-up" :size="20" />
    </button>
  </Transition>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import AppIcon from '~/components/icons/AppIcon.vue'

const SHOW_AFTER_PX = 400

const visible = ref(false)
let ticking = false

function onScroll() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    visible.value = window.scrollY > SHOW_AFTER_PX
    ticking = false
  })
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
.scrolltop {
  position: fixed;
  inset-inline-end: 16px;
  bottom: 118px;
  z-index: 45;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--text-primary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  box-shadow: 0 6px 20px rgba(0, 0, 0, .18);
  cursor: pointer;
}

.scrolltop-enter-active,
.scrolltop-leave-active {
  transition: opacity .25s ease, transform .25s ease;
}
.scrolltop-enter-from,
.scrolltop-leave-to {
  opacity: 0;
  transform: translateY(24px);
}
</style>
