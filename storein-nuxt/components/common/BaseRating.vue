<template>
  <div class="inline-flex items-center gap-1.5">
    <div :class="['flex items-center', gapClass[size]]">
      <button
        v-for="i in 5"
        :key="i"
        type="button"
        :class="['leading-none transition-transform', readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110']"
        :disabled="readonly"
        @click="!readonly && $emit('update:modelValue', i)"
        @mouseover="!readonly && (hovered = i)"
        @mouseleave="!readonly && (hovered = 0)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          :class="[starSize[size], activeValue >= i ? 'text-yellow-400' : 'text-glass-text-disabled']"
          viewBox="0 0 24 24"
          :fill="activeValue >= i ? 'currentColor' : 'currentColor'"
          stroke="none"
        >
          <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
        </svg>
      </button>
    </div>
    <span v-if="showValue && modelValue" :class="['font-semibold text-glass-text-secondary', valueSize[size]]">
      {{ modelValue.toFixed(1) }}
    </span>
    <span v-if="count !== undefined" :class="['text-glass-text-secondary', countSize[size]]">
      ({{ formatNumber(count) }})
    </span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatNumber } from '~/utils/formatters'

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  readonly:   { type: Boolean, default: false },
  size:       { type: String, default: 'md' },
  showValue:  { type: Boolean, default: false },
  count:      { type: Number, default: undefined },
})

defineEmits(['update:modelValue'])

const hovered = ref(0)

const activeValue = computed(() => hovered.value || Math.round(props.modelValue))

const starSize  = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-6 h-6' }
const gapClass  = { sm: 'gap-0.5', md: 'gap-0.5', lg: 'gap-1' }
const valueSize = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }
const countSize = { sm: 'text-xs', md: 'text-xs', lg: 'text-sm' }
</script>
