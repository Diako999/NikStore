<template>
  <!-- Skeleton -->
  <div v-if="loading" class="rounded-2xl overflow-hidden p-card-skel">
    <BaseSkeleton height="200px" class="rounded-none" />
    <div class="p-4 space-y-3">
      <BaseSkeleton height="1.1rem" />
      <BaseSkeleton height="1.1rem" width="70%" />
      <BaseSkeleton height="0.85rem" width="45%" />
      <BaseSkeleton height="2.5rem" class="mt-3" />
    </div>
  </div>

  <!-- Product card — GlassCard-style translucent fill + gradient border,
       matching the mockups' `.p-card` recipe -->
  <article
    v-else
    class="p-card cursor-pointer flex flex-col h-full"
    @click="handleClick"
    @keydown.enter.prevent="handleClick"
    @keydown.space.prevent="handleClick"
    tabindex="0"
    role="link"
    :aria-label="product.name"
  >
    <!-- Image area -->
    <div class="p-card__thumb aspect-square relative shrink-0 overflow-hidden">

      <!-- Wishlist: top-end (physically left in RTL) — floating glass control -->
      <button
        type="button"
        class="p-card__heart absolute top-2.5 end-2.5 z-10 w-11 h-11 flex items-center justify-center rounded-full tactile"
        @click.stop="$emit('toggle-wish')"
        :aria-label="wishlist ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'"
        :aria-pressed="wishlist"
      >
        <Motion
          as="span"
          class="inline-flex"
          :animate="reducedMotion ? {} : { scale: wishlist ? 1.18 : 1 }"
          :transition="{ type: 'spring', stiffness: 500, damping: 15 }"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
            :fill="wishlist ? 'currentColor' : 'none'"
            stroke="currentColor" stroke-width="1.8"
            :class="['w-4 h-4', wishlist ? 'text-red-400' : 'text-white/70']"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
          </svg>
        </Motion>
      </button>

      <!-- Discount + New badges: top-start (physically right in RTL) -->
      <div class="absolute top-2.5 start-2.5 z-10 flex flex-col gap-1">
        <BaseBadge v-if="discount > 0" variant="red" size="sm">{{ discount }}%</BaseBadge>
        <BaseBadge v-if="product.isNew" variant="navy" size="sm">جدید</BaseBadge>
      </div>

      <div v-if="!imgSrc || imgError" class="p-card__fallback" :class="fallbackClass" aria-hidden="true" />
      <img
        v-else
        :src="imgSrc"
        :alt="product.name"
        class="w-full h-full object-contain relative z-[1]"
        loading="lazy"
        @error="imgError = true"
      />

      <!-- Out of stock overlay -->
      <div v-if="product.totalStock === 0" class="absolute inset-0 bg-black/55 flex items-center justify-center z-[2]" aria-hidden="true">
        <span class="text-white font-semibold text-sm px-3 py-1.5 rounded-full" style="background: var(--glass-strong); backdrop-filter: blur(10px);">ناموجود</span>
      </div>
    </div>

    <!-- Body -->
    <div class="p-4 flex flex-col gap-2 flex-1">

      <!-- Name -->
      <h3 class="text-sm font-bold text-glass-text-primary line-clamp-2 leading-relaxed" style="min-height: 2.75rem">
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
          <span class="text-xs text-glass-text-secondary line-through font-fanum">
            {{ formatPrice(maxComparePrice) }}
          </span>
          <BaseBadge variant="red" size="sm">{{ discount }}%</BaseBadge>
        </div>
        <p class="text-base font-bold text-glass-text-primary text-right font-fanum">
          {{ formatPrice(displayPrice) }}
        </p>
      </div>

      <!-- In cart: single full-width status button -->
      <button
        v-if="isInCart"
        type="button"
        class="mt-2 w-full py-2.5 rounded-xl text-sm font-bold text-white bg-success transition-all duration-300 active:scale-95 flex items-center justify-center gap-1.5"
        @click.stop="goToCart"
        aria-label="مشاهده در سبد خرید"
      >
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
        </svg>
        در سبد خرید
      </button>

      <!-- Not in cart: dual Add-to-Cart / Buy-Now actions -->
      <div v-else class="mt-2 flex items-center gap-2">
        <Motion
          as="button"
          type="button"
          class="flex-1 h-11 min-w-0 rounded-xl text-xs font-bold border-2 border-brand text-brand transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand/10 px-2 truncate"
          :while-press="(reducedMotion || product.totalStock === 0) ? undefined : { scale: 0.94 }"
          :disabled="product.totalStock === 0"
          @click="onAddToCart"
          :aria-label="`افزودن ${product.name} به سبد خرید`"
        >
          افزودن به سبد
        </Motion>
        <Motion
          as="button"
          type="button"
          class="flex-1 h-11 min-w-0 rounded-xl text-xs font-bold text-white bg-brand hover:bg-brand-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed px-2 truncate"
          :while-press="(reducedMotion || product.totalStock === 0) ? undefined : { scale: 0.94 }"
          :disabled="product.totalStock === 0"
          @click="onBuyNow"
          :aria-label="`خرید سریع ${product.name}`"
        >
          خرید سریع
        </Motion>
      </div>

    </div>
  </article>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Motion } from 'motion-v'
