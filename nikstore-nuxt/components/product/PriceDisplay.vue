<template>
  <div class="price-display">
    <span v-if="hasDiscount" class="original-price line-through text-gray-400">
      {{ formatPrice(originalPrice) }} تومان
    </span>
    <span class="final-price text-red-600 font-bold text-xl font-fanum">
      {{ formatPrice(finalPrice) }} تومان
    </span>
    <span v-if="hasDiscount" class="saving text-green-600 text-sm font-fanum">
      {{ formatPrice(discountAmount) }} تومان سود کردید
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatPrice } from '~/utils/formatters'

const props = defineProps({
  originalPrice:  { type: Number, default: 0 },
  finalPrice:     { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
})

const hasDiscount = computed(() => props.discountAmount > 0)
</script>

<style scoped>
.price-display { display: flex; flex-direction: column; gap: 0.25rem; }
.original-price { font-size: 0.9rem; }
.saving { display: block; }
</style>
