<template>
  <div v-if="discount" class="discount-badge">
    <span class="percentage">{{ discount.percentage }}٪ تخفیف</span>
  </div>
</template>

<script setup>
defineProps({
  discount: { type: Object, default: null },
})
</script>

<style scoped>
.discount-badge {
  display: inline-flex;
  align-items: center;
  background: #ef4444;
  color: #fff;
  border-radius: 0.375rem;
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
}
</style>
