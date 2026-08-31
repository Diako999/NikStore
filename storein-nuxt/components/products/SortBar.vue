<template>
  <GlassCard
    padding="sm"
    radius="16px"
    class="mb-4 flex items-center justify-between gap-4 flex-wrap"
  >

    <!-- Desktop: inline sort buttons -->
    <div class="hidden lg:flex items-center gap-1 flex-wrap">
      <span class="text-glass-text-secondary text-sm ml-3 flex-shrink-0">مرتب‌سازی:</span>
      <button
        v-for="opt in SORT_OPTIONS"
        :key="opt.value"
        @click="$emit('update:modelValue', opt.value)"
        :class="[
          'px-3 py-1.5 rounded-lg text-sm transition-all duration-150',
          modelValue === opt.value
            ? 'bg-brand text-white font-medium'
            : 'text-glass-text-secondary hover:bg-glass',
        ]"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- Mobile: filter button + sort select -->
    <div class="flex lg:hidden items-center gap-2">
      <button
        @click="$emit('open-filter')"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
               border border-glass-border text-sm text-glass-text-primary
               hover:border-brand hover:text-brand transition-colors"
      >
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor"
             stroke-width="1.8" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
        </svg>
        فیلتر
      </button>
      <select
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
        class="px-3 py-1.5 rounded-lg border border-glass-border
               text-sm text-glass-text-primary outline-none
               focus:border-brand focus:ring-1 focus:ring-brand/20
               cursor-pointer"
        style="background-color: var(--glass-strong);"
      >
        <option
          v-for="opt in SORT_OPTIONS"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- Product count (always right side) -->
    <div class="text-glass-text-secondary text-sm font-fanum whitespace-nowrap mr-auto lg:mr-0">
      <template v-if="loading">
        <div class="inline-block w-20 h-5 skeleton rounded" />
      </template>
      <template v-else>
        <span class="text-glass-text-primary font-bold">{{ formatNumber(total) }}</span>
        کالا
      </template>
    </div>

  </GlassCard>
</template>

<script setup>
import GlassCard from '~/components/glass/GlassCard.vue'
import { SORT_OPTIONS } from '~/utils/constants'
import { formatNumber } from '~/utils/formatters'

defineProps({
  modelValue: { type: String,  default: 'newest' },
  total:      { type: Number,  default: 0 },
  loading:    { type: Boolean, default: false },
})
defineEmits(['update:modelValue', 'open-filter'])
</script>
