<template>
  <div class="cat-grid">
    <CategoryTile
      v-for="cat in categories"
      :key="cat.key || cat._id"
      :icon="cat.icon"
      :label="cat.label"
      :sub="cat.sub"
      :to="cat.to"
    />
  </div>
</template>

<script setup>
import CategoryTile from './CategoryTile.vue'

defineProps({
  categories: { type: Array, required: true },
})
</script>

<style scoped>
.cat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 0 18px;
}
</style>
