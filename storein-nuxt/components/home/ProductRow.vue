<template>
  <section class="prow">
    <!-- Section header -->
    <div class="prow__head">
      <div class="prow__title-wrap">
        <span class="prow__accent" aria-hidden="true" />
        <h2 class="prow__title">{{ title }}</h2>
      </div>
      <NuxtLink :to="link" class="prow__all">
        مشاهده همه
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
             stroke-width="2" stroke="currentColor" class="w-4 h-4 rtl:rotate-180">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
        </svg>
      </NuxtLink>
    </div>

    <!-- Scrollable row + arrows -->
    <div class="relative group">
      <!-- Right arrow -->
      <button
        class="prow__arr prow__arr--r"
        :disabled="atStart"
        @click="scrollToStart"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
             stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
        </svg>
      </button>

      <!-- Scrollable container -->
      <div ref="scrollEl" class="prow__scroll" @scroll="onScroll">
        <!-- Skeleton -->
        <template v-if="loading">
          <div v-for="i in skeletonCount" :key="i" class="prow__skel"
               :style="featured ? 'min-width:295px;max-width:295px' : 'min-width:200px;max-width:200px'">
            <BaseSkeleton height="160px" class="rounded-none" />
            <div class="p-3 space-y-2">
              <BaseSkeleton height="0.875rem" />
              <BaseSkeleton height="0.875rem" width="60%" />
              <BaseSkeleton height="0.75rem" width="40%" />
              <BaseSkeleton height="2rem" class="mt-1" />
            </div>
          </div>
        </template>

        <!-- Real products -->
        <template v-else>
          <div
            v-for="product in products"
            :key="product._id"
            :class="featured ? 'min-w-[295px] max-w-[295px]' : 'min-w-[200px] max-w-[200px]'"
            class="flex-shrink-0"
          >
            <BaseFeaturedCard
              v-if="featured"
              :product="product"
              :wishlist="wishlistStore.isInWishlist(product._id)"
              @toggle-wish="wishlistStore.toggle(product._id)"
            />
            <BaseProductCard
              v-else
              :product="product"
              :wishlist="wishlistStore.isInWishlist(product._id)"
              @add-to-cart="handleAddToCart(product)"
              @buy-now="handleBuyNow(product)"
              @toggle-wish="wishlistStore.toggle(product._id)"
            />
          </div>
          <BaseEmpty v-if="products.length === 0" title="محصولی یافت نشد" icon="🛍️" class="min-w-full" />
        </template>
      </div>

      <!-- Left arrow -->
      <button
        class="prow__arr prow__arr--l"
        :disabled="atEnd"
        @click="scrollToEnd"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
             stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
        </svg>
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter }       from 'vue-router'
import { useCartStore }    from '~/stores/cart.store'
import { useWishlistStore } from '~/stores/wishlist.store'
import { useUiStore }      from '~/stores/ui.store'
import BaseProductCard  from '~/components/common/BaseProductCard.vue'
import BaseFeaturedCard from '~/components/common/BaseFeaturedCard.vue'
import BaseSkeleton     from '~/components/common/BaseSkeleton.vue'
import BaseEmpty        from '~/components/common/BaseEmpty.vue'
import { useGsapReveal } from '~/composables/useGsapReveal'

const props = defineProps({
  title:         { type: String,  required: true },
  link:          { type: String,  default: '/products' },
  products:      { type: Array,   default: () => [] },
  loading:       { type: Boolean, default: false },
  skeletonCount: { type: Number,  default: 5 },
  featured:      { type: Boolean, default: false },
})

const router        = useRouter()
const cartStore     = useCartStore()
const wishlistStore = useWishlistStore()
const ui            = useUiStore()

const scrollEl = ref(null)
const atStart  = ref(true)
const atEnd    = ref(false)

useGsapReveal(scrollEl, { y: 16, stagger: 0.06 })

function getAbsScrollLeft(el) {
  return Math.abs(el.scrollLeft)
}

function onScroll() {
  const el = scrollEl.value
  if (!el) return
  const abs      = getAbsScrollLeft(el)
  const maxScroll = el.scrollWidth - el.clientWidth
  atStart.value = abs <= 10
  atEnd.value   = abs >= maxScroll - 10
}

function scrollToStart() {
  scrollEl.value?.scrollBy({ left: 600, behavior: 'smooth' })
}

function scrollToEnd() {
  scrollEl.value?.scrollBy({ left: -600, behavior: 'smooth' })
}

async function handleAddToCart(product) {
  const variant = product.variants?.find(v => v.stock > 0 && v.isActive !== false) ?? product.variants?.[0]
  if (!variant?._id) { ui.addToast('این محصول در حال حاضر قابل سفارش نیست', 'error'); return }
  try {
    await cartStore.addItem(product._id, variant._id, 1)
    ui.addToast('محصول به سبد خرید افزوده شد', 'success')
  } catch {
    ui.addToast('خطا در افزودن به سبد خرید', 'error')
  }
}

async function handleBuyNow(product) {
  const variant = product.variants?.find(v => v.stock > 0 && v.isActive !== false) ?? product.variants?.[0]
  if (!variant?._id) { ui.addToast('این محصول در حال حاضر قابل سفارش نیست', 'error'); return }
  try {
    await cartStore.addItem(product._id, variant._id, 1)
    router.push('/checkout')
  } catch {
    ui.addToast('خطا در افزودن به سبد خرید', 'error')
  }
}

onMounted(() => onScroll())
</script>

<style scoped>
/* ── Section ──────────────────────────────────────── */
.prow {
  padding: 0.25rem 0;
}

/* ── Header ───────────────────────────────────────── */
.prow__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.prow__title-wrap {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.prow__accent {
  display: block;
  width: 4px;
  height: 22px;
  background: linear-gradient(180deg, var(--brand-light) 0%, var(--brand) 100%);
  border-radius: 99px;
  flex-shrink: 0;
}

.prow__title {
  font-size: 1.0625rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: 0.01em;
}

.prow__all {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--brand-light);
  text-decoration: none;
  transition: gap 0.2s ease, opacity 0.2s ease;
}
[data-theme='light'] .prow__all { color: var(--brand-dark); }
.prow__all:hover { gap: 8px; opacity: 0.8; }

/* ── Scroll area ──────────────────────────────────── */
.prow__scroll {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding: 0.5rem 0.125rem 0.75rem;
  scrollbar-width: none;
}
.prow__scroll::-webkit-scrollbar { display: none; }

.prow__skel {
  border-radius: 14px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--glass);
}

/* ── Arrows ───────────────────────────────────────── */
.prow__arr {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 38px; height: 38px;
  border-radius: 50%;
  background: var(--glass-strong);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid var(--glass-border);
  color: var(--text-primary);
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  transition: box-shadow 0.2s ease, opacity 0.2s ease;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  opacity: 0;
}

.relative:hover .prow__arr:not(:disabled) { opacity: 1; }
.prow__arr:disabled { opacity: 0 !important; pointer-events: none; }
.prow__arr:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.15); }

@media (min-width: 768px) {
  .prow__arr { display: flex; }
}

.prow__arr--r { right: 0; transform: translateY(-50%) translateX(50%); }
.prow__arr--l { left: 0;  transform: translateY(-50%) translateX(-50%); }
</style>
