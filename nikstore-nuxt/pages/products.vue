<template>
  <div class="container-main py-4">

    <nav aria-label="مسیر صفحه" class="mb-4">
      <ol class="flex items-center gap-2 text-sm text-glass-text-secondary list-none m-0 p-0">
        <li><NuxtLink to="/" class="hover:text-brand transition-colors">خانه</NuxtLink></li>
        <li aria-hidden="true">
          <svg class="w-3 h-3 rotate-180 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </li>
        <li><span aria-current="page" class="text-glass-text-primary font-medium">همه محصولات</span></li>
      </ol>
    </nav>

    <h1 class="text-xl font-bold text-glass-text-primary mb-5">همه محصولات</h1>

    <div class="flex gap-5 items-start">
      <div class="hidden lg:block sticky top-20 self-start">
        <FilterSidebar :filters="productStore.filters" @change="onFilterChange" />
      </div>
      <div class="flex-1 min-w-0">
        <SortBar
          v-model="productStore.filters.sortBy"
          :total="productStore.total"
          :loading="productStore.loading"
          @update:modelValue="onFilterChange"
          @open-filter="mobileFilterOpen = true"
        />
        <ActiveFilters :filters="productStore.filters" @remove="removeFilter" @clear-all="clearAllFilters" />
        <ProductGrid
          :products="productStore.products"
          :loading="productStore.loading"
          :error="productStore.error"
          @retry="productStore.fetchProducts()"
        />
        <BasePagination
          :model-value="productStore.page"
          :total-pages="productStore.totalPages"
          :loading="productStore.loading"
          @update:modelValue="onPageChange"
          class="mt-6"
        />
      </div>
    </div>

    <FilterMobileDrawer
      v-model="mobileFilterOpen"
      :filters="productStore.filters"
      @apply="onMobileFilterApply"
      @clear="clearAllFilters"
    />
  </div>
</template>

<script setup>
import { useDebounceFn } from '@vueuse/core'
import FilterSidebar      from '~/components/products/FilterSidebar.vue'
import FilterMobileDrawer from '~/components/products/FilterMobileDrawer.vue'
import SortBar            from '~/components/products/SortBar.vue'
import ActiveFilters      from '~/components/products/ActiveFilters.vue'
import ProductGrid        from '~/components/products/ProductGrid.vue'
import BasePagination     from '~/components/common/BasePagination.vue'

definePageMeta({ layout: 'default' })

const route        = useRoute()
const router       = useRouter()
const config       = useRuntimeConfig()
const productStore = useProductStore()
const categoryStore= useCategoryStore()
const wishlistStore= useWishlistStore()

const mobileFilterOpen = ref(false)

useSeoMeta({
  title:       'همه محصولات',
  description: 'خرید انواع پوشاک زنانه، مردانه و بچگانه با بهترین قیمت',
  ogType:      'website',
  ogUrl:       `${config.public.siteUrl}/products`,
})
useHead({
  link: [{ rel: 'canonical', href: `${config.public.siteUrl}/products` }],
  script: computed(() => {
    const items = productStore.products
    if (!items?.length) return []
    return [{
      type: 'application/ld+json',
      key:  'jsonld-products-list',
      innerHTML: JSON.stringify({
        '@context':      'https://schema.org',
        '@type':         'ItemList',
        name:            'فهرست محصولات پوشاک',
        numberOfItems:   productStore.total,
        itemListElement: items.slice(0, 20).map((p, i) => ({
          '@type':  'ListItem',
          position: i + 1,
          url:      `${config.public.siteUrl}/product/${p.slug}`,
          name:     p.name,
        })),
      }),
    }]
  }),
})

// ── SSR: initialize filters + pre-fetch products ────────────────
productStore.fromQueryParams(route.query)
await useAsyncData('products-list', async () => {
  const params = {
    page:   productStore.page,
    limit:  productStore.limit,
    status: 'active',
    sort:   productStore.filters.sortBy,
    ...(productStore.filters.category          ? { category:      productStore.filters.category                  } : {}),
    ...(productStore.filters.brand             ? { brand:         productStore.filters.brand                     } : {}),
    ...(productStore.filters.genders?.length   ? { gender:        productStore.filters.genders.join(',')         } : {}),
    ...(productStore.filters.minPrice          ? { minPrice:      productStore.filters.minPrice                  } : {}),
    ...(productStore.filters.maxPrice          ? { maxPrice:      productStore.filters.maxPrice                  } : {}),
    ...(productStore.filters.inStock           ? { inStock:       true                                           } : {}),
  }
  try {
    const res = await $fetch('/api/v1/products', { params })
    const d   = res?.data ?? res
    productStore.products = d?.products ?? d?.items ?? []
    productStore.total    = d?.total ?? 0
    productStore.error    = false
  } catch {
    // Swallow here — the onMounted fallback below re-fetches client-side
    // (via productStore.fetchProducts(), which sets productStore.error)
    // whenever products.length is still 0, covering this failure too.
  }
  return null
})

onMounted(async () => {
  // Non-critical (category tree isn't required to browse products) — must
  // not throw here, or the rest of this hook (wishlist + the SSR-miss
  // product fallback fetch below) never runs when the backend is down.
  await categoryStore.fetchCategories().catch(() => {})
  wishlistStore.fetchWishlist().catch(() => {})
  if (!productStore.products.length) {
    productStore.fromQueryParams(route.query)
    await productStore.fetchProducts()
  }
})

const debouncedFetch = useDebounceFn(async () => {
  productStore.page = 1
  await productStore.fetchProducts()
  router.replace({ query: productStore.toQueryParams() })
}, 300)

function onFilterChange() { debouncedFetch() }

async function onPageChange(p) {
  productStore.setPage(p)
  await productStore.fetchProducts()
  router.replace({ query: productStore.toQueryParams() })
}

function removeFilter(key, value) {
  if (key === 'inStock') productStore.filters.inStock = false
  else if (key === 'minPrice') productStore.filters.minPrice = null
  else if (key === 'maxPrice') productStore.filters.maxPrice = null
  else if (key === 'category') productStore.filters.category = null
  else if (Array.isArray(productStore.filters[key])) {
    productStore.filters[key] = productStore.filters[key].filter(v => v !== value)
  }
  debouncedFetch()
}

function clearAllFilters() {
  productStore.resetFilters()
  mobileFilterOpen.value = false
  debouncedFetch()
}

function onMobileFilterApply(newFilters) {
  Object.assign(productStore.filters, newFilters)
  mobileFilterOpen.value = false
  debouncedFetch()
}
</script>
