<template>
  <Transition name="fade">
    <div
      v-if="activeChips.length > 0"
      class="flex items-center gap-2 flex-wrap py-2 mb-3"
    >
      <span class="text-text-secondary text-sm flex-shrink-0">فیلترهای فعال:</span>

      <TransitionGroup name="chip" tag="div" class="flex flex-wrap gap-2">
        <span
          v-for="chip in activeChips"
          :key="chip.key + '-' + chip.value"
          class="inline-flex items-center gap-1.5 bg-brand/10 text-brand
                 px-3 py-1 rounded-full text-xs font-medium
                 border border-brand/20"
        >
          {{ chip.label }}
          <button
            @click="$emit('remove', chip.key, chip.value)"
            class="hover:text-brand-dark transition-colors flex-shrink-0"
            :aria-label="'حذف ' + chip.label"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor"
                 stroke-width="3" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </span>
      </TransitionGroup>

      <button
        v-if="activeChips.length > 1"
        @click="$emit('clear-all')"
        class="text-error text-xs hover:underline flex-shrink-0 mr-1"
      >
        حذف همه
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { GENDER_OPTIONS, EYEWEAR_CATEGORIES } from '~/utils/constants'
import { formatNumber } from '~/utils/formatters'

const props = defineProps({
  filters: { type: Object, required: true },
})
defineEmits(['remove', 'clear-all'])

const activeChips = computed(() => {
  const chips = []
  const f = props.filters

  // Category
  if (f.category) {
    const cat = EYEWEAR_CATEGORIES.find(c => c.slug === f.category)
    chips.push({ key: 'category', value: f.category, label: cat?.label || f.category })
  }

  // Genders
  for (const v of (f.genders || [])) {
    const opt = GENDER_OPTIONS.find(o => o.value === v)
    chips.push({ key: 'genders', value: v, label: opt?.label || v })
  }

  // Price range
  if (f.minPrice) {
    chips.push({ key: 'minPrice', value: f.minPrice, label: `از: ${formatNumber(f.minPrice)} تومان` })
  }
  if (f.maxPrice) {
    chips.push({ key: 'maxPrice', value: f.maxPrice, label: `تا: ${formatNumber(f.maxPrice)} تومان` })
  }

  // In stock
  if (f.inStock) {
    chips.push({ key: 'inStock', value: true, label: 'فقط موجود' })
  }

  return chips
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.chip-enter-active,
.chip-leave-active {
  transition: all 0.2s ease;
}
.chip-enter-from,
.chip-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
.chip-move {
  transition: transform 0.2s ease;
}
</style>
