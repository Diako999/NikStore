<template>
  <!-- Skeleton -->
  <div v-if="loading" class="rounded-2xl shadow-card overflow-hidden bg-card">
    <BaseSkeleton height="200px" class="rounded-none" />
    <div class="p-4 space-y-3">
      <BaseSkeleton height="1.1rem" />
      <BaseSkeleton height="1.1rem" width="70%" />
      <BaseSkeleton height="0.85rem" width="45%" />
      <BaseSkeleton height="2.5rem" class="mt-3" />
    </div>
  </div>

  <!-- Product card -->
  <article
    v-else
    class="rounded-2xl shadow-card overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col h-full bg-card"
    @click="handleClick"
    @keydown.enter.prevent="handleClick"
    @keydown.space.prevent="handleClick"
    tabindex="0"
    role="link"
    :aria-label="product.name"
  >
    <!-- Image area -->
    <div
      class="aspect-square relative shrink-0 overflow-hidden"
      :class="featured ? 'bg-white' : 'p-3 bg-card'"
    >

      <!-- Wishlist: top-end (physically left in RTL) -->
      <button
        type="button"
        class="absolute top-2.5 end-2.5 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/90 shadow-sm hover:scale-110 transition-transform duration-150"
        @click.stop="$emit('toggle-wish')"
        :aria-label="wishlist ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'"
        :aria-pressed="wishlist"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
          :fill="wishlist ? 'currentColor' : 'none'"
          stroke="currentColor" stroke-width="1.8"
          :class="['w-4 h-4', wishlist ? 'text-red-500' : 'text-gray-400']"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
        </svg>
      </button>

      <!-- Discount + New badges: top-start (physically right in RTL) -->
      <div class="absolute top-2.5 start-2.5 z-10 flex flex-col gap-1">
        <BaseBadge v-if="discount > 0" variant="red" size="sm">{{ discount }}%</BaseBadge>
        <BaseBadge v-if="product.isNew" variant="navy" size="sm">جدید</BaseBadge>
      </div>

      <img
        :src="imgSrc"
        :alt="product.name"
        class="w-full h-full object-contain"
        loading="lazy"
        @error="imgError = true"
      />

      <!-- Color variant labels: bottom-start (right in RTL) — only in featured mode -->
      <div v-if="featured && colorVariants.length" class="absolute bottom-2 start-2 z-10 flex flex-col gap-1 items-start">
        <span
          v-for="color in colorVariants.slice(0, 3)"
          :key="color"
          class="text-[11px] font-bold px-2 py-0.5 rounded-full text-white leading-tight"
          style="background: rgba(0,0,0,0.65); backdrop-filter: blur(4px);"
        >
          {{ color }}
        </span>
      </div>

      <!-- Out of stock overlay -->
      <div v-if="product.totalStock === 0" class="absolute inset-0 bg-white/75 flex items-center justify-center" aria-hidden="true">
        <span class="text-gray-700 font-semibold text-sm px-3 py-1.5 bg-white rounded-full shadow-sm">ناموجود</span>
      </div>
    </div>

    <!-- Body -->
    <div class="p-4 flex flex-col gap-2 flex-1">

      <!-- Name -->
      <h3 class="text-sm font-bold text-text-primary line-clamp-2 leading-relaxed" style="min-height: 2.75rem">
        {{ product.name }}
      </h3>

      <!-- Rating -->
      <BaseRating
        v-if="product.avgRating"
        :model-value="product.avgRating"
        :count="product.reviewCount"
        readonly
        size="sm"
        show-value
      />

      <!-- Price block -->
      <div class="mt-auto pt-1 space-y-1">
        <div v-if="discount > 0" class="flex items-center justify-between gap-1">
          <span class="text-xs text-text-secondary line-through font-fanum">
            {{ formatPrice(maxComparePrice) }}
          </span>
          <BaseBadge variant="red" size="sm">{{ discount }}%</BaseBadge>
        </div>
        <p class="text-base font-bold text-text-primary text-right font-fanum">
          {{ formatPrice(displayPrice) }}
        </p>
      </div>

      <!-- Add to cart / In cart -->
      <button
        type="button"
        :class="[
          'mt-2 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5',
          isInCart ? 'bg-success' : 'bg-brand hover:bg-brand-dark',
        ]"
        :disabled="product.totalStock === 0"
        @click.stop="isInCart ? goToCart() : $emit('add-to-cart')"
        :aria-label="isInCart ? 'مشاهده در سبد خرید' : `افزودن ${product.name} به سبد خرید`"
      >
        <svg v-if="isInCart" class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
        </svg>
        {{ isInCart ? 'در سبد خرید' : '+ افزودن به سبد' }}
      </button>

    </div>
  </article>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseSkeleton from './BaseSkeleton.vue'
