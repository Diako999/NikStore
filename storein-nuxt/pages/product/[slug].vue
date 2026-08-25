<template>
  <div class="container-main py-4 pb-24 md:pb-6">

    <!-- Breadcrumb -->
    <nav aria-label="مسیر صفحه" class="flex items-center gap-2 text-sm text-text-secondary mb-5 overflow-x-auto scrollbar-hide whitespace-nowrap pb-1">
      <NuxtLink to="/" class="hover:text-brand flex-shrink-0">خانه</NuxtLink>
      <svg class="w-3 h-3 rotate-180 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
      </svg>
      <NuxtLink
        v-if="product?.category"
        :to="`/category/${product.category.slug}`"
        class="hover:text-brand flex-shrink-0"
      >
        {{ product.category.name }}
      </NuxtLink>
      <svg v-if="product?.category" class="w-3 h-3 rotate-180 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
      </svg>
      <span class="text-text-primary font-medium truncate">{{ product?.name || '...' }}</span>
    </nav>

    <!-- Gallery + Info -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <ProductGallery
        ref="galleryRef"
        :images="displayImages"
        :name="product?.name || ''"
        :loading="pending"
      />
      <div class="flex flex-col gap-4">
        <ProductInfo
          ref="infoRef"
          :product="product"
          :loading="pending"
          @add-to-cart="onAddToCart"
          @variant-change="onVariantChange"
        />
      </div>
    </div>

    <ProductTabs
      :product="product"
      :review-stats="reviewStats"
      :reviews-loading="reviewsLoading"
      class="mb-8"
    />

    <RelatedProducts
      v-if="product"
      :category-slug="product.category?.slug"
      :exclude-id="product._id"
    />
  </div>
</template>

<script setup>
import { reviewService }   from '~/services/review.service'
import { formatPrice }     from '~/utils/formatters'
import ProductGallery      from '~/components/product-detail/ProductGallery.vue'
import ProductInfo         from '~/components/product-detail/ProductInfo.vue'
import ProductTabs         from '~/components/product-detail/ProductTabs.vue'
import RelatedProducts     from '~/components/product-detail/RelatedProducts.vue'
import BaseButton          from '~/components/common/BaseButton.vue'

definePageMeta({ layout: 'default' })

const route         = useRoute()
const config        = useRuntimeConfig()
const wishlistStore = useWishlistStore()
const settingsStore = useSettingsStore()

const slug = computed(() => route.params.slug)

// ── SSR Data Fetch — runs on server, data available before render ──
const { data: product, error, pending, refresh } = await useFetch(
  () => `/api/v1/products/slug/${slug.value}`,
  {
    key:       () => `product-${slug.value}`,
    transform: (r) => r?.data ?? r,
  }
)

if (error.value) {
  throw createError({ statusCode: error.value.statusCode || 404, fatal: true, message: 'محصول یافت نشد' })
}

// ── SEO ─────────────────────────────────────────────────────────
useSeoMeta({
  title:         () => product.value?.metaTitle       || product.value?.name || '',
  description:   () => product.value?.metaDescription || product.value?.shortDescription || '',
  ogTitle:       () => product.value?.name || '',
  ogDescription: () => product.value?.shortDescription || '',
  ogImage: () => {
    const img = product.value?.images?.[0]
    if (!img) return undefined
    return img.startsWith('http') ? img : `${config.public.siteUrl}${img}`
  },
  ogType: 'product',
  ogUrl:  () => `${config.public.siteUrl}/product/${slug.value}`,
})
useHead({
  link: [{ rel: 'canonical', href: () => `${config.public.siteUrl}/product/${slug.value}` }],
  script: computed(() => {
    const p = product.value
    if (!p) return []
    const schema = {
      '@context': 'https://schema.org',
      '@type':    'Product',
      name:        p.name,
      description: p.shortDescription || p.description,
      sku:         p.variants?.[0]?.sku || p._id,
      image:       (p.images || []).map(img => img.startsWith('http') ? img : `${config.public.siteUrl}${img}`),
      ...(p.brand?.name ? { brand: { '@type': 'Brand', name: p.brand.name } } : {}),
      offers: {
        '@type': 'Offer', url: `${config.public.siteUrl}/product/${p.slug}`,
        priceCurrency: 'IRR', price: p.minPrice,
        availability: p.totalStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: { '@type': 'Organization', name: settingsStore.siteName },
      },
      ...(p.avgRating && p.reviewCount ? {
        aggregateRating: { '@type': 'AggregateRating', ratingValue: p.avgRating.toFixed(1), reviewCount: p.reviewCount, bestRating: '5', worstRating: '1' },
      } : {}),
    }
    const breadcrumb = {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'خانه',    item: config.public.siteUrl },
        { '@type': 'ListItem', position: 2, name: 'محصولات', item: `${config.public.siteUrl}/products` },
        ...(p.category?.name ? [{ '@type': 'ListItem', position: 3, name: p.category.name, item: `${config.public.siteUrl}/category/${p.category.slug}` }] : []),
        { '@type': 'ListItem', position: p.category?.name ? 4 : 3, name: p.name },
      ],
    }
    return [
      { type: 'application/ld+json', innerHTML: JSON.stringify(schema),     key: 'jsonld-product' },
      { type: 'application/ld+json', innerHTML: JSON.stringify(breadcrumb), key: 'jsonld-breadcrumb' },
    ]
  }),
})

// ── Client state ─────────────────────────────────────────────────
const selectedVariant = ref(product.value?.variants?.[0] || null)
const galleryRef      = ref(null)
const infoRef         = ref(null)
const reviewStats     = ref(null)
const reviewsLoading  = ref(false)

// Images shown in gallery: variant-specific if assigned, else all product images
const displayImages = computed(() => {
  const variantImgs = selectedVariant.value?.images
  if (variantImgs?.length) return variantImgs
  return product.value?.images || []
})

// Re-init variant on SPA slug navigation
watch(slug, () => { selectedVariant.value = product.value?.variants?.[0] || null })

function onVariantChange(variant) { selectedVariant.value = variant }
function onAddToCart() {}

onMounted(async () => {
  wishlistStore.fetchWishlist()

  if (product.value?._id) {
    try {
      reviewsLoading.value = true
      const { data: reviewData } = await reviewService.getByProduct(product.value._id, { page: 1, limit: 1 })
      reviewStats.value = reviewData.stats ?? null
    } catch { /* non-critical */ } finally { reviewsLoading.value = false }
  }
})
</script>

<style scoped>
.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.3s ease, opacity 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); opacity: 0; }
</style>
