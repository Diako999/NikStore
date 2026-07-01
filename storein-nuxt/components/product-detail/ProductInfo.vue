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

      <!-- ③ Variant color swatches -->
      <div v-if="colorVariants.length > 0" class="pb-4 border-b border-surface-border">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-sm font-medium text-text-primary">رنگ:</span>
          <span class="text-sm text-brand font-medium">
            {{ getAttr(selectedVariant, 'رنگ') }}
          </span>
        </div>
        <div class="flex flex-wrap gap-3">
          <button
            v-for="variant in colorVariants"
            :key="variant._id"
            @click="selectVariant(variant)"
            :disabled="variant.stock === 0"
            :aria-label="`رنگ ${getAttr(variant, 'رنگ')}${variant.stock === 0 ? ' — ناموجود' : ''}`"
            :aria-pressed="selectedVariant?._id === variant._id"
            :class="[
              'flex flex-col items-center gap-1 transition-all duration-150',
              variant.stock === 0 ? 'opacity-40 cursor-not-allowed' : '',
            ]"
          >
            <span
              :class="[
                'w-9 h-9 rounded-full border-2 flex items-center justify-center relative transition-all',
                selectedVariant?._id === variant._id
                  ? 'border-brand scale-110 shadow-md'
                  : 'border-transparent hover:border-gray-300',
              ]"
            >
              <span
                class="w-7 h-7 rounded-full border border-black/10 block"
                :style="{ backgroundColor: getColorHex(getAttr(variant, 'رنگ')) }"
              />
              <span v-if="variant.stock === 0" class="absolute inset-0 flex items-center justify-center">
                <svg class="w-3.5 h-3.5 text-error" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </span>
            </span>
            <span class="text-xs text-text-secondary leading-none">
              {{ getAttr(variant, 'رنگ') }}
            </span>
          </button>
        </div>
      </div>

      <!-- ④ Price -->
      <div class="pb-4 border-b border-surface-border">

        <!-- قیمت عمده برای کاربران wholesale -->
        <template v-if="auth.isWholesale && selectedVariant?.wholesalePrice">
          <div class="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full mb-2">
            <span>🏪</span>
            <span>قیمت عمده — حداقل {{ selectedVariant.wholesaleMinQty || 10 }} عدد</span>
          </div>
          <!-- wholesale discount active: show crossed-out original wholesale price -->
          <template v-if="wholesaleDiscountPct > 0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-text-disabled line-through text-sm font-fanum">
                {{ formatPrice(selectedVariant.wholesalePrice) }}
              </span>
              <BaseBadge variant="red" size="sm">{{ wholesaleDiscountPct }}٪ تخفیف</BaseBadge>
            </div>
            <div class="text-2xl font-black text-success font-fanum">
              {{ formatPrice(wholesaleDiscountedPrice) }}
            </div>
          </template>
          <template v-else>
            <div class="text-2xl font-black text-amber-600 font-fanum">
              {{ formatPrice(selectedVariant.wholesalePrice) }}
            </div>
          </template>
          <div class="text-sm line-through mt-0.5 font-fanum" style="color: var(--color-text-disabled);">
            قیمت خرده: {{ formatPrice(selectedVariant.price) }}
          </div>
        </template>

        <!-- قیمت معمولی -->
        <template v-else>
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

          <!-- Wholesale teaser for non-wholesale users (UXID-009) -->
          <NuxtLink
            v-if="product.minWholesalePrice"
            to="/wholesale"
            class="mt-2 inline-flex items-center gap-2 text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
          >
            <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            <span>خریداران عمده این محصول را ارزان‌تر می‌خرند — عضویت رایگان</span>
          </NuxtLink>
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

      <!-- ⑥ Action buttons -->
      <div ref="cartButtonRef" class="flex flex-col gap-3">

        <!-- Wholesale order panel — only for wholesale users with a wholesale price -->
        <div
          v-if="auth.isWholesale && selectedVariant?.wholesalePrice"
          class="rounded-2xl p-4 flex flex-col gap-3 bg-wholesale/10 border border-wholesale-border"
        >
          <!-- Label + running total -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-wholesale-dark flex-shrink-0" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
              <span class="font-bold text-wholesale-dark text-sm">سفارش عمده</span>
              <span class="text-xs text-warning opacity-80">حداقل {{ formatNumber(wholesaleMinQty) }} عدد</span>
            </div>
            <span class="text-sm text-wholesale-dark font-fanum font-bold">
              {{ formatPrice(wholesaleLineTotal) }} تومان
            </span>
          </div>

          <!-- Stepper + add button -->
          <div class="flex flex-col gap-1">
            <div class="flex gap-3 items-center">
              <div
                class="flex items-center rounded-xl overflow-hidden shrink-0 bg-bg"
                :class="wholesaleQtyExceedsStock ? 'border border-error' : 'border border-wholesale/40'"
              >
                <button
                  type="button"
                  @click="decreaseWholesaleQty"
                  class="w-10 h-11 flex items-center justify-center text-2xl text-wholesale-dark transition-colors hover:bg-wholesale/10"
                  aria-label="کاهش تعداد"
                >−</button>
                <input
                  type="number"
                  v-model.number="wholesaleQty"
                  @change="onWholesaleQtyChange"
                  @blur="onWholesaleQtyChange"
                  class="pi-qty-input w-14 text-[15px] font-bold font-fanum text-center bg-transparent border-none outline-none text-text-primary"
                  :min="wholesaleMinQty"
                  :aria-label="`تعداد، حداقل ${wholesaleMinQty}`"
                />
                <button
                  type="button"
                  @click="wholesaleQty += wholesaleMinQty"
                  class="w-10 h-11 flex items-center justify-center text-2xl text-wholesale-dark transition-colors hover:bg-wholesale/10"
                  aria-label="افزایش تعداد"
                >+</button>
              </div>

              <button
                type="button"
                :disabled="!isInStock || addingToCartWholesale || wholesaleQtyExceedsStock"
                @click="handleAddToCartWholesale"
                class="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl font-bold text-sm text-white bg-wholesale hover:bg-wholesale-dark transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(245,158,11,0.35)]"
              >
                <span
                  v-if="addingToCartWholesale"
                  class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
                  aria-hidden="true"
                />
                <template v-else>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                  </svg>
                  افزودن به سبد عمده
                </template>
              </button>
            </div>
            <p v-if="wholesaleQtyExceedsStock" class="text-xs text-error font-semibold text-center">
              فقط {{ selectedVariant?.stock }} عدد موجود است
            </p>
          </div>
        </div>

        <BaseButton
          variant="primary"
          size="lg"
          block
          :loading="addingToCart"
          :disabled="!isInStock"
          @click="handleAddToCart"
        >
          <template v-if="isInStock">
            <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            {{ auth.isWholesale && selectedVariant?.wholesalePrice ? 'خرید تکی' : 'افزودن به سبد خرید' }}
          </template>
          <template v-else>ناموجود</template>
        </BaseButton>

        <div class="flex gap-3">
          <button
            @click="handleWishlist"
            :aria-label="isWishlisted ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'"
            :aria-pressed="isWishlisted"
            :class="[
              'flex-1 py-3 rounded-xl border-2 font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200',
              isWishlisted
                ? 'border-red-200 bg-red-50 text-red-500'
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
import { useCartStore }     from '~/stores/cart.store'
import { useWishlistStore } from '~/stores/wishlist.store'
import { useUiStore }       from '~/stores/ui.store'
import { useAuthStore }     from '~/stores/auth.store'
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

