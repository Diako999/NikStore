<template>
  <div class="product-page">
    <div class="product-page__topbar">
      <button type="button" class="product-page__back" aria-label="بازگشت" @click="$router.back()">
        <AppIcon name="chevron-right" :size="16" :stroke-width="2" />
      </button>
      <button
        type="button"
        class="product-page__wish"
        :class="{ 'product-page__wish--active': wished }"
        aria-label="افزودن به علاقه‌مندی‌ها"
        @click="wishlistStore.toggle(product._id)"
      >
        <AppIcon name="heart" :size="16" :stroke-width="2" :filled="wished" />
      </button>
    </div>

    <div class="product-page__gallery">
      <ProductGallery :images="galleryImages" :alt="product.name" />
    </div>

    <div class="product-page__body">
      <p v-if="categoryName" class="product-page__cat">{{ categoryName }}</p>
      <h1 class="product-page__name">{{ product.name }}</h1>

      <div v-if="product.reviewCount" class="product-page__rating">
        <AppIcon v-for="i in 5" :key="i" name="star" :size="12" :filled="i <= Math.round(product.avgRating)" />
        <span>{{ toPersianDigits(product.avgRating) }} ({{ toPersianDigits(product.reviewCount) }} نظر)</span>
      </div>

      <div class="product-page__price-row">
        <span v-if="displayCompare" class="product-page__compare">{{ formatPrice(displayCompare) }}</span>
        <span class="product-page__price">{{ formatPrice(displayPrice) }}</span>
        <span v-if="discountPct" class="product-page__discount">٪{{ toPersianDigits(discountPct) }} تخفیف</span>
      </div>

      <VariantSelector v-if="groups.length" :model-value="selected" :groups="groups" @update:model-value="onSelectVariant" />

      <div class="product-page__qty">
        <span class="product-page__qty-label">تعداد</span>
        <div class="product-page__qty-stepper">
          <button type="button" :disabled="qty <= 1" @click="qty--">
            <AppIcon name="minus" :size="13" :stroke-width="2" />
          </button>
          <span>{{ toPersianDigits(qty) }}</span>
          <button type="button" :disabled="qty >= maxQty" @click="qty++">
            <AppIcon name="plus" :size="13" :stroke-width="2" />
          </button>
        </div>
        <span v-if="selectedVariant && selectedVariant.stock <= 5 && selectedVariant.stock > 0" class="product-page__lowstock">
          فقط {{ toPersianDigits(selectedVariant.stock) }} عدد باقی مانده
        </span>
      </div>

      <button type="button" class="product-page__cta" :disabled="!canAddToCart" @click="addToCart">
        <AppIcon name="bag" :size="16" :stroke-width="2" />
        {{ ctaLabel }}
      </button>
      <p v-if="justAdded" class="product-page__added">به سبد خرید اضافه شد</p>

      <div class="product-page__tabs">
        <button
          type="button"
          class="product-page__tab"
          :class="{ 'product-page__tab--active': tab === 'desc' }"
          @click="tab = 'desc'"
        >
          توضیحات
        </button>
        <button
          v-if="product.specs?.length"
          type="button"
          class="product-page__tab"
          :class="{ 'product-page__tab--active': tab === 'specs' }"
          @click="tab = 'specs'"
        >
          مشخصات فنی
        </button>
      </div>

      <div class="product-page__panel">
        <p v-if="tab === 'desc'" class="product-page__desc">
          {{ product.description || product.shortDescription || 'توضیحاتی برای این محصول ثبت نشده است.' }}
        </p>
        <ul v-else class="product-page__specs">
          <li v-for="s in product.specs" :key="s.key">
            <span>{{ s.key }}</span>
            <span>{{ s.value }}{{ s.unit ? ` ${s.unit}` : '' }}</span>
          </li>
        </ul>
      </div>

      <section class="product-page__section">
        <SectionHead title="نظرات کاربران" />
        <ReviewList
          :reviews="reviews"
          :stats="reviewStats"
          :total="reviewTotal"
          :pending="reviewsPending"
          :has-more="reviews.length < reviewTotal"
          :loading-more="reviewsLoadingMore"
          @load-more="loadMoreReviews"
          @toggle-helpful="toggleHelpful"
        />

        <div class="product-page__review-form">
          <p v-if="reviewSubmitted" class="product-page__review-thanks">
            نظر شما ثبت شد و پس از بررسی نمایش داده می‌شود.
          </p>
          <template v-else-if="authStore.isLoggedIn">
            <ReviewForm ref="reviewFormRef" :submitting="reviewSubmitting" :error="reviewError" @submit="submitReview" />
          </template>
          <NuxtLink v-else class="product-page__review-cta" :to="{ path: '/auth/login', query: { redirect: route.fullPath } }">
            برای ثبت نظر ابتدا وارد شوید
          </NuxtLink>
        </div>
      </section>

      <section v-if="related.length" class="product-page__section">
        <SectionHead title="محصولات مرتبط" />
        <div class="product-page__related">
          <ProductCard
            v-for="p in related"
            :key="p._id"
            class="product-page__related-item"
            :product="mapProduct(p)"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import AppIcon from '~/components/icons/AppIcon.vue'
