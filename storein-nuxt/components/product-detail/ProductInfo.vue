<template>
  <div class="flex flex-col gap-5">

    <!-- SKELETON -->
    <template v-if="loading">
      <BaseSkeleton height="2rem" class="w-3/4" />
      <BaseSkeleton height="1rem" class="w-1/2" />
      <div class="border-t border-surface-border pt-4">
        <BaseSkeleton height="1rem" class="w-1/4 mb-3" />
        <div class="flex gap-2">
          <BaseSkeleton v-for="i in 3" :key="i" width="36px" height="36px" circle />
        </div>
      </div>
      <BaseSkeleton height="2.5rem" class="w-full rounded-xl" />
      <BaseSkeleton height="3rem" class="w-full rounded-xl" />
    </template>

    <!-- REAL CONTENT -->
    <template v-else-if="product">

      <!-- ① Name + category -->
      <div>
        <NuxtLink
          :to="`/category/${product.category?.slug}`"
          class="text-brand text-xs font-medium hover:underline mb-1 block"
        >
          {{ product.category?.name }}
        </NuxtLink>
        <h1 class="text-xl md:text-2xl font-bold text-text-primary leading-8">
          {{ product.name }}
        </h1>
      </div>

      <!-- ② Rating row -->
      <div class="flex items-center gap-3 pb-4 border-b border-surface-border">
        <BaseRating
          :modelValue="product.avgRating || 0"
          readonly
          showValue
          :count="product.reviewCount"
          size="md"
        />
        <span class="text-text-disabled text-sm">|</span>
        <span class="text-text-secondary text-sm font-fanum">
          {{ formatNumber(product.viewCount || 0) }} بازدید
        </span>
      </div>

      <!-- ③ Size selector — pill row -->
      <div v-if="sizeOptions.length > 0" class="pb-4 border-b border-surface-border">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-sm font-medium text-text-primary">سایز:</span>
          <span class="text-sm text-brand font-medium">{{ selectedSize }}</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="size in sizeOptions"
            :key="size.value"
            type="button"
            @click="selectSize(size.value)"
            :disabled="size.disabled"
            :aria-pressed="selectedSize === size.value"
            :class="[
              'min-w-[44px] h-11 px-3 rounded-xl text-sm font-bold border-2 transition-all duration-150',
              selectedSize === size.value
                ? 'bg-brand border-brand text-white'
                : 'border-surface-border text-text-secondary hover:border-brand/50',
              size.disabled ? 'opacity-35 cursor-not-allowed line-through' : '',
            ]"
          >
            {{ size.value }}
          </button>
        </div>
      </div>

      <!-- ④ Color selector — circle swatches -->
      <div v-if="colorOptions.length > 0" class="pb-4 border-b border-surface-border">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-sm font-medium text-text-primary">رنگ:</span>
          <span class="text-sm text-brand font-medium">{{ selectedColor }}</span>
        </div>
        <div class="flex flex-wrap gap-3">
          <button
            v-for="color in colorOptions"
            :key="color.value"
            type="button"
            @click="selectColor(color.value)"
            :disabled="color.disabled"
            :aria-label="`رنگ ${color.value}${color.disabled ? ' — ناموجود' : ''}`"
            :aria-pressed="selectedColor === color.value"
            :class="[
              'flex flex-col items-center gap-1 transition-all duration-150',
              color.disabled ? 'opacity-40 cursor-not-allowed' : '',
            ]"
          >
            <span
              :class="[
                'w-9 h-9 rounded-full border-2 flex items-center justify-center relative transition-all',
                selectedColor === color.value
                  ? 'border-brand scale-110 shadow-md'
                  : 'border-transparent hover:border-gray-300',
              ]"
            >
              <span
                class="w-7 h-7 rounded-full border border-black/10 block"
                :style="{ backgroundColor: getColorHex(color.value) }"
              />
              <span v-if="color.disabled" class="absolute inset-0 flex items-center justify-center">
                <svg class="w-3.5 h-3.5 text-error" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </span>
            </span>
            <span class="text-xs text-text-secondary leading-none">{{ color.value }}</span>
          </button>
        </div>
      </div>

      <!-- ④ Price -->
      <div class="pb-4 border-b border-surface-border">

        <!-- variant-level manual discount (comparePrice set on variant) -->
        <template v-if="activeDiscountMode === 'variant'">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-text-disabled line-through text-sm font-fanum">
              {{ formatPrice(selectedVariant.comparePrice) }}
            </span>
            <BaseBadge variant="red" size="sm">{{ discountPercent }}٪ تخفیف</BaseBadge>
          </div>
          <div class="text-2xl font-black text-text-primary font-fanum">
            {{ formatPrice(selectedVariant?.price || product.minPrice) }}
          </div>
        </template>
        <!-- system-level discount from admin discount panel -->
        <template v-else-if="activeDiscountMode === 'system'">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-text-disabled line-through text-sm font-fanum">
              {{ formatPrice(selectedVariant?.price || product.minPrice) }}
            </span>
            <BaseBadge variant="red" size="sm">{{ product.discountPercentage }}٪ تخفیف</BaseBadge>
          </div>
          <div class="text-2xl font-black text-success font-fanum">
            {{ formatPrice(systemFinalPrice) }}
          </div>
        </template>
        <template v-else>
          <div class="text-2xl font-black text-text-primary font-fanum">
            {{ formatPrice(selectedVariant?.price || product.minPrice) }}
          </div>
        </template>

      </div>

      <!-- ⑤ Stock status -->
      <div class="flex items-center gap-2">
        <template v-if="isInStock">
          <div class="w-2.5 h-2.5 rounded-full bg-success flex-shrink-0" />
          <span class="text-success text-sm font-medium">موجود در انبار</span>
          <span v-if="selectedVariant?.stock > 0 && selectedVariant?.stock <= 5" class="text-warning text-xs font-fanum">
            (تنها {{ selectedVariant.stock }} عدد باقی‌مانده)
          </span>
        </template>
        <template v-else>
          <div class="w-2.5 h-2.5 rounded-full bg-error flex-shrink-0" />
          <span class="text-error text-sm font-medium">ناموجود</span>
        </template>
      </div>

      <!-- ⑥ Action buttons — sticky on mobile, inline on desktop -->
      <div
        class="sticky bottom-0 z-20 -mx-4 px-4 py-3 glass-strong shadow-floating md:static md:z-auto md:mx-0 md:px-0 md:py-0 md:bg-transparent md:backdrop-blur-none md:border-0 md:shadow-none flex gap-3"
        style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));"
      >
        <button
          type="button"
          :disabled="!isInStock"
          :class="[
            'flex-1 py-3.5 rounded-xl border-2 border-brand text-brand font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2',
            !isInStock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand/10',
          ]"
          @click="handleAddToCart"
        >
          <svg v-if="!addingToCart" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
          </svg>
          {{ isInStock ? 'افزودن به سبد' : 'ناموجود' }}
        </button>

        <BaseButton
          variant="primary"
          size="lg"
          class="flex-1"
          :loading="addingToCart"
          :disabled="!isInStock"
          @click="handleBuyNow"
        >
          {{ isInStock ? 'خرید سریع' : 'ناموجود' }}
        </BaseButton>
      </div>

      <div class="flex gap-3">
        <button
          @click="handleWishlist"
          :aria-label="isWishlisted ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'"
          :aria-pressed="isWishlisted"
          :class="[
            'flex-1 py-3 rounded-xl border-2 font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200',
            isWishlisted
              ? 'border-red-400/40 bg-red-500/10 text-red-500'
              : 'border-surface-border text-text-secondary hover:border-brand/50',
          ]"
        >
          <svg
            class="w-5 h-5 flex-shrink-0"
            :fill="isWishlisted ? 'currentColor' : 'none'"
            :stroke="isWishlisted ? 'none' : 'currentColor'"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
          <span class="hidden sm:inline">{{ isWishlisted ? 'حذف از علاقه‌مندی‌ها' : 'علاقه‌مندی‌ها' }}</span>
        </button>

        <button
          @click="handleShare"
          :aria-label="shareCopied ? 'لینک کپی شد' : 'اشتراک‌گذاری محصول'"
          :class="[
            'flex-1 py-3 rounded-xl border-2 font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200',
            shareCopied
              ? 'border-success/40 bg-success/5 text-success'
              : 'border-surface-border text-text-secondary hover:border-brand/50',
          ]"
        >
          <svg v-if="!shareCopied" class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
          </svg>
          <svg v-else class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M5 13l4 4L19 7"/>
          </svg>
          <span class="hidden sm:inline">{{ shareCopied ? 'کپی شد!' : 'اشتراک‌گذاری' }}</span>
        </button>
      </div>

      <!-- ⑦ Guarantees -->
      <div class="grid grid-cols-3 gap-3 pt-2">
        <div
          v-for="g in guarantees"
          :key="g.label"
          class="flex flex-col items-center gap-1.5 text-center"
        >
          <div class="w-10 h-10 rounded-xl bg-surface flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
                 class="w-5 h-5 text-brand" aria-hidden="true">
              <path :d="g.svgPath"/>
            </svg>
          </div>
          <span class="text-text-secondary text-xs leading-4">{{ g.label }}</span>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter }        from 'vue-router'
