<template>
  <div
    :class="['animate-pulse', circle ? 'rounded-full' : 'rounded-lg']"
    :style="{ width, height, backgroundColor: 'var(--skeleton-bg)' }"
  />
</template>

<script setup>
defineProps({
  width:  { type: String, default: '100%' },
  height: { type: String, default: '1rem' },
  circle: { type: Boolean, default: false },
})
</script>