import SectionHead from '~/components/ui/SectionHead.vue'
import ProductCard from '~/components/ui/ProductCard.vue'
import ProductGallery from '~/components/product-detail/ProductGallery.vue'
import VariantSelector from '~/components/product-detail/VariantSelector.vue'
import ReviewList from '~/components/product-detail/ReviewList.vue'
import ReviewForm from '~/components/product-detail/ReviewForm.vue'
import { useCartStore } from '~/stores/cart.store'
import { useWishlistStore } from '~/stores/wishlist.store'
import { useAuthStore } from '~/stores/auth.store'
import { reviewService } from '~/services/review.service'
import { formatPrice, toPersianDigits } from '~/utils/format'

const route = useRoute()
const slug = route.params.slug

const { data: product, error: productError } = await useAsyncData(
  `product-${slug}`,
  () => $fetch(`/api/v1/products/slug/${slug}`),
  { transform: (r) => r?.data ?? r },
)
if (productError.value || !product.value) {
  throw createError({ statusCode: 404, statusMessage: 'محصول یافت نشد' })
}

const { data: relatedRes } = await useAsyncData(
  `product-${slug}-related`,
  () => $fetch(`/api/v1/products/${slug}/related`),
  { transform: (r) => r?.data ?? r },
)
const related = computed(() => relatedRes.value ?? [])

const REVIEW_LIMIT = 5
const { data: reviewRes } = await useAsyncData(
  `product-${slug}-reviews`,
  () => $fetch('/api/v1/reviews', { params: { productId: product.value._id, limit: REVIEW_LIMIT } }),
  { transform: (r) => r?.data ?? r },
)

const reviews = ref(reviewRes.value?.items ?? [])
const reviewTotal = ref(reviewRes.value?.total ?? 0)
const reviewStats = ref(reviewRes.value?.stats ?? { avgRating: 0, distribution: {} })
const reviewsPending = ref(false)
const reviewsLoadingMore = ref(false)
const reviewPage = ref(1)

async function loadMoreReviews() {
  if (reviewsLoadingMore.value) return
  reviewsLoadingMore.value = true
  try {
    reviewPage.value += 1
    const { data } = await reviewService.getForProduct(product.value._id, { page: reviewPage.value, limit: REVIEW_LIMIT })
    reviews.value = [...reviews.value, ...(data.items ?? [])]
  } finally {
    reviewsLoadingMore.value = false
  }
}

const authStore = useAuthStore()
const helpfulIds = reactive(new Set())
async function toggleHelpful(id) {
  if (!authStore.isLoggedIn) {
    navigateTo({ path: '/auth/login', query: { redirect: route.fullPath } })
    return
  }
  try {
    const { data } = await reviewService.markHelpful(id)
    const review = reviews.value.find((r) => r._id === id)
    if (review) review.helpfulCount = data.count
    if (data.helpful) helpfulIds.add(id)
    else helpfulIds.delete(id)
  } catch {
    // non-critical — ignore failures silently
  }
}

const reviewFormRef = ref(null)
const reviewSubmitting = ref(false)
const reviewError = ref(null)
async function submitReview(payload) {
  reviewSubmitting.value = true
  reviewError.value = null
  try {
    await reviewService.create({ productId: product.value._id, ...payload })
    reviewError.value = null
    reviewFormRef.value?.reset()
    reviewStats.value = { ...reviewStats.value }
    reviewSubmitted.value = true
  } catch (err) {
    reviewError.value = err?.response?.data?.message || 'ثبت نظر با خطا مواجه شد'
  } finally {
    reviewSubmitting.value = false
  }
}
const reviewSubmitted = ref(false)

