<template>
  <!-- Skeleton -->
  <div v-if="loading" class="rounded-3xl shadow-card overflow-hidden" style="background-color: var(--color-card);">
    <BaseSkeleton height="280px" class="rounded-none" />
    <div class="p-4 space-y-3">
      <div class="flex gap-2">
        <BaseSkeleton v-for="i in 3" :key="i" height="90px" width="86px" class="rounded-xl flex-shrink-0" />
      </div>
      <BaseSkeleton height="80px" />
      <BaseSkeleton height="44px" class="rounded-full" />
    </div>
  </div>

  <!-- Featured card -->
  <article
    v-else
    class="rounded-3xl shadow-card overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col"
    style="background-color: var(--color-card);"
    @click="handleClick"
  >

    <!-- ══════════════════════════════════════
         HERO: beige background with overlay text + image
    ══════════════════════════════════════ -->
    <div
      class="relative flex-shrink-0 overflow-hidden"
      style="height: 280px; background: linear-gradient(145deg, #f5e8d4 0%, #e9d8bf 60%, #ddc9a8 100%);"
    >
      <!-- Heart button: top-left -->
      <button
        type="button"
        class="absolute top-4 left-4 z-10 w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-150"
        style="background: #1a1a2e;"
        @click.stop="$emit('toggle-wish')"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24"
          :fill="wishlist ? '#f59e0b' : 'none'"
          stroke="#f59e0b" stroke-width="1.8">
          <path stroke-linecap="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
        </svg>
      </button>

      <!-- Discount badge: top-right -->
      <div
        v-if="discount > 0"
        class="absolute top-4 right-4 z-10 rounded-2xl text-center shadow-sm"
        style="background: #ffe4e6; padding: 10px 14px; min-width: 60px;"
      >
        <p class="text-red-500 font-black leading-none font-fanum" style="font-size: 1.4rem;">{{ discount }}%</p>
        <p class="text-red-400 font-bold mt-1" style="font-size: 11px;">تخفیف</p>
      </div>

      <!-- Product image: changes with selected variant -->
      <img
        :key="heroImgSrc"
        :src="heroImgSrc"
        :alt="product.name"
        class="absolute top-0 h-full w-full object-contain"
        style="padding: 16px; object-position: center;"
        @error="e => e.target.src = PRODUCT_PLACEHOLDER"
      />
    </div>

    <!-- ══════════════════════════════════════
         BODY: dark card section
    ══════════════════════════════════════ -->
    <div class="flex flex-col gap-4 p-4 flex-1">

      <!-- Product name -->
      <div>
        <p class="text-text-secondary font-medium leading-none mb-1" style="font-size: 10px;">{{ product.category?.name }}</p>
        <h3 class="text-text-primary font-bold leading-snug line-clamp-2" style="font-size: 0.875rem;">{{ product.name }}</h3>
      </div>

      <!-- ① Variant image cards (horizontal scroll) -->
      <div v-if="activeVariants.length > 0" class="flex gap-2.5 overflow-x-auto scrollbar-hide pb-0.5">
        <button
          v-for="(variant, idx) in activeVariants"
          :key="variant._id"
          @click.stop="selectVariant(variant)"
          :disabled="variant.stock === 0"
          :class="[
            'relative flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-150',
            localSelected?._id === variant._id ? 'border-purple-500' : 'border-transparent',
            variant.stock === 0 ? 'opacity-40 cursor-not-allowed' : '',
          ]"
          style="width: 86px; background: rgba(255,255,255,0.06);"
        >
          <!-- Selected checkmark -->
          <div
            v-if="localSelected?._id === variant._id"
            class="absolute top-1.5 end-1.5 z-10 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center"
          >
            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M4.5 12.75l6 6 9-13.5"/>
            </svg>
          </div>

          <!-- Variant image -->
          <div class="aspect-square">
            <img
              :src="getVariantImage(idx)"
              :alt="getAttr(variant, 'رنگ')"
              class="w-full h-full object-contain p-1.5"
              @error="e => e.target.src = PRODUCT_PLACEHOLDER"
            />
          </div>
        </button>
      </div>

      <!-- ② Features + Price (2-column grid) -->
      <div class="grid grid-cols-2 gap-3 pt-1">

        <!-- Features column (right in RTL = start side) -->
        <div class="space-y-3">
          <div v-for="(f, i) in features" :key="i" class="flex items-center gap-2">
            <!-- Icon circle -->
            <div
              class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style="background: rgba(168,85,247,0.15);"
            >
              <!-- Feather / quality -->
              <svg v-if="i === 0" class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904"/>
              </svg>
              <!-- Shield / warranty -->
              <svg v-else-if="i === 1" class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/>
              </svg>
              <!-- Eye / lens -->
              <svg v-else class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z"/>
                <path stroke-linecap="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
              </svg>
            </div>
            <div class="min-w-0">
              <p class="font-bold text-text-primary leading-tight" style="font-size: 11px;">{{ f.title }}</p>
              <p class="text-text-secondary leading-tight mt-0.5" style="font-size: 10px;">{{ f.subtitle }}</p>
            </div>
          </div>
        </div>

        <!-- Rating + Price column (left in RTL = end side) -->
        <div class="flex flex-col items-end gap-2">
          <!-- Rating row -->
          <div v-if="product.avgRating" class="flex items-center gap-1">
            <span class="text-text-secondary font-fanum" style="font-size: 11px;">({{ product.reviewCount || 0 }} نظر)</span>
            <span class="font-bold text-text-primary font-fanum text-sm">{{ product.avgRating }}</span>
            <span class="text-yellow-400" style="font-size: 1rem;">★</span>
          </div>

          <!-- Price block -->
          <div class="mt-auto text-end">
            <!-- Strikethrough comparePrice -->
            <p
              v-if="currentVariant?.comparePrice > currentVariant?.price"
              class="text-text-disabled line-through font-fanum leading-none"
              style="font-size: 12px;"
            >
              {{ formatPrice(currentVariant.comparePrice) }}
            </p>
            <!-- Main price (number only, large) -->
            <p class="font-black text-text-primary font-fanum leading-tight mt-1" style="font-size: 1.45rem;">
              {{ formatNumber(currentVariant?.price || product.minPrice) }}
            </p>
            <!-- تومان in brand color -->
            <p class="text-brand font-bold mt-0.5" style="font-size: 12px;">تومان</p>
          </div>
        </div>
      </div>

      <!-- ③ Actions row -->
      <!-- In cart: single full-width status button -->
      <button
        v-if="isInCart"
        @click.stop="goToCart"
        class="w-full h-11 rounded-full flex items-center justify-center gap-2 text-white font-bold active:scale-[0.98] transition-transform"
        style="background: #16a34a; font-size: 0.875rem;"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M4.5 12.75l6 6 9-13.5"/>
        </svg>
        در سبد خرید
      </button>

      <!-- Not in cart: dual Add-to-Cart / Buy-Now actions -->
      <div v-else class="flex items-center gap-2.5">
        <button
          type="button"
          @click.stop="handleAddToCart"
          :disabled="product.totalStock === 0 || addingToCart"
          class="flex-1 h-11 rounded-full border-2 border-brand text-brand font-bold disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform hover:bg-brand/10"
          style="font-size: 0.8125rem;"
        >
          {{ product.totalStock === 0 ? 'ناموجود' : 'افزودن به سبد' }}
        </button>
        <button
          type="button"
          @click.stop="handleBuyNow"
          :disabled="product.totalStock === 0 || addingToCart"
          class="flex-1 h-11 rounded-full bg-brand hover:bg-brand-dark text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
          style="font-size: 0.8125rem;"
        >
          {{ addingToCart ? '...' : (product.totalStock === 0 ? 'ناموجود' : 'خرید سریع') }}
        </button>
      </div>

    </div>
  </article>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseSkeleton from './BaseSkeleton.vue'
