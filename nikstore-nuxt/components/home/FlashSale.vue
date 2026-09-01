<template>
  <section class="flash">
    <!-- Countdown strip -->
    <GlassFlashSaleStrip
      title="⚡ فروش ویژه امروز"
      subtitle="تا پایان امشب، تخفیف‌های محدود"
      :ends-at="flashEndDate || defaultEndOfDay"
    />

    <!-- Header row -->
    <div class="flash__head">
      <h2 class="flash__title">فروش ویژه</h2>
      <NuxtLink to="/products?sort=discount" class="flash__all">
        مشاهده همه
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
             stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 rtl:rotate-180">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
        </svg>
      </NuxtLink>
    </div>

    <!-- Products -->
    <div ref="rowRef" class="flash__products">
      <template v-if="loading">
        <div v-for="i in 5" :key="i" class="flash__skeleton">
          <BaseSkeleton height="150px" class="rounded-none" />
          <div class="p-3 space-y-2">
            <BaseSkeleton height="0.875rem" />
            <BaseSkeleton height="0.875rem" width="65%" />
            <BaseSkeleton height="1.75rem" class="mt-1" />
          </div>
        </div>
      </template>
      <template v-else>
        <div v-for="product in products" :key="product._id" class="flash__card">
          <BaseProductCard
            :product="product"
            :wishlist="wishlistStore.isInWishlist(product._id)"
            @add-to-cart="handleAddToCart(product)"
            @buy-now="handleBuyNow(product)"
            @toggle-wish="wishlistStore.toggle(product._id)"
          />
        </div>
        <div v-if="products.length === 0" class="flash__empty">
          محصولی برای فروش ویژه یافت نشد
        </div>
      </template>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter }       from 'vue-router'
import { productService }  from '~/services/product.service'
import { useCartStore }    from '~/stores/cart.store'
import { useWishlistStore } from '~/stores/wishlist.store'
import { useUiStore }      from '~/stores/ui.store'
import BaseProductCard from '~/components/common/BaseProductCard.vue'
import BaseSkeleton    from '~/components/common/BaseSkeleton.vue'
import GlassFlashSaleStrip from '~/components/glass/FlashSaleStrip.vue'
import { useGsapReveal } from '~/composables/useGsapReveal'

const router        = useRouter()
const cartStore     = useCartStore()
const wishlistStore = useWishlistStore()
const ui            = useUiStore()

const products      = ref([])
const loading       = ref(true)
const flashEndDate  = ref(null)
const rowRef        = ref(null)

// Stable fallback so SSR/client markup agree — end of "today" computed once.
const defaultEndOfDay = (() => {
  const d = new Date(); d.setHours(23, 59, 59, 0)
  return d
})()

useGsapReveal(rowRef, { y: 16, stagger: 0.06 })

async function handleAddToCart(product) {
  const variant = product.variants?.find(v => v.stock > 0 && v.isActive !== false) ?? product.variants?.[0]
  if (!variant?._id) { ui.addToast('این محصول قابل سفارش نیست', 'error'); return }
  try {
    await cartStore.addItem(product._id, variant._id, 1)
    ui.addToast('محصول به سبد خرید افزوده شد', 'success')
  } catch {
    ui.addToast('خطا در افزودن به سبد خرید', 'error')
  }
}

async function handleBuyNow(product) {
  const variant = product.variants?.find(v => v.stock > 0 && v.isActive !== false) ?? product.variants?.[0]
  if (!variant?._id) { ui.addToast('این محصول قابل سفارش نیست', 'error'); return }
  try {
    await cartStore.addItem(product._id, variant._id, 1)
    router.push('/checkout')
  } catch {
    ui.addToast('خطا در افزودن به سبد خرید', 'error')
  }
}

onMounted(async () => {
  try {
    const [productRes, activeRes] = await Promise.all([
      productService.getAll({ hasDiscount: true, inStock: true, limit: 8, status: 'active' }),
      $fetch('/api/v1/discounts/active').catch(() => ({ data: [] })),
    ])
    products.value = productRes?.data?.products ?? productRes?.data?.items ?? []
    const actives = activeRes?.data ?? []
    if (actives.length) {
      flashEndDate.value = actives.reduce((earliest, d) =>
        !earliest || new Date(d.endDate) < new Date(earliest) ? d.endDate : earliest,
        null,
      )
    }
  } catch {
    products.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.flash__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 1rem 0.25rem 0.75rem;
}

.flash__title {
  font-size: 1.0625rem;
  font-weight: 800;
  color: var(--text-primary);
}

.flash__all {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--brand-light);
  text-decoration: none;
  transition: gap 0.2s ease, opacity 0.2s ease;
}
[data-theme='light'] .flash__all { color: var(--brand-dark); }
.flash__all:hover { gap: 8px; opacity: 0.8; }

/* ── Products row ────────────────────────────────── */
.flash__products {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding: 0.25rem 0.125rem 0.75rem;
  scrollbar-width: none;
}
.flash__products::-webkit-scrollbar { display: none; }

.flash__card {
  min-width: 175px;
  max-width: 175px;
  flex-shrink: 0;
}

.flash__skeleton {
  min-width: 175px;
  border-radius: 14px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--glass);
}

.flash__empty {
  width: 100%;
  text-align: center;
  padding: 2.5rem 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}
</style>
