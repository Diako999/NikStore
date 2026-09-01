<template>
  <span :class="['badge', variantClass[variant] || variantClass.gray, size === 'sm' ? 'text-xs px-1.5 py-0.5' : '']">
    <span v-if="dot" :class="['w-1.5 h-1.5 rounded-full inline-block me-1 shrink-0', dotClass[variant] || dotClass.gray]" />
    <slot />
  </span>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'gray' },
  size:    { type: String, default: 'md' },
  dot:     { type: Boolean, default: false },
})

const variantClass = {
  red:    'badge-red',
  green:  'badge-green',
  yellow: 'badge-yellow',
  blue:   'badge-blue',
  navy:   'badge-navy',
  // Token-based (not hardcoded gray-100/600) so it reads on both themes —
  // bg-glass resolves to a translucent white in both dark and light modes.
  gray:   'bg-glass text-glass-text-secondary',
}

const dotClass = {
  red:    'bg-red-500',
  green:  'bg-green-500',
  yellow: 'bg-yellow-500',
  blue:   'bg-blue-500',
  navy:   'bg-brand',
  gray:   'bg-gray-400',
}
</script>