import { formatPrice, formatNumber } from '~/utils/formatters'
import { PRODUCT_PLACEHOLDER } from '~/utils/constants'
import { useCartStore } from '~/stores/cart.store'
import { useUiStore }   from '~/stores/ui.store'

const props = defineProps({
  product:  { type: Object,  default: () => ({}) },
  loading:  { type: Boolean, default: false },
  wishlist: { type: Boolean, default: false },
})

defineEmits(['toggle-wish'])

const router    = useRouter()
const cartStore = useCartStore()
const ui        = useUiStore()

const addingToCart = ref(false)

// ── Variants ──────────────────────────────────────────────────────
const activeVariants = computed(() =>
  (props.product.variants ?? []).filter(v => v.isActive !== false)
)

const localSelected = ref(null)

watch(() => props.product, (p) => {
  const variants = (p?.variants ?? []).filter(v => v.isActive !== false)
  localSelected.value = variants.find(v => v.stock > 0) ?? variants[0] ?? null
}, { immediate: true })

function selectVariant(variant) {
  if (variant.stock === 0) return
  localSelected.value = variant
}

const currentVariant = computed(() => localSelected.value ?? activeVariants.value[0])

// ── Cart ──────────────────────────────────────────────────────────
const isInCart = computed(() =>
  cartStore.items.some(item => item.productId === props.product._id)
)

