<template>
  <section class="mv">

    <!-- Header -->
    <div class="mv__head">
      <div class="mv__title-wrap">
        <div class="mv__icon-wrap" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
               stroke-linecap="round" stroke-linejoin="round" class="mv__icon-svg">
            <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z"/>
            <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
          </svg>
        </div>
        <div>
          <h2 class="mv__title">پربازدیدترین‌ها</h2>
          <p class="mv__sub">محبوب‌ترین انتخاب‌های مشتریان ما</p>
        </div>
      </div>

      <NuxtLink to="/products?sort=mostViewed" class="mv__all">
        مشاهده همه
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
             stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 rtl:rotate-180">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
        </svg>
      </NuxtLink>
    </div>

    <!-- Products -->
    <div class="mv__products">
      <template v-if="loading">
        <div v-for="i in 6" :key="i" class="mv__skeleton">
          <BaseSkeleton height="150px" class="rounded-none" />
          <div class="p-3 space-y-2">
            <BaseSkeleton height="0.875rem" />
            <BaseSkeleton height="0.875rem" width="65%" />
            <BaseSkeleton height="1.75rem" class="mt-1" />
          </div>
        </div>
      </template>
      <template v-else>
        <div v-for="(product, idx) in products" :key="product._id" class="mv__card-wrap">
          <!-- Rank badge -->
          <div :class="['mv__rank', idx < 3 && 'mv__rank--top']">
            <span v-if="idx === 0">🥇</span>
            <span v-else-if="idx === 1">🥈</span>
            <span v-else-if="idx === 2">🥉</span>
            <span v-else class="mv__rank-num font-fanum">{{ idx + 1 }}</span>
          </div>
          <!-- View count badge -->
          <div class="mv__views">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                 stroke-linecap="round" stroke-linejoin="round" class="mv__views-icon">
              <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z"/>
              <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
            </svg>
            <span class="mv__views-count font-fanum">{{ formatViewCount(product.viewCount) }}</span>
          </div>
          <BaseProductCard
            :product="product"
            :wishlist="wishlistStore.isInWishlist(product._id)"
            @add-to-cart="handleAddToCart(product)"
            @buy-now="handleBuyNow(product)"
            @toggle-wish="wishlistStore.toggle(product._id)"
          />
        </div>
        <div v-if="products.length === 0" class="mv__empty">
          محصولی یافت نشد
        </div>
      </template>
    </div>

  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter }        from 'vue-router'
import { productService }   from '~/services/product.service'
import { useCartStore }     from '~/stores/cart.store'
import { useWishlistStore } from '~/stores/wishlist.store'
import { useUiStore }       from '~/stores/ui.store'
import BaseProductCard from '~/components/common/BaseProductCard.vue'
import BaseSkeleton    from '~/components/common/BaseSkeleton.vue'

const router        = useRouter()
const cartStore     = useCartStore()
const wishlistStore = useWishlistStore()
const ui            = useUiStore()

const products = ref([])
const loading  = ref(true)

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

function formatViewCount(count = 0) {
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(count)
}

onMounted(async () => {
  try {
    const { data } = await productService.getAll({ sort: 'mostViewed', status: 'active', limit: 10 })
    products.value = data?.products ?? data?.items ?? []
  } catch {
    products.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* ── Root ──────────────────────────────────────────── */
.mv {
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  background: linear-gradient(135deg, #0d1f0f 0%, #0a2e12 50%, #061a09 100%);
  border: 1px solid rgba(57,255,20,0.15);
}

/* Dot mesh */
.mv::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(57,255,20,0.06) 1px, transparent 1px);
  background-size: 22px 22px;
  pointer-events: none;
}

/* Neon glow blob */
.mv::after {
  content: '';
  position: absolute;
  top: -80px;
  left: 25%;
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, rgba(57,255,20,0.12) 0%, transparent 60%);
  pointer-events: none;
}

/* ── Header ──────────────────────────────────────────── */
.mv__head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 1.25rem 1.375rem 0.875rem;
  position: relative;
  z-index: 1;
}

.mv__title-wrap {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.mv__icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 13px;
  background: rgba(57,255,20,0.12);
  border: 1px solid rgba(57,255,20,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 0 12px rgba(57,255,20,0.2);
}

.mv__icon-svg {
  width: 22px;
  height: 22px;
  color: #39ff14;
  filter: drop-shadow(0 0 4px rgba(57,255,20,0.7));
}

.mv__title {
  font-size: 1.25rem;
  font-weight: 900;
  color: #ffffff;
  margin: 0;
  line-height: 1.2;
  text-shadow: 0 0 20px rgba(57,255,20,0.25);
}

.mv__sub {
  font-size: 0.7rem;
  color: rgba(255,255,255,0.42);
  margin: 3px 0 0;
}

.mv__all {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(57,255,20,0.7);
  text-decoration: none;
  margin-right: auto;
  transition: color 0.2s ease, gap 0.2s ease;
}
.mv__all:hover { color: #39ff14; gap: 8px; }

/* ── Products ──────────────────────────────────────── */
.mv__products {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding: 0.25rem 1.375rem 1.375rem;
  scrollbar-width: none;
  position: relative;
  z-index: 1;
}
.mv__products::-webkit-scrollbar { display: none; }

.mv__card-wrap {
  position: relative;
  min-width: 175px;
  max-width: 175px;
  flex-shrink: 0;
}

.mv__skeleton {
  min-width: 175px;
  border-radius: 14px;
  overflow: hidden;
  flex-shrink: 0;
  background-color: var(--color-card);
}

/* ── Rank badge ─────────────────────────────────────── */
.mv__rank {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 20;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(57,255,20,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  pointer-events: none;
  box-shadow: 0 0 8px rgba(57,255,20,0.2);
}

.mv__rank--top {
  background: rgba(0,0,0,0.5);
  font-size: 0.9rem;
  width: 28px;
  height: 28px;
}

.mv__rank-num {
  color: #39ff14;
  font-weight: 700;
  font-size: 0.65rem;
  filter: drop-shadow(0 0 3px rgba(57,255,20,0.8));
}

/* ── View count badge ───────────────────────────────── */
.mv__views {
  position: absolute;
  bottom: 8px;
  right: 8px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 20px;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(57,255,20,0.25);
  pointer-events: none;
}

.mv__views-icon {
  width: 11px;
  height: 11px;
  color: #39ff14;
  flex-shrink: 0;
  filter: drop-shadow(0 0 3px rgba(57,255,20,0.7));
}

.mv__views-count {
  font-size: 0.6rem;
  font-weight: 700;
  color: rgba(255,255,255,0.85);
  line-height: 1;
  direction: ltr;
}

.mv__empty {
  width: 100%;
  text-align: center;
  padding: 2.5rem 0;
  color: rgba(255,255,255,0.4);
  font-size: 0.875rem;
}
</style>
