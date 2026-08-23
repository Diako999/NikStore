<template>
  <button
    type="button"
    :class="[
      'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-colors duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
      sizeClasses[size] || sizeClasses.md,
      variantClasses[variant] || variantClasses.primary,
      block ? 'w-full' : '',
      disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
    ]"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    v-bind="$attrs"
    @click="$emit('click', $event)"
  >
    <BaseSpinner v-if="loading" size="sm" :color="variant === 'primary' || variant === 'danger' ? 'white' : 'brand'" />
    <slot />
  </button>
</template>

<script setup>
import BaseSpinner from './BaseSpinner.vue'

defineProps({
  variant:  { type: String, default: 'primary' },
  size:     { type: String, default: 'md' },
  loading:  { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  block:    { type: Boolean, default: false },
})

defineEmits(['click'])

const variantClasses = {
  primary:   'bg-brand text-white hover:bg-brand-dark',
  outline:   'border border-brand text-brand hover:bg-brand hover:text-white',
  ghost:     'text-text-secondary hover:bg-surface-border',
  danger:    'bg-error text-white hover:bg-red-700',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg',
}
</script>
