<template>
  <section v-if="loading || product" class="hero-prod" ref="rootRef">
    <!-- Loading skeleton -->
    <template v-if="loading">
      <div class="hero-prod__skel">
        <BaseSkeleton height="100%" class="rounded-[0_0_40px_40px]" />
      </div>
    </template>

    <!-- Real product -->
    <div v-else class="hero-prod__stage">
      <!-- Decorative Three.js aurora layer, progressive enhancement over the
           static CSS aurora-mesh already painted behind the whole page —
           sits fully behind the hero banner, reads through its scrim edges -->
      <GlassAuroraScene class="hero-prod__aurora" />

      <GlassHeroBanner :image="imgSrc" class="hero-prod__banner">
        <span class="hero-prod__eyebrow">پیشنهاد ویژه</span>
        <h1 class="hero-prod__title">{{ product.name }}</h1>
        <div class="hero-prod__price-row">
          <span v-if="comparePrice > price" class="hero-prod__compare font-fanum">
            {{ formatPrice(comparePrice) }}
          </span>
          <span class="hero-prod__price font-fanum">{{ formatPrice(price) }} <small>تومان</small></span>
        </div>

        <GlassButton :loading="buying" @click="handleBuyNow">
          خرید فوری
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
               stroke-width="2.5" stroke="currentColor" class="hero-prod__btn-ico" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12l-7.5 7.5M21 12H3"/>
          </svg>
        </GlassButton>
      </GlassHeroBanner>
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
import BaseSkeleton  from '~/components/common/BaseSkeleton.vue'
import GlassHeroBanner  from '~/components/glass/HeroBanner.vue'
import GlassButton      from '~/components/glass/GlassButton.vue'
import GlassAuroraScene from '~/components/glass/AuroraScene.vue'
import { useGsapReveal } from '~/composables/useGsapReveal'

const router    = useRouter()
const cartStore = useCartStore()
const ui        = useUiStore()

const product = ref(null)
const loading = ref(true)
const buying  = ref(false)
const imgError = ref(false)
const rootRef = ref(null)

useGsapReveal(rootRef, { y: 16, duration: 0.7 })

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
  margin-top: 0;
}

.hero-prod__skel {
  height: 300px;
  border-radius: 0 0 40px 40px;
  overflow: hidden;
}
@media (min-width: 768px) {
  .hero-prod__skel { height: 360px; }
}

.hero-prod__stage {
  position: relative;
}

.hero-prod__aurora {
  z-index: 0;
}

.hero-prod__banner {
  position: relative;
  z-index: 1;
}

.hero-prod__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: var(--glass-strong);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  padding: 4px 10px;
  border-radius: 999px;
  margin-bottom: 12px;
  position: relative;
  z-index: 3;
}
.hero-prod__eyebrow::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--brand-light);
}

.hero-prod__title {
  font-size: 1.15rem;
  line-height: 1.4;
  font-weight: 700;
  margin: 0 0 10px;
  position: relative;
  z-index: 3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
@media (min-width: 768px) {
  .hero-prod__title { font-size: 1.6rem; }
}

.hero-prod__price-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
  position: relative;
  z-index: 3;
}
.hero-prod__price { font-size: 16px; font-weight: 700; }
.hero-prod__price small { font-size: 11px; font-weight: 500; opacity: 0.75; }
.hero-prod__compare { font-size: 12px; opacity: 0.6; text-decoration: line-through; }

.hero-prod__btn-ico { width: 16px; height: 16px; }
</style>
