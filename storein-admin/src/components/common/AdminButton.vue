<template>
  <button
    @click="$emit('click', $event)"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-2 font-medium rounded-lg',
      'transition-all duration-150 select-none',
      sizeClasses,
      variantClasses,
      block ? 'w-full' : '',
      (disabled || loading) ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
    ]"
  >
    <svg v-if="loading" class="animate-spin w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant:  { type: String, default: 'primary' },
  size:     { type: String, default: 'md' },
  loading:  { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  block:    { type: Boolean, default: false },
})
defineEmits(['click'])

const sizeClasses = computed(() => ({
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
}[props.size] ?? 'px-4 py-2 text-sm'))

const variantClasses = computed(() => ({
  primary:   'bg-primary text-white hover:bg-primary-dark active:scale-[0.98]',
  secondary: 'bg-surface text-text-primary border border-border hover:bg-border',
  danger:    'bg-error text-white hover:bg-red-600 active:scale-[0.98]',
  ghost:     'text-text-secondary hover:bg-surface hover:text-text-primary',
}[props.variant] ?? ''))
</script>
