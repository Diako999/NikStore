<template>
  <GlassCard padding="sm" radius="20px" class="!p-0">

    <!-- Tab bar -->
    <div class="flex border-b border-glass-border overflow-x-auto scrollbar-hide">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        :class="[
          'flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-all duration-150 border-b-2 -mb-px',
          activeTab === tab.key
            ? 'border-brand text-brand'
            : 'border-transparent text-glass-text-secondary hover:text-glass-text-primary',
        ]"
      >
        {{ tab.label }}
        <BaseBadge v-if="tab.count" variant="navy" size="sm" class="font-fanum">
          {{ tab.count }}
        </BaseBadge>
      </button>
    </div>

    <!-- Tab content -->
    <div class="p-6">
      <Transition name="tab-fade" mode="out-in">

        <ProductSpecs
          v-if="activeTab === 'specs'"
          :product="product"
          key="specs"
        />

        <div
          v-else-if="activeTab === 'desc'"
          key="desc"
          class="prose prose-sm max-w-none text-glass-text-primary leading-8 text-sm"
        >
          <p v-if="product?.description" v-html="product.description" />
          <p v-else class="text-glass-text-secondary text-center py-8">
            توضیحاتی برای این محصول ثبت نشده است
          </p>
        </div>

        <ProductReviews
          v-else-if="activeTab === 'reviews'"
          :product-id="product?._id"
          :stats="reviewStats"
          :loading="reviewsLoading"
          key="reviews"
        />

      </Transition>
    </div>
  </GlassCard>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseBadge      from '~/components/common/BaseBadge.vue'
import GlassCard       from '~/components/glass/GlassCard.vue'
import ProductSpecs   from './ProductSpecs.vue'
import ProductReviews from './ProductReviews.vue'

const props = defineProps({
  product:        { type: Object,  default: null },
  reviewStats:    { type: Object,  default: null },
  reviewsLoading: { type: Boolean, default: false },
})

const activeTab = ref('specs')

const tabs = computed(() => [
  { key: 'specs',   label: 'مشخصات فنی' },
  { key: 'desc',    label: 'توضیحات' },
  { key: 'reviews', label: 'نظرات', count: props.reviewStats?.reviewCount || 0 },
])
</script>

<style scoped>
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.2s ease;
}
.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
}
</style>
