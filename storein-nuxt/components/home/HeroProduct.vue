<template>
  <section v-if="loading || product" class="hero-prod">
    <!-- Loading skeleton -->
    <template v-if="loading">
      <div class="hero-prod__skel">
        <BaseSkeleton height="100%" class="rounded-[20px]" />
      </div>
    </template>

    <!-- Real product -->
    <div v-else class="hero-prod__card">
      <!-- Atmospheric layers -->
      <div class="hero-prod__mesh" aria-hidden="true" />
      <div class="hero-prod__glow" aria-hidden="true" />

      <div class="hero-prod__body">
        <div class="hero-prod__copy">
          <span class="hero-prod__eyebrow">پیشنهاد ویژه</span>
          <h1 class="hero-prod__title">{{ product.name }}</h1>
          <div class="hero-prod__price-row">
            <span v-if="comparePrice > price" class="hero-prod__compare font-fanum">
              {{ formatPrice(comparePrice) }}
            </span>
            <span class="hero-prod__price font-fanum">{{ formatPrice(price) }}</span>
          </div>

          <button
            type="button"
            class="hero-prod__btn tactile"
            :disabled="buying"
            @click="handleBuyNow"
          >
            {{ buying ? '...' : 'خرید فوری' }}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                 stroke-width="2.5" stroke="currentColor" class="hero-prod__btn-ico" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Product photo — bleeds past its own box so it reads as part of the
           scene rather than a rectangle dropped on top of it -->
      <NuxtLink :to="`/product/${product.slug}`" class="hero-prod__img-wrap" :aria-label="product.name">
        <img
          :src="imgSrc"
          :alt="product.name"
          class="hero-prod__img"
          loading="eager"
          @error="imgError = true"
        />
      </NuxtLink>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { productService } from '~/services/product.service'
import { useCartStore } from '~/stores/cart.store'
import { useUiStore }   from '~/stores/ui.store'
import { formatPrice }  from '~/utils/formatters'
import { PRODUCT_PLACEHOLDER } from '~/utils/constants'
import BaseSkeleton from '~/components/common/BaseSkeleton.vue'

const router    = useRouter()
const cartStore = useCartStore()
const ui        = useUiStore()

const product = ref(null)
const loading = ref(true)
const buying  = ref(false)
const imgError = ref(false)

function resolveImg(p) {
  if (!p) return PRODUCT_PLACEHOLDER
  if (p.thumbnail) return p.thumbnail
  const img = p.images?.[0]
  if (!img) return PRODUCT_PLACEHOLDER
  if (typeof img === 'string') return img
  return img.url || img.thumbnail || PRODUCT_PLACEHOLDER
}

const imgSrc = computed(() => imgError.value ? PRODUCT_PLACEHOLDER : resolveImg(product.value))

const featuredVariant = computed(() => {
  const variants = (product.value?.variants ?? []).filter(
    v => v.isActive !== false && v.price > 0 && v.comparePrice > v.price,
  )
  if (!variants.length) return null
  return variants.reduce((best, v) =>
    (1 - v.price / v.comparePrice) > (1 - best.price / best.comparePrice) ? v : best,
  )
})

const price = computed(() => featuredVariant.value?.price ?? product.value?.finalPrice ?? product.value?.minPrice ?? 0)
const comparePrice = computed(() => featuredVariant.value?.comparePrice ?? product.value?.minPrice ?? 0)

async function handleBuyNow() {
  if (!product.value || buying.value) return
  buying.value = true
  try {
    const variant = featuredVariant.value
      ?? product.value.variants?.find(v => v.stock > 0 && v.isActive !== false)
      ?? product.value.variants?.[0]
    if (!variant?._id) {
      router.push(`/product/${product.value.slug}`)
      return
    }
    await cartStore.addItem(product.value._id, variant._id, 1)
    router.push('/checkout')
  } catch {
    ui.addToast('خطا در افزودن به سبد خرید', 'error')
  } finally {
    buying.value = false
  }
}

