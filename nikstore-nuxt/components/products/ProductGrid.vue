<template>
  <div>
    <div v-if="pending" class="p-grid">
      <div v-for="i in skeletonCount" :key="i" class="p-skel" />
    </div>
    <div v-else-if="products.length" class="p-grid">
      <ProductCard
        v-for="p in products"
        :key="p._id || p.slug"
        :product="mapProduct(p)"
        :badge="badgeFor(p)"
        :thumb-height="150"
      />
    </div>
    <div v-else class="p-empty">
      <div class="p-empty__ico">
        <AppIcon name="bag" :size="28" :stroke-width="1.4" />
      </div>
      <p>{{ emptyText }}</p>
    </div>
  </div>
</template>

<script setup>
import AppIcon from '~/components/icons/AppIcon.vue'
import ProductCard from '~/components/ui/ProductCard.vue'
import { toPersianDigits } from '~/utils/format'

const props = defineProps({
  products: { type: Array, default: () => [] },
  pending: { type: Boolean, default: false },
  skeletonCount: { type: Number, default: 6 },
  emptyText: { type: String, default: 'محصولی یافت نشد' },
})

function mapProduct(p) {
  return {
    _id: p._id,
    slug: p.slug,
    name: p.name,
    price: p.finalPrice ?? p.minPrice ?? 0,
    image: p.thumbnail || p.images?.[0] || '',
  }
}

function badgeFor(p) {
  if (p.discountPercentage > 0) return `٪${toPersianDigits(p.discountPercentage)}`
  return null
}
</script>

<style scoped>
.p-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 0 18px;
}

.p-skel {
  height: 230px;
  border-radius: 18px;
  background: var(--glass);
  animation: pulse 1.6s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .6; }
}

.p-empty {
  margin: 40px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  color: var(--text-secondary);
  font-size: 12.5px;
}

.p-empty__ico {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  color: var(--text-disabled);
}
</style>
