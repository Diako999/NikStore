<template>
  <div class="container-main py-4">

    <nav aria-label="مسیر صفحه" class="flex items-center gap-2 text-sm text-text-secondary mb-4">
      <NuxtLink to="/" class="hover:text-brand transition-colors">خانه</NuxtLink>
      <svg class="w-3 h-3 rotate-180 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
      </svg>
      <span class="text-text-primary font-medium">{{ currentCategory?.name || 'دسته‌بندی' }}</span>
    </nav>

    <h1 class="text-xl font-bold text-text-primary mb-5">
      {{ currentCategory?.name || 'دسته‌بندی' }}
    </h1>

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
        <ProductGrid :products="productStore.products" :loading="productStore.loading" />
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

const route         = useRoute()
const router        = useRouter()
const config        = useRuntimeConfig()
const productStore  = useProductStore()
const categoryStore = useCategoryStore()
const wishlistStore = useWishlistStore()

const mobileFilterOpen  = ref(false)
const categorySlug      = computed(() => route.params.slug)

const currentCategory = computed(() => {
  const flat = []
  function flatten(nodes) {
    if (!Array.isArray(nodes)) return
    nodes.forEach(n => { flat.push(n); if (n.children?.length) flatten(n.children) })
  }
  flatten(categoryStore.categories)
  return flat.find(c => c.slug === categorySlug.value) || null
})

useSeoMeta({
  title:       () => currentCategory.value?.name || 'دسته‌بندی',
  description: () => currentCategory.value?.description || 'خرید انواع پوشاک زنانه، مردانه و بچگانه',
  ogType:      'website',
  ogUrl:       () => `${config.public.siteUrl}/category/${categorySlug.value}`,
})
useHead({
  link: [{ rel: 'canonical', href: () => `${config.public.siteUrl}/category/${categorySlug.value}` }],
  script: computed(() => {
    const cat = currentCategory.value
    if (!cat) return []
    return [
      {
        type: 'application/ld+json',
        key:  'jsonld-category-breadcrumb',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type':    'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'خانه',       item: config.public.siteUrl },
            { '@type': 'ListItem', position: 2, name: 'محصولات',    item: `${config.public.siteUrl}/products` },
            { '@type': 'ListItem', position: 3, name: cat.name },
          ],
        }),
      },
      {
        type: 'application/ld+json',
        key:  'jsonld-category-list',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type':    'ItemList',
          name:       cat.name,
          itemListElement: (productStore.products || []).slice(0, 20).map((p, i) => ({
            '@type':  'ListItem',
            position: i + 1,
            url:      `${config.public.siteUrl}/product/${p.slug}`,
            name:     p.name,
          })),
        }),
      },
    ]
  }),
})

// ── SSR: fetch categories + products ────────────────────────────
const { data: _cats } = await useAsyncData(
  'categories',
  () => $fetch('/api/v1/categories/tree'),
  { transform: (r) => r?.data ?? r }
)
if (_cats.value && !categoryStore.categories.length) {
  categoryStore.categories = Array.isArray(_cats.value) ? _cats.value : []
}

productStore.resetFilters()
productStore.filters.category = categorySlug.value
productStore.fromQueryParams(route.query)

await useAsyncData(
  () => `category-products-${categorySlug.value}`,
  async () => {
    const res = await $fetch('/api/v1/products', {
      params: {
        category: categorySlug.value,
        page:     productStore.page,
        limit:    productStore.limit,
        status:   'active',
        sort:     productStore.filters.sortBy,
        ...(productStore.filters.genders?.length   ? { gender:        productStore.filters.genders.join(',')    } : {}),
        ...(productStore.filters.minPrice          ? { minPrice:      productStore.filters.minPrice             } : {}),
        ...(productStore.filters.maxPrice          ? { maxPrice:      productStore.filters.maxPrice             } : {}),
        ...(productStore.filters.inStock           ? { inStock:       true                                      } : {}),
      }
    })
    const d = res?.data ?? res
    productStore.products = d?.products ?? d?.items ?? []
    productStore.total    = d?.total ?? 0
    return null
  }
)

onMounted(async () => {
  if (!categoryStore.categories.length) await categoryStore.fetchCategories()
  wishlistStore.fetchWishlist()
  if (!productStore.products.length) {
    productStore.resetFilters()
    productStore.filters.category = categorySlug.value
    productStore.fromQueryParams(route.query)
    await productStore.fetchProducts()
  }
})

watch(() => route.params.slug, async (slug, prevSlug) => {
  if (slug === prevSlug) return
  productStore.resetFilters()
  if (slug) productStore.filters.category = slug
  await productStore.fetchProducts()
  router.replace({ query: productStore.toQueryParams() })
})

const debouncedFetch = useDebounceFn(async () => {
  productStore.page = 1
  await productStore.fetchProducts()
  const query = productStore.toQueryParams()
  delete query.category
  router.replace({ query })
}, 300)

function onFilterChange() { debouncedFetch() }

async function onPageChange(p) {
  productStore.setPage(p)
  await productStore.fetchProducts()
  const query = productStore.toQueryParams()
  delete query.category
  router.replace({ query })
}

function removeFilter(key, value) {
  if (key === 'inStock') productStore.filters.inStock = false
  else if (key === 'minPrice') productStore.filters.minPrice = null
  else if (key === 'maxPrice') productStore.filters.maxPrice = null
  else if (Array.isArray(productStore.filters[key])) {
    productStore.filters[key] = productStore.filters[key].filter(v => v !== value)
  }
  debouncedFetch()
}

function clearAllFilters() {
  const cat = route.params.slug
  productStore.resetFilters()
  if (cat) productStore.filters.category = cat
  mobileFilterOpen.value = false
  debouncedFetch()
}

function onMobileFilterApply(newFilters) {
  Object.assign(productStore.filters, newFilters)
  mobileFilterOpen.value = false
  debouncedFetch()
}
</script>