import BaseSkeleton from './BaseSkeleton.vue'
import BaseBadge    from './BaseBadge.vue'
import BaseRating   from './BaseRating.vue'
import { formatPrice } from '~/utils/formatters'
import { useCartStore }  from '~/stores/cart.store'

const props = defineProps({
  product:  { type: Object,  default: () => ({}) },
  loading:  { type: Boolean, default: false },
  wishlist: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
})

const emit = defineEmits(['click', 'add-to-cart', 'buy-now', 'toggle-wish'])

const router    = useRouter()
const cartStore = useCartStore()

const reducedMotion = ref(false)
onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

function onAddToCart(e) { emit('add-to-cart', e) }
function onBuyNow(e) { emit('buy-now', e) }

const isInCart = computed(() =>
  cartStore.items.some(item => item.productId === props.product._id)
)

function goToCart() {
  router.push('/cart')
}

const imgError = ref(false)

// Fallback garment-silhouette gradient art (mockup's g-hoodie/g-jacket/etc.)
// used when a product has no image — picked deterministically from the
// product id so the same product always gets the same fallback tone.
const FALLBACK_CLASSES = ['p-card__g-hoodie', 'p-card__g-jacket', 'p-card__g-pants', 'p-card__g-tee', 'p-card__g-sneaker', 'p-card__g-bag']
const fallbackClass = computed(() => {
  const id = props.product?._id || props.product?.slug || ''
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return FALLBACK_CLASSES[hash % FALLBACK_CLASSES.length]
})

function resolveImg(p) {
  if (p.thumbnail) return p.thumbnail
  const img = p.images?.[0]
  if (!img) return ''
  if (typeof img === 'string') return img
  return img.thumbnail || img.url || ''
}

const imgSrc = computed(() => imgError.value ? '' : resolveImg(props.product))

watch(() => props.product?._id, () => { imgError.value = false })

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

<style scoped>
.p-card-skel { background: var(--glass); }

.p-card {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  border: 1.5px solid transparent;
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  background:
    linear-gradient(var(--glass), var(--glass)) padding-box,
    linear-gradient(150deg, rgba(255, 255, 255, .45), rgba(255, 255, 255, .04) 55%, rgba(122, 90, 220, .30)) border-box;
  transition: transform 200ms ease, box-shadow 200ms ease;
}
[data-theme='light'] .p-card {
  background:
    linear-gradient(var(--glass), var(--glass)) padding-box,
    linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(231, 175, 66, .5) 55%, rgba(122, 90, 220, .4) 100%) border-box;
  box-shadow: var(--glass-shadow);
}
.p-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 34px rgba(0, 0, 0, .28);
}
.p-card:focus-visible {
  outline: 2px solid var(--brand-light);
  outline-offset: 2px;
}

.p-card__thumb { background: var(--glass); }

.p-card__heart {
  background: rgba(9, 15, 12, .45);
  backdrop-filter: blur(6px);
}
[data-theme='light'] .p-card__heart { background: rgba(255, 255, 255, .55); box-shadow: 0 2px 6px rgba(40, 55, 46, .15); }

.p-card__fallback { width: 100%; height: 100%; }
.p-card__g-hoodie  { background: radial-gradient(120% 120% at 30% 20%, #A9C9B4 0%, #3D8B52 55%, #0F1A13 100%); }
.p-card__g-jacket  { background: radial-gradient(120% 120% at 70% 15%, #E7C878 0%, #B5893C 55%, #17130A 100%); }
.p-card__g-pants   { background: radial-gradient(120% 120% at 30% 80%, #C6B5EE 0%, #7A5ADC 55%, #140E24 100%); }
.p-card__g-tee     { background: radial-gradient(120% 120% at 50% 10%, #F5F7F3 0%, #6EB082 55%, #0F1A13 100%); }
.p-card__g-sneaker { background: radial-gradient(120% 120% at 20% 90%, #F5F7F3 0%, #93A69C 55%, #17241C 100%); }
.p-card__g-bag     { background: radial-gradient(120% 120% at 80% 20%, #FBEFC8 0%, #C7A45C 55%, #17130A 100%); }
[data-theme='light'] .p-card__g-hoodie  { background: radial-gradient(120% 120% at 30% 20%, #D9EEE0 0%, #6EB082 55%, #245535 100%); }
[data-theme='light'] .p-card__g-jacket  { background: radial-gradient(120% 120% at 70% 15%, #FBE7CE 0%, #E0A468 55%, #6B3F17 100%); }
[data-theme='light'] .p-card__g-pants   { background: radial-gradient(120% 120% at 30% 80%, #E7DCF7 0%, #A98BE6 55%, #4A2E82 100%); }
[data-theme='light'] .p-card__g-tee     { background: radial-gradient(120% 120% at 50% 10%, #FBF3D9 0%, #E9C465 55%, #7A5410 100%); }
[data-theme='light'] .p-card__g-sneaker { background: radial-gradient(120% 120% at 20% 90%, #FDE6EE 0%, #E9A0B9 55%, #7C2E45 100%); }
[data-theme='light'] .p-card__g-bag     { background: radial-gradient(120% 120% at 80% 20%, #FBEFCC 0%, #DDB667 55%, #7A5410 100%); }
</style>
