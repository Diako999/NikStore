<template>
  <div class="route-bar" :class="{ 'route-bar--active': isLoading }">
    <div class="route-bar__fill" />
  </div>
</template>

<script setup>
import { useRouteLoading } from '../composables/useRouteLoading'

const { isLoading } = useRouteLoading()
</script>

<style scoped>
.route-bar {
  position: fixed;
  top: 0;
  inset-inline: 0;
  z-index: 1000;
  height: 2px;
  overflow: hidden;
  opacity: 0;
  transition: opacity .15s ease;
  pointer-events: none;
}
.route-bar--active {
  opacity: 1;
}
.route-bar__fill {
  height: 100%;
  width: 40%;
  background: linear-gradient(90deg, #6EB082, #E7C878);
  animation: route-bar-sweep 0.9s ease-in-out infinite;
}
@keyframes route-bar-sweep {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}
</style>