// ── Variants / pricing ──────────────────────────────────────────
const activeVariants = computed(() => (product.value.variants ?? []).filter((v) => v.isActive !== false))

const attributeKeys = computed(() => {
  const keys = []
  activeVariants.value.forEach((v) => (v.attributes ?? []).forEach((a) => {
    if (!keys.includes(a.key)) keys.push(a.key)
  }))
  return keys
})

const groups = computed(() => attributeKeys.value.map((key) => {
  const values = new Map()
  activeVariants.value.forEach((v) => {
    const attr = (v.attributes ?? []).find((a) => a.key === key)
    if (!attr) return
    if (!values.has(attr.value)) values.set(attr.value, { value: attr.value, inStock: false, hex: product.value.colorMap?.[attr.value] })
    if (v.stock > 0) values.get(attr.value).inStock = true
  })
  return { key, swatch: key === 'رنگ', values: [...values.values()] }
}))

const selected = reactive({})
groups.value.forEach((g) => { if (g.values.length === 1) selected[g.key] = g.values[0].value })

function onSelectVariant({ key, value }) {
  selected[key] = value
}

const selectedVariant = computed(() => {
  if (!attributeKeys.value.length) return activeVariants.value[0] ?? null
  const allChosen = attributeKeys.value.every((k) => selected[k])
  if (!allChosen) return null
  return activeVariants.value.find((v) => attributeKeys.value.every(
    (k) => (v.attributes ?? []).some((a) => a.key === k && a.value === selected[k]),
  )) ?? null
})

const displayPrice = computed(() => selectedVariant.value?.price ?? product.value.finalPrice ?? product.value.minPrice ?? 0)
const displayCompare = computed(() => {
  if (selectedVariant.value) {
    const cp = selectedVariant.value.comparePrice
    return cp && cp > selectedVariant.value.price ? cp : null
  }
  return product.value.maxComparePrice > product.value.minPrice ? product.value.maxComparePrice : null
})
const discountPct = computed(() => {
  if (!displayCompare.value) return 0
  return Math.round(((displayCompare.value - displayPrice.value) / displayCompare.value) * 100)
})

const galleryImages = computed(() => {
  const variantImages = selectedVariant.value?.images ?? []
  const base = product.value.images ?? []
  const merged = [...variantImages, ...base.filter((i) => !variantImages.includes(i))]
  return merged.length ? merged : [product.value.thumbnail || '']
})

const categoryName = computed(() => product.value.category?.name ?? '')

const qty = ref(1)
const maxQty = computed(() => Math.min(selectedVariant.value?.stock ?? 1, 10))
const canAddToCart = computed(() => !!selectedVariant.value && selectedVariant.value.stock > 0)
const ctaLabel = computed(() => {
  if (!attributeKeys.value.length) return canAddToCart.value ? 'افزودن به سبد خرید' : 'ناموجود'
  if (!selectedVariant.value) return 'انتخاب گزینه‌ها'
  return selectedVariant.value.stock > 0 ? 'افزودن به سبد خرید' : 'ناموجود'
})

const cartStore = useCartStore()
const justAdded = ref(null)
let addedTimer = null
function addToCart() {
  if (!canAddToCart.value) return
  const variantLabel = attributeKeys.value.map((k) => `${k}: ${selected[k]}`).join('، ') || null
  cartStore.addItem({
    productId: product.value._id,
    name: product.value.name,
    image: product.value.thumbnail || product.value.images?.[0] || '',
    price: selectedVariant.value.price,
    slug: product.value.slug,
    variant: variantLabel,
    qty: qty.value,
  })
  justAdded.value = true
  clearTimeout(addedTimer)
  addedTimer = setTimeout(() => { justAdded.value = false }, 2200)
}

const wishlistStore = useWishlistStore()
const wished = computed(() => wishlistStore.isWishlisted(product.value._id))

const tab = ref('desc')

function mapProduct(p) {
  return {
    _id: p._id,
    slug: p.slug,
    name: p.name,
    price: p.finalPrice ?? p.minPrice ?? 0,
    image: p.thumbnail || p.images?.[0] || '',
  }
}

