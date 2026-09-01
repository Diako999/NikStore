<template>
  <span
    :class="['inline-block rounded-full border-2 animate-spin', sizes[size], colors[color]]"
    aria-label="در حال بارگذاری"
  />
</template>

<script setup>
defineProps({
  size:  { type: String, default: 'md' },
  color: { type: String, default: 'brand' },
})

const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
const colors = {
  brand: 'border-brand border-t-transparent',
  white: 'border-white border-t-transparent',
  gray:  'border-gray-300 border-t-transparent',
}
</script>