const cartStore     = useCartStore()
const wishlistStore = useWishlistStore()
const ui            = useUiStore()
const auth          = useAuthStore()

const addingToCart         = ref(false)
const addingToCartWholesale = ref(false)
const cartButtonRef        = ref(null)
const shareCopied          = ref(false)

// ── Variants ──────────────────────────────────────────────────────
const colorVariants  = computed(() => props.product?.variants ?? [])
const selectedVariant = ref(null)

watch(() => props.product, (p) => {
  if (p?.variants?.length) selectedVariant.value = p.variants[0]
}, { immediate: true })

// ── Wholesale qty stepper ─────────────────────────────────────────
const wholesaleMinQty = computed(() => selectedVariant.value?.wholesaleMinQty || 10)
const wholesaleQty    = ref(10)
const wholesaleLineTotal = computed(() =>
  wholesaleDiscountedPrice.value * wholesaleQty.value
)

watch(wholesaleMinQty, (v) => { wholesaleQty.value = v }, { immediate: true })

const wholesaleQtyExceedsStock = computed(() => {
  const stock = selectedVariant.value?.stock ?? Infinity
  return wholesaleQty.value > stock
})

function decreaseWholesaleQty() {
  const next = wholesaleQty.value - wholesaleMinQty.value
  if (next >= wholesaleMinQty.value) wholesaleQty.value = next
}

function onWholesaleQtyChange() {
  const stock = selectedVariant.value?.stock ?? Infinity
  if (!wholesaleQty.value || wholesaleQty.value < wholesaleMinQty.value) {
    wholesaleQty.value = wholesaleMinQty.value
  } else if (wholesaleQty.value > stock) {
    wholesaleQty.value = stock
  }
}

function selectVariant(variant) {
  if (variant.stock === 0) return
  selectedVariant.value = variant
  emit('variant-change', variant)
}

// ── Price / discount ──────────────────────────────────────────────
const discountPercent = computed(() => {
  const v = selectedVariant.value
  if (!v?.comparePrice || !v?.price) return 0
  return calcDiscount(v.comparePrice, v.price)
})

const systemDiscountPct   = computed(() => props.product?.discountPercentage ?? 0)
const wholesaleDiscountPct = computed(() => props.product?.wholesaleDiscountPercentage ?? 0)

// Discounted wholesale price for the currently selected variant
const wholesaleDiscountedPrice = computed(() => {
  const base = selectedVariant.value?.wholesalePrice || 0
  if (!base || wholesaleDiscountPct.value <= 0) return base
  return Math.round(base * (1 - wholesaleDiscountPct.value / 100))
})

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

async function handleAddToCartWholesale() {
  if (!isInStock.value || addingToCartWholesale.value) return
  addingToCartWholesale.value = true
  try {
    await cartStore.addItem(props.product._id, selectedVariant.value?._id, wholesaleQty.value)
    ui.addToast(`${formatNumber(wholesaleQty.value)} عدد به سبد عمده افزوده شد ✓`, 'success')
    emit('add-to-cart', selectedVariant.value?._id)
  } catch (e) {
    ui.addToast(e?.response?.data?.message || 'خطا در افزودن به سبد عمده', 'error')
  } finally {
    addingToCartWholesale.value = false
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

defineExpose({ cartButtonRef })
</script>

<style scoped>
.pi-qty-input::-webkit-inner-spin-button,
.pi-qty-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.pi-qty-input { -moz-appearance: textfield; appearance: textfield; }
</style>
