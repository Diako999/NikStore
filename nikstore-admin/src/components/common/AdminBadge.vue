<template>
  <span :class="['status-badge', variantClasses, sizeClass]">
    <slot />
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'gray' },
  size:    { type: String, default: 'md' },
})

const variantClasses = computed(() => ({
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  error:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  gray:    'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300',
  navy:    'bg-primary/10 text-primary',
}[props.variant] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300'))

const sizeClass = computed(() =>
  props.size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
)
</script>