onMounted(async () => {
  try {
    const { data } = await productService.getAll({
      hasDiscount: true, inStock: true, limit: 1, status: 'active', sort: 'discount',
    })
    const items = data?.products ?? data?.items ?? []
    product.value = items[0] ?? null
  } catch {
    product.value = null
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.hero-prod {
  width: 100%;
  margin-top: 0.75rem;
}

.hero-prod__skel {
  height: 220px;
  border-radius: 20px;
  overflow: hidden;
}
@media (min-width: 768px) {
  .hero-prod__skel { height: 280px; }
}

.hero-prod__card {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(155deg, #1A3620 0%, #14291A 60%, #0E1712 100%);
  min-height: 240px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.05);
}
@media (min-width: 768px) {
  .hero-prod__card { min-height: 320px; }
}

/* subtle dot-mesh texture, consistent with other dark sections */
.hero-prod__mesh {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 22px 22px;
  pointer-events: none;
}

/* soft emerald atmosphere behind the product photo */
.hero-prod__glow {
  position: absolute;
  z-index: 0;
  inset-inline-end: -10%;
  bottom: -30%;
  width: 70%;
  aspect-ratio: 1 / 1;
  background: radial-gradient(circle, rgba(110,176,130,0.28) 0%, transparent 70%);
  filter: blur(20px);
  pointer-events: none;
}

.hero-prod__body {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  padding: 1.5rem 1.25rem;
  min-height: 240px;
}
@media (min-width: 768px) {
  .hero-prod__body { padding: 2rem 2.5rem; min-height: 320px; }
}

.hero-prod__copy {
  flex: 1 1 auto;
  min-width: 0;
  max-width: 60%;
}
@media (min-width: 768px) {
  .hero-prod__copy { max-width: 52%; }
}

.hero-prod__eyebrow {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: rgba(255,255,255,0.85);
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  padding: 4px 12px;
  border-radius: 99px;
  margin-bottom: 12px;
}

.hero-prod__title {
  font-size: 1.05rem;
  font-weight: 900;
  color: #ffffff;
  line-height: 1.4;
  margin: 0 0 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
@media (min-width: 768px) {
  .hero-prod__title { font-size: 1.6rem; margin-bottom: 14px; }
}

.hero-prod__price-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.hero-prod__compare {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.5);
  text-decoration: line-through;
}

.hero-prod__price {
  font-size: 1.05rem;
  font-weight: 800;
  color: #ffffff;
}
@media (min-width: 768px) {
  .hero-prod__price { font-size: 1.35rem; }
}

.hero-prod__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 0.875rem;
  padding: 12px 22px;
  min-height: 44px;
  border-radius: 12px;
  cursor: pointer;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid rgba(255,255,255,0.5);
  color: #14291A;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.6), 0 8px 20px rgba(0,0,0,0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}
.hero-prod__btn:hover {
  transform: translateY(-2px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.6), 0 12px 28px rgba(0,0,0,0.32);
}
.hero-prod__btn:active { transform: scale(0.96); }
.hero-prod__btn:disabled { opacity: 0.6; cursor: not-allowed; }
.hero-prod__btn-ico { width: 16px; height: 16px; }

/* Product photo bleeds off the card's trailing/bottom edge instead of
   sitting centered in its own rectangle — reads as part of the scene. */
.hero-prod__img-wrap {
  position: absolute;
  z-index: 1;
  inset-inline-end: -6%;
  bottom: -8%;
  width: 52%;
  max-width: 220px;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
@media (min-width: 768px) {
  .hero-prod__img-wrap { width: 40%; max-width: 300px; bottom: -10%; }
}

.hero-prod__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 20px 30px rgba(0,0,0,0.45));
  transition: transform 300ms ease;
}
.hero-prod__img-wrap:hover .hero-prod__img { transform: scale(1.04) translateY(-4px); }
</style>
