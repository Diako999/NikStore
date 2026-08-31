<template>
  <div v-if="totalPages > 1"
       class="flex items-center justify-center gap-1 py-6 font-fanum">

    <!-- Prev: in RTL layout, chevron-right is the "back" arrow -->
    <button
      @click="changePage(modelValue - 1)"
      :disabled="modelValue === 1 || loading"
      class="w-9 h-9 rounded-lg flex items-center justify-center
             border border-glass-border text-glass-text-secondary
             hover:border-brand hover:text-brand
             disabled:opacity-30 disabled:cursor-not-allowed
             transition-colors duration-150"
      aria-label="صفحه قبل"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor"
           stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
      </svg>
    </button>

    <!-- Page buttons -->
    <template v-for="p in visiblePages" :key="String(p) + p">
      <span
        v-if="p === '...'"
        class="w-9 h-9 flex items-center justify-center
               text-glass-text-disabled text-sm select-none"
      >
        …
      </span>
      <button
        v-else
        @click="changePage(p)"
        :class="[
          'w-9 h-9 rounded-lg text-sm font-medium transition-all duration-150',
          p === modelValue
            ? 'bg-brand text-white shadow-sm'
            : 'border border-glass-border text-glass-text-secondary hover:border-brand hover:text-brand',
        ]"
        :aria-current="p === modelValue ? 'page' : undefined"
      >
        {{ p }}
      </button>
    </template>

    <!-- Next: chevron-left is "forward" in RTL -->
    <button
      @click="changePage(modelValue + 1)"
      :disabled="modelValue === totalPages || loading"
      class="w-9 h-9 rounded-lg flex items-center justify-center
             border border-glass-border text-glass-text-secondary
             hover:border-brand hover:text-brand
             disabled:opacity-30 disabled:cursor-not-allowed
             transition-colors duration-150"
      aria-label="صفحه بعد"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor"
           stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  loading:    { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const visiblePages = computed(() => {
  const { totalPages, modelValue: current } = props
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

  const pages = []
  pages.push(1)
  if (current > 4) pages.push('...')
  for (let i = Math.max(2, current - 2); i <= Math.min(totalPages - 1, current + 2); i++) {
    pages.push(i)
  }
  if (current < totalPages - 3) pages.push('...')
  pages.push(totalPages)
  return pages
})

function changePage(p) {
  if (p < 1 || p > props.totalPages || p === props.modelValue || props.loading) return
  emit('update:modelValue', p)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>