import BaseBadge    from './BaseBadge.vue'
import BaseRating   from './BaseRating.vue'
import { formatPrice } from '~/utils/formatters'
import { PRODUCT_PLACEHOLDER } from '~/utils/constants'
import { useCartStore }  from '~/stores/cart.store'

const props = defineProps({
  product:  { type: Object,  default: () => ({}) },
  loading:  { type: Boolean, default: false },
  wishlist: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
})

defineEmits(['click', 'add-to-cart', 'toggle-wish'])

const router    = useRouter()
const cartStore = useCartStore()

const isInCart = computed(() =>
  cartStore.items.some(item => item.productId === props.product._id)
)

function goToCart() {
  router.push('/cart')
}

const imgError = ref(false)

function resolveImg(p) {
  if (p.thumbnail) return p.thumbnail
  const img = p.images?.[0]
  if (!img) return PRODUCT_PLACEHOLDER
  if (typeof img === 'string') return img
  return img.thumbnail || img.url || PRODUCT_PLACEHOLDER
}

const imgSrc = computed(() => imgError.value ? PRODUCT_PLACEHOLDER : resolveImg(props.product))

watch(() => props.product?._id, () => { imgError.value = false })

// Unique color variant names (max 3 shown)
const colorVariants = computed(() => {
  const seen = new Set()
  const result = []
  for (const v of props.product.variants ?? []) {
    if (v.isActive === false) continue
    const colorAttr = (v.attributes ?? []).find(a => a.key === 'رنگ')
    if (colorAttr?.value && !seen.has(colorAttr.value)) {
      seen.add(colorAttr.value)
      result.push(colorAttr.value)
    }
  }
  return result
})

// Find the variant whose price equals minPrice — use its own comparePrice
// to avoid mixing prices from different variants (which inflates the discount).
const discountVariant = computed(() => {
  const variants = (props.product.variants ?? []).filter(
    v => v.isActive !== false && v.price > 0 && v.comparePrice > v.price,
  )
  if (!variants.length) return null
  // Prefer the variant matching minPrice; fall back to the one with the highest % off
  const minP = props.product.minPrice
  const match = minP ? variants.find(v => v.price === minP) : null
  return match ?? variants.reduce((best, v) =>
    (1 - v.price / v.comparePrice) > (1 - best.price / best.comparePrice) ? v : best,
  )
})

const variantDiscountPct     = computed(() => {
  const dv = discountVariant.value
  if (!dv) return 0
  return Math.round((1 - dv.price / dv.comparePrice) * 100)
})
const systemDiscountPct      = computed(() => props.product?.discountPercentage          ?? 0)

// Effective discount badge % shown on the card
const discount = computed(() =>
  Math.max(variantDiscountPct.value, systemDiscountPct.value)
)

// The "before" price shown crossed-out
const maxComparePrice = computed(() => {
  if (systemDiscountPct.value > variantDiscountPct.value) return props.product?.minPrice ?? 0
  return discountVariant.value?.comparePrice ?? 0
})

// The final price shown on the card
const displayPrice = computed(() => {
  if (systemDiscountPct.value > variantDiscountPct.value) {
    return props.product?.finalPrice ?? props.product?.minPrice ?? 0
  }
  return props.product?.minPrice ?? 0
})

function handleClick() {
  if (props.product.slug) router.push(`/product/${props.product.slug}`)
}
</script>
