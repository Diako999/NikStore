<template>
  <section class="flash">
    <!-- Header -->
    <div class="flash__head">
      <div class="flash__title-wrap">
        <div class="flash__flame" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
            <path d="M12 2C9 7 6 9 6 13a6 6 0 0012 0c0-4-3-6-6-11zm0 16a4 4 0 01-4-4c0-2.5 2-4.2 4-7.2 2 3 4 4.7 4 7.2a4 4 0 01-4 4z"/>
          </svg>
        </div>
        <h2 class="flash__title">فروش ویژه</h2>
      </div>

      <!-- Countdown -->
      <div class="flash__timer">
        <span class="flash__timer-lbl">پایان امروز</span>
        <div class="flash__timer-digits">
          <template v-for="(unit, idx) in timerUnits" :key="unit.key">
            <div class="flash__digit">
              <span class="flash__digit-val font-fanum">{{ unit.value }}</span>
              <span class="flash__digit-key">{{ unit.label }}</span>
            </div>
            <span v-if="idx < timerUnits.length - 1" class="flash__sep">:</span>
          </template>
        </div>
      </div>

      <NuxtLink to="/products?sort=discount" class="flash__all">
        مشاهده همه
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
             stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 rtl:rotate-180">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
        </svg>
      </NuxtLink>
    </div>

    <!-- Products -->
    <div class="flash__products">
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter }       from 'vue-router'
import { productService }  from '~/services/product.service'
import { useCartStore }    from '~/stores/cart.store'
import { useWishlistStore } from '~/stores/wishlist.store'
import { useUiStore }      from '~/stores/ui.store'
import BaseProductCard from '~/components/common/BaseProductCard.vue'
import BaseSkeleton    from '~/components/common/BaseSkeleton.vue'

const router        = useRouter()
const cartStore     = useCartStore()
const wishlistStore = useWishlistStore()
const ui            = useUiStore()
const { getTimeRemaining } = useDiscount()

const products      = ref([])
const loading       = ref(true)
const flashEndDate  = ref(null)
const timeLeft      = ref(null)
let timerInterval   = null

const timerUnits = computed(() => {
  if (!timeLeft.value) return []
  return [
    { key: 'hours',   value: String(timeLeft.value.hours).padStart(2, '0'),   label: 'ساعت' },
    { key: 'minutes', value: String(timeLeft.value.minutes).padStart(2, '0'), label: 'دقیقه' },
    { key: 'seconds', value: String(timeLeft.value.seconds).padStart(2, '0'), label: 'ثانیه' },
  ]
})

function updateTimer() {
  if (flashEndDate.value) {
    timeLeft.value = getTimeRemaining(flashEndDate.value)
  } else {
    // fallback: end of day
    const d = new Date(); d.setHours(23, 59, 59, 0)
    const diff = d.getTime() - Date.now()
    timeLeft.value = diff > 0 ? {
      hours:   Math.floor(diff / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    } : null
  }
}

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
  updateTimer()
  timerInterval = setInterval(updateTimer, 1000)
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
onUnmounted(() => clearInterval(timerInterval))
</script>

<style scoped>
/* ── Root ─────────────────────────────────────────── */
.flash {
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(135deg, #171717 0%, #232323 45%, #1A3620 100%);
  position: relative;
}

/* subtle noise overlay */
.flash::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 22px 22px;
  pointer-events: none;
}

/* ── Header ──────────────────────────────────────── */
.flash__head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 1.1rem 1.25rem 0.75rem;
  position: relative;
  z-index: 1;
}

.flash__title-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.flash__flame {
  width: 36px; height: 36px;
  background: rgba(255,180,0,0.18);
  border: 1px solid rgba(255,180,0,0.3);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFC107;
  flex-shrink: 0;
}

.flash__title {
  font-size: 1.25rem;
  font-weight: 900;
  color: #ffffff;
}

/* Countdown */
.flash__timer {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  background: rgba(0,0,0,0.25);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 0.45rem 0.875rem;
  margin-right: auto;
}

.flash__timer-lbl {
  font-size: 0.65rem;
  color: rgba(255,255,255,0.55);
  white-space: nowrap;
}

.flash__timer-digits {
  display: flex;
  align-items: center;
  gap: 4px;
}

.flash__digit {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 32px;
  background: rgba(255,255,255,0.1);
  border-radius: 7px;
  padding: 4px 6px;
}

.flash__digit-val {
  font-size: 1.05rem;
  font-weight: 800;
  color: #ffffff;
  line-height: 1;
  letter-spacing: 0.02em;
}

.flash__digit-key {
  font-size: 0.5rem;
  color: rgba(255,255,255,0.45);
  margin-top: 1px;
}

.flash__sep {
  color: rgba(255,255,255,0.4);
  font-weight: 700;
  font-size: 1rem;
  padding-bottom: 6px;
}

.flash__all {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(255,255,255,0.65);
  text-decoration: none;
  transition: color 0.2s ease;
  white-space: nowrap;
}
.flash__all:hover { color: #ffffff; }

/* ── Products row ────────────────────────────────── */
.flash__products {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding: 0.25rem 1.25rem 1.25rem;
  scrollbar-width: none;
  position: relative;
  z-index: 1;
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
  background-color: var(--color-card);
}

.flash__empty {
  width: 100%;
  text-align: center;
  padding: 2.5rem 0;
  color: rgba(255,255,255,0.5);
  font-size: 0.875rem;
}
</style>
