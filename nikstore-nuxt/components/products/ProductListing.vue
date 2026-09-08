<template>
  <div>
    <SortBar
      v-model="sort"
      :result-count="total"
      :active-filter-count="activeFilterCount"
      @open-filter="filterOpen = true"
    />

    <ProductGrid :products="products" :pending="pending" :empty-text="emptyText" />

    <div v-if="loadingMore" class="pl-loadmore">
      <span class="pl-spinner" />
    </div>
    <div ref="sentinelRef" class="pl-sentinel" />

    <FilterPanel
      v-model:open="filterOpen"
      :brands="brands"
      :filters="filters"
      @apply="applyFilters"
      @reset="resetFilters"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import SortBar from './SortBar.vue'
import ProductGrid from './ProductGrid.vue'
import FilterPanel from './FilterPanel.vue'

const props = defineProps({
  // Category slug to scope the listing to — omitted for the all-products page.
  category: { type: String, default: null },
  brandParam: { type: String, default: null },
  genderParam: { type: String, default: null },
  emptyText: { type: String, default: 'محصولی یافت نشد' },
})

const emit = defineEmits(['loaded'])

const LIMIT = 20

const sort = ref('newest')
const filters = reactive({ brand: props.brandParam || null, minPrice: null, maxPrice: null, inStock: false })
const filterOpen = ref(false)

const page = ref(1)
const pending = ref(false)
const loadingMore = ref(false)

const activeFilterCount = computed(() => {
  let n = 0
  if (filters.brand) n++
  if (filters.minPrice) n++
  if (filters.maxPrice) n++
  if (filters.inStock) n++
  return n
})

function buildParams(pageNum) {
  return {
    status: 'active',
    sort: sort.value,
    page: pageNum,
    limit: LIMIT,
    ...(props.category && { category: props.category }),
    ...(props.genderParam && { gender: props.genderParam }),
    ...(filters.brand && { brand: filters.brand }),
    ...(filters.minPrice && { minPrice: filters.minPrice }),
    ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
    ...(filters.inStock && { inStock: true }),
  }
}

// Initial fetch runs SSR-side (matches the swr caching on /products and
// /category/** routes) — later filter/sort/page changes are plain client
// re-fetches since they only ever happen after hydration.
const { data: initialData } = await useAsyncData(
  `products-listing-${props.category || 'all'}`,
  () => $fetch('/api/v1/products', { params: buildParams(1) }),
  { transform: (r) => r?.data ?? r },
)

const products = ref(initialData.value?.products ?? [])
const total = ref(initialData.value?.total ?? 0)
const totalPages = ref(initialData.value?.totalPages ?? 1)
emit('loaded', { total: total.value })

async function load(reset) {
  if (reset) {
    pending.value = true
    page.value = 1
  } else {
    loadingMore.value = true
  }
  try {
    const raw = await $fetch('/api/v1/products', { params: buildParams(page.value) })
    const res = raw?.data ?? raw
    if (reset) products.value = res?.products ?? []
    else products.value = [...products.value, ...(res?.products ?? [])]
    total.value = res?.total ?? 0
    totalPages.value = res?.totalPages ?? 1
    emit('loaded', { total: total.value })
  } finally {
    pending.value = false
    loadingMore.value = false
  }
}

async function loadMore() {
  if (loadingMore.value || pending.value || page.value >= totalPages.value) return
  page.value += 1
  await load(false)
}

function applyFilters(next) {
  Object.assign(filters, next)
  load(true)
}

function resetFilters() {
  filters.brand = null
  filters.minPrice = null
  filters.maxPrice = null
  filters.inStock = false
  load(true)
}

watch(sort, () => load(true))
watch(() => props.category, () => load(true))

const brands = ref([])
async function loadBrands() {
  try {
    const raw = await $fetch('/api/v1/products/brands', {
      params: props.category ? { category: props.category } : {},
    })
    brands.value = raw?.data ?? raw ?? []
  } catch {
    brands.value = []
  }
}

const sentinelRef = ref(null)
let observer = null

onMounted(async () => {
  await Promise.all([load(true), loadBrands()])

  if (typeof IntersectionObserver !== 'undefined' && sentinelRef.value) {
    observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore()
    }, { rootMargin: '200px' })
    observer.observe(sentinelRef.value)
  }
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<style scoped>
.pl-loadmore {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}
.pl-spinner {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--glass-border);
  border-top-color: var(--brand-light);
  animation: pl-spin .7s linear infinite;
}
.pl-sentinel { height: 1px; }

@keyframes pl-spin {
  to { transform: rotate(360deg); }
}
</style>
