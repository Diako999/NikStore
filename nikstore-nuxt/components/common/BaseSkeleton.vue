<template>
  <div v-if="rows <= 1"
    :class="['skeleton', circle ? 'rounded-full' : 'rounded']"
    :style="{ width, height }"
  />
  <div v-else class="space-y-2">
    <div
      v-for="i in rows"
      :key="i"
      :class="['skeleton', circle ? 'rounded-full' : 'rounded']"
      :style="{ width, height }"
    />
  </div>
</template>

<script setup>
defineProps({
  width:  { type: String, default: '100%' },
  height: { type: String, default: '1rem' },
  circle: { type: Boolean, default: false },
  rows:   { type: Number, default: 1 },
})
</script>