import { useCartStore }     from '~/stores/cart.store'
import { useWishlistStore } from '~/stores/wishlist.store'
import { useUiStore }       from '~/stores/ui.store'
import { formatPrice, formatNumber, calcDiscount } from '~/utils/formatters'
import BaseRating   from '~/components/common/BaseRating.vue'
import BaseBadge    from '~/components/common/BaseBadge.vue'
import BaseButton   from '~/components/common/BaseButton.vue'
import BaseSkeleton from '~/components/common/BaseSkeleton.vue'

const props = defineProps({
  product: { type: Object,  default: null },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['add-to-cart', 'variant-change'])

const router         = useRouter()
const cartStore      = useCartStore()
const wishlistStore  = useWishlistStore()
const ui             = useUiStore()

const addingToCart  = ref(false)
const shareCopied   = ref(false)

// ── Variants: two independent axes (size, color) resolved to one variant ──
const allVariants = computed(() => (props.product?.variants ?? []).filter(v => v.isActive !== false))

const selectedSize  = ref('')
const selectedColor = ref('')

watch(() => props.product, (p) => {
  const variants = (p?.variants ?? []).filter(v => v.isActive !== false)
  const inStockFirst = variants.find(v => v.stock > 0) ?? variants[0]
  selectedSize.value  = getAttr(inStockFirst, 'سایز')
  selectedColor.value = getAttr(inStockFirst, 'رنگ')
}, { immediate: true })

// Unique sizes across all variants, each flagged disabled if no stock exists
// for that size at all (independent of the currently selected color).
const sizeOptions = computed(() => {
  const seen = new Map()
  for (const v of allVariants.value) {
    const size = getAttr(v, 'سایز')
    if (!size) continue
    const hasStock = v.stock > 0
    if (!seen.has(size)) seen.set(size, hasStock)
    else if (hasStock) seen.set(size, true)
  }
  return [...seen.entries()].map(([value, inStock]) => ({ value, disabled: !inStock }))
})

const colorOptions = computed(() => {
  const seen = new Map()
  for (const v of allVariants.value) {
    const color = getAttr(v, 'رنگ')
    if (!color) continue
    const hasStock = v.stock > 0
    if (!seen.has(color)) seen.set(color, hasStock)
    else if (hasStock) seen.set(color, true)
  }
  return [...seen.entries()].map(([value, inStock]) => ({ value, disabled: !inStock }))
})

// The variant matching both selected axes; falls back to any variant matching
// just the size or just the color if the exact combo has no stock.
const selectedVariant = computed(() => {
  const exact = allVariants.value.find(v =>
    getAttr(v, 'سایز') === selectedSize.value && getAttr(v, 'رنگ') === selectedColor.value,
  )
  if (exact) return exact
  return allVariants.value.find(v => getAttr(v, 'سایز') === selectedSize.value)
    ?? allVariants.value.find(v => getAttr(v, 'رنگ') === selectedColor.value)
    ?? allVariants.value[0]
    ?? null
})

watch(selectedVariant, (v) => { if (v) emit('variant-change', v) })

function selectSize(size)   { selectedSize.value  = size }
function selectColor(color) { selectedColor.value = color }

// ── Price / discount ──────────────────────────────────────────────
const discountPercent = computed(() => {
  const v = selectedVariant.value
  if (!v?.comparePrice || !v?.price) return 0
  return calcDiscount(v.comparePrice, v.price)
})

const systemDiscountPct   = computed(() => props.product?.discountPercentage ?? 0)

// The price the system discount yields for the selected variant
const systemFinalPrice = computed(() => {
  const base = selectedVariant.value?.price || props.product?.minPrice || 0
  return Math.round(base * (1 - systemDiscountPct.value / 100))
})

// Which discount source to show: 'variant' | 'system' | 'none'
// Show whichever gives the customer a lower price; variant-based wins on tie.
const activeDiscountMode = computed(() => {
  const varPct = discountPercent.value
  const sysPct = systemDiscountPct.value
  if (varPct <= 0 && sysPct <= 0) return 'none'
  if (varPct >= sysPct) return 'variant'
  return 'system'
})

// ── Stock ─────────────────────────────────────────────────────────
const isInStock = computed(() =>
  selectedVariant.value
    ? selectedVariant.value.stock > 0
    : (props.product?.totalStock ?? 0) > 0
)

// ── Wishlist ──────────────────────────────────────────────────────
const isWishlisted = computed(() =>
  props.product ? wishlistStore.isInWishlist(props.product._id) : false
)

async function handleWishlist() {
  if (!props.product) return
  await wishlistStore.toggle(props.product._id)
}

// ── Share ─────────────────────────────────────────────────────────
async function handleShare() {
  const url  = window.location.href
  const name = props.product?.name || ''

  if (navigator.share) {
    try {
      await navigator.share({ title: name, url })
    } catch {
      // user cancelled — no action needed
    }
    return
  }

  try {
    await navigator.clipboard.writeText(url)
    shareCopied.value = true
    ui.addToast('لینک محصول کپی شد ✓', 'success')
    setTimeout(() => { shareCopied.value = false }, 2500)
  } catch {
    ui.addToast('کپی لینک ممکن نشد', 'error')
  }
}

// ── Add to cart ───────────────────────────────────────────────────
async function handleAddToCart() {
  if (!isInStock.value || addingToCart.value) return
  addingToCart.value = true
  try {
    await cartStore.addItem(props.product._id, selectedVariant.value?._id, 1)
    ui.addToast('محصول به سبد خرید افزوده شد ✓', 'success')
    emit('add-to-cart', selectedVariant.value?._id)
  } catch {
    ui.addToast('خطا در افزودن به سبد. دوباره تلاش کنید', 'error')
  } finally {
    addingToCart.value = false
  }
}

async function handleBuyNow() {
  if (!isInStock.value || addingToCart.value) return
  addingToCart.value = true
  try {
    await cartStore.addItem(props.product._id, selectedVariant.value?._id, 1)
    emit('add-to-cart', selectedVariant.value?._id)
    router.push('/checkout')
  } catch {
    ui.addToast('خطا در افزودن به سبد. دوباره تلاش کنید', 'error')
  } finally {
    addingToCart.value = false
  }
}

// ── Attribute helpers ─────────────────────────────────────────────
// attributes is [{key,value}] array — never access as object
function getAttr(variant, key) {
  if (!variant?.attributes) return ''
  const found = variant.attributes.find(a => a.key === key)
  return found?.value ?? ''
}

// ── Colors — from product.colorMap; fallback to Persian color name map ─────
const FA_COLOR_MAP = {
  'مشکی': '#1a1a1a', 'مشکی مات': '#2d2d2d', 'سیاه': '#111111',
  'سفید': '#f5f5f5', 'کرم': '#f5f0e8', 'شیری': '#fffde7',
  'قرمز': '#e53935', 'قرمز روشن': '#ef5350', 'زرشکی': '#880e4f',
  'آبی': '#1e88e5', 'آبی تیره': '#1565c0', 'آبی‌تیره': '#1565c0', 'آبی روشن': '#42a5f5', 'نیلی': '#283593',
  'سبز': '#43a047', 'سبز تیره': '#2e7d32', 'سبز روشن': '#66bb6a',
  'زرد': '#fdd835', 'طلایی': '#f9a825', 'نارنجی': '#fb8c00',
  'بنفش': '#8e24aa', 'یاسی': '#ce93d8', 'بادمجانی': '#6a1b9a',
  'صورتی': '#e91e63', 'صورتی روشن': '#f48fb1',
  'خاکستری': '#757575', 'نقره‌ای': '#bdbdbd', 'طوسی': '#9e9e9e',
  'قهوه‌ای': '#6d4c41', 'شکلاتی': '#4e342e', 'کاراملی': '#8d6e63',
  'عسلی': '#ff8f00', 'فیروزه‌ای': '#00acc1', 'زیتونی': '#827717',
  'گلبهی': '#f8bbd0', 'لاجوردی': '#283593', 'ذغالی': '#37474f',
}

function getColorHex(name) {
  if (!name) return '#888'
  return props.product?.colorMap?.[name] ?? FA_COLOR_MAP[name] ?? '#888'
}

const guarantees = [
  { icon: '🔒', label: 'پرداخت امن',  svgPath: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  { icon: '↩️', label: 'ضمانت ۷ روزه', svgPath: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  { icon: '✅', label: 'اصالت کالا',  svgPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
]
</script>