useSeoMeta({
  title: () => `${product.value.name} | فروشگاه پوشاک`,
  description: () => product.value.metaDescription || product.value.shortDescription,
})
</script>


<style scoped>
.product-page__topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
}
.product-page__back,
.product-page__wish {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  background: var(--glass-strong);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
}
.product-page__wish--active { color: #E08585; }

.product-page__gallery { padding: 0 18px; }

.product-page__body { padding: 18px; }

.product-page__cat { font-size: 11px; color: var(--text-secondary); margin-bottom: 4px; }
.product-page__name { font-size: 17px; font-weight: 800; color: var(--text-primary); line-height: 1.5; margin-bottom: 8px; }

.product-page__rating { display: flex; align-items: center; gap: 4px; color: #E7C878; font-size: 11px; margin-bottom: 10px; }
.product-page__rating span { color: var(--text-secondary); margin-inline-start: 4px; }

.product-page__price-row { display: flex; align-items: baseline; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; }
.product-page__compare { font-size: 12.5px; text-decoration: line-through; color: var(--text-disabled); }
.product-page__price { font-size: 19px; font-weight: 800; color: var(--text-primary); }
.product-page__discount {
  font-size: 10.5px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 8px;
  color: #fff;
  background: linear-gradient(135deg, rgba(110, 176, 130, .95), rgba(61, 139, 82, .9));
}

.product-page__qty { display: flex; align-items: center; gap: 12px; margin: 18px 0; }
.product-page__qty-label { font-size: 12.5px; font-weight: 600; color: var(--text-secondary); }
.product-page__qty-stepper {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 6px 14px;
  border-radius: 999px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
}
.product-page__qty-stepper button {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  background: var(--glass-strong);
}
.product-page__qty-stepper button:disabled { opacity: .35; }
.product-page__qty-stepper span { font-size: 13px; font-weight: 700; min-width: 16px; text-align: center; }
.product-page__lowstock { font-size: 10.5px; color: #E0A855; }

.product-page__cta {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-radius: 16px;
  font-size: 13.5px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #6EB082 0%, #3D8B52 55%, #2D6B3E 100%);
  box-shadow: 0 10px 24px rgba(40, 55, 46, .3);
}
.product-page__cta:disabled { opacity: .45; box-shadow: none; }
.product-page__added { margin-top: 8px; text-align: center; font-size: 11.5px; color: var(--brand-light); }
[data-theme='light'] .product-page__added { color: var(--brand-dark); }

.product-page__tabs { display: flex; gap: 6px; margin-top: 26px; border-bottom: 1px solid var(--glass-border); }
.product-page__tab {
  padding: 10px 4px;
  margin-inline-end: 18px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text-secondary);
  border-bottom: 2px solid transparent;
}
.product-page__tab--active { color: var(--text-primary); border-color: var(--brand); }

.product-page__panel { padding: 16px 2px; }
.product-page__desc { font-size: 12.5px; line-height: 1.9; color: var(--text-secondary); white-space: pre-line; }
.product-page__specs { display: flex; flex-direction: column; gap: 10px; }
.product-page__specs li { display: flex; justify-content: space-between; font-size: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--glass-border); }
.product-page__specs li span:first-child { color: var(--text-secondary); }
.product-page__specs li span:last-child { color: var(--text-primary); font-weight: 600; }

.product-page__section { margin-top: 30px; }
.product-page__section :deep(.section-head) { margin: 0 0 12px; }

.product-page__review-form { margin-top: 18px; }
.product-page__review-thanks {
  text-align: center;
  font-size: 12px;
  color: var(--brand-light);
  padding: 14px;
  border-radius: 14px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
}
[data-theme='light'] .product-page__review-thanks { color: var(--brand-dark); }
.product-page__review-cta {
  display: block;
  text-align: center;
  padding: 13px;
  border-radius: 14px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--brand-light);
  background: var(--glass);
  border: 1px solid var(--glass-border);
}
[data-theme='light'] .product-page__review-cta { color: var(--brand-dark); }

.product-page__related { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
.product-page__related::-webkit-scrollbar { display: none; }
.product-page__related-item { flex: 0 0 132px; }
</style>
