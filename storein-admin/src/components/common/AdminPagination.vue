<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center gap-1 mt-6 flex-wrap">

    <!-- Prev -->
    <button
      @click="changePage(modelValue - 1)"
      :disabled="modelValue <= 1 || loading"
      class="w-9 h-9 flex items-center justify-center rounded-lg border border-border
             text-text-secondary hover:border-primary hover:text-primary
             disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
      </svg>
    </button>

    <!-- Pages -->
    <template v-for="p in pages" :key="p">
      <span v-if="p === '...'" class="w-9 h-9 flex items-center justify-center text-text-disabled text-sm">
        …
      </span>
      <button v-else
        @click="changePage(p)"
        :class="[
          'w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors font-fanum',
          p === modelValue
            ? 'bg-primary text-white border border-primary'
            : 'border border-border text-text-secondary hover:border-primary hover:text-primary',
        ]"
      >
        {{ p }}
      </button>
    </template>

    <!-- Next -->
    <button
      @click="changePage(modelValue + 1)"
      :disabled="modelValue >= totalPages || loading"
      class="w-9 h-9 flex items-center justify-center rounded-lg border border-border
             text-text-secondary hover:border-primary hover:text-primary
             disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" d="M15 19l-7-7 7-7"/>
      </svg>
    </button>

  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
  loading:    { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

function changePage(p) {
  if (p < 1 || p > props.totalPages || props.loading) return
  emit('update:modelValue', p)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const pages = computed(() => {
  const total   = props.totalPages
  const current = props.modelValue
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const result = []
  result.push(1)
  if (current > 3)         result.push('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    result.push(i)
  }
  if (current < total - 2) result.push('...')
  result.push(total)
  return result
})
</script>