function goToCart() { router.push('/cart') }

async function handleAddToCart() {
  if (!currentVariant.value || addingToCart.value) return
  addingToCart.value = true
  try {
    await cartStore.addItem(props.product._id, currentVariant.value._id, 1)
    ui.addToast('محصول به سبد خرید افزوده شد ✓', 'success')
  } catch {
    ui.addToast('خطا در افزودن به سبد', 'error')
  } finally {
    addingToCart.value = false
  }
}

async function handleBuyNow() {
  if (!currentVariant.value || addingToCart.value) return
  addingToCart.value = true
  try {
    await cartStore.addItem(props.product._id, currentVariant.value._id, 1)
    router.push('/checkout')
  } catch {
    ui.addToast('خطا در افزودن به سبد', 'error')
  } finally {
    addingToCart.value = false
  }
}

// ── Image ─────────────────────────────────────────────────────────
const imgError = ref(false)

watch(() => props.product?._id, () => { imgError.value = false })

function resolveImg(p) {
  if (p.thumbnail) return p.thumbnail
  const img = p.images?.[0]
  if (!img) return PRODUCT_PLACEHOLDER
  if (typeof img === 'string') return img
  return img.url || img.thumbnail || PRODUCT_PLACEHOLDER
}

const imgSrc = computed(() => imgError.value ? PRODUCT_PLACEHOLDER : resolveImg(props.product))

const heroImgSrc = computed(() => {
  const idx = activeVariants.value.findIndex(v => v._id === localSelected.value?._id)
  return getVariantImage(idx >= 0 ? idx : 0)
})

function getVariantImage(idx) {
  const imgs = props.product?.images ?? []
  const img = imgs[idx] ?? imgs[0]
  if (!img) return PRODUCT_PLACEHOLDER
  if (typeof img === 'string') return img
  return img.url || img.thumbnail || PRODUCT_PLACEHOLDER
}

// ── Discount ──────────────────────────────────────────────────────
// Use the selected variant's own price/comparePrice for a correct per-variant discount.
// Falls back to the variant with the highest % off when no variant is selected.
const discount = computed(() => {
  const dv = currentVariant.value
  if (dv?.comparePrice > 0 && dv.price > 0 && dv.comparePrice > dv.price) {
    return Math.round((1 - dv.price / dv.comparePrice) * 100)
  }
  // Fallback: highest discount among all active variants
  const variants = (props.product.variants ?? []).filter(
    v => v.isActive !== false && v.price > 0 && v.comparePrice > v.price,
  )
  if (!variants.length) return 0
  return Math.max(...variants.map(v => Math.round((1 - v.price / v.comparePrice) * 100)))
})

// ── Helpers ───────────────────────────────────────────────────────
function getAttr(variant, key) {
  if (!variant?.attributes) return ''
  return variant.attributes.find(a => a.key === key)?.value ?? ''
}

// ── Features (specs if available, else generic) ───────────────────
const features = computed(() => {
  const specs = props.product?.specs ?? []
  if (specs.length > 0) return specs.slice(0, 3).map(s => ({ title: s.key, subtitle: s.value }))
  return [
    { title: 'کیفیت ممتاز', subtitle: 'مواد اولیه درجه یک' },
    { title: 'ضمانت اصالت', subtitle: 'کالای تضمین شده' },
    { title: 'لنز UV400', subtitle: 'محافظت کامل از چشم' },
  ]
})

// ── Navigation ────────────────────────────────────────────────────
function handleClick() {
  if (props.product.slug) router.push(`/product/${props.product.slug}`)
}
</script>
