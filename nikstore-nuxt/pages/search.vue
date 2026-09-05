<template>
  <div class="search-page">
    <div class="search-page__bar">
      <SearchBar placeholder="جستجوی محصول، برند یا دسته‌بندی..." />
    </div>

    <template v-if="q">
      <p class="search-page__query">نتایج برای «{{ q }}»</p>

      <SortBar
        v-model="sort"
        :result-count="total"
        :options="sortOptions"
        :active-filter-count="activeFilterCount"
        @open-filter="filterOpen = true"
      />

      <ProductGrid :products="products" :pending="pending" empty-text="محصولی مطابق جستجوی شما یافت نشد" />

      <div v-if="loadingMore" class="search-page__loadmore">
        <span class="search-page__spinner" />
      </div>
      <div ref="sentinelRef" class="search-page__sentinel" />

      <FilterPanel
        v-model:open="filterOpen"
        :brands="[]"
        :filters="filters"
        @apply="applyFilters"
        @reset="resetFilters"
      />
    </template>

    <div v-else class="search-page__empty">
      <div class="search-page__empty-ico">
        <AppIcon name="search" :size="26" :stroke-width="1.6" />
      </div>
      <p>برای شروع، عبارت مورد نظر خود را جستجو کنید</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import AppIcon from '~/components/icons/AppIcon.vue'
import SearchBar from '~/components/ui/SearchBar.vue'
import SortBar from '~/components/products/SortBar.vue'
import ProductGrid from '~/components/products/ProductGrid.vue'
import FilterPanel from '~/components/products/FilterPanel.vue'
import { searchService } from '~/services/search.service'

const route = useRoute()
const q = computed(() => (typeof route.query.q === 'string' ? route.query.q.trim() : ''))

const sort = ref('relevant')
const sortOptions = [
  { value: 'relevant', label: 'مرتبط‌ترین' },
  { value: 'newest', label: 'جدیدترین' },
  { value: 'popular', label: 'پرفروش‌ترین' },
  { value: 'price_asc', label: 'ارزان‌ترین' },
  { value: 'price_desc', label: 'گران‌ترین' },
  { value: 'mostViewed', label: 'پربازدیدترین' },
]

const filters = reactive({ minPrice: null, maxPrice: null, inStock: false })
const filterOpen = ref(false)
const activeFilterCount = computed(() => {
  let n = 0
  if (filters.minPrice) n++
  if (filters.maxPrice) n++
  if (filters.inStock) n++
  return n
})

const LIMIT = 20
const products = ref([])
const total = ref(0)
const totalPages = ref(1)
const page = ref(1)
const pending = ref(false)
const loadingMore = ref(false)

function buildParams(pageNum) {
  return {
    q: q.value,
    sort: sort.value,
    page: pageNum,
    limit: LIMIT,
    ...(filters.minPrice && { minPrice: filters.minPrice }),
    ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
    ...(filters.inStock && { inStock: true }),
  }
}

async function runSearch(reset) {
  if (!q.value) {
    products.value = []
    total.value = 0
    return
  }
  if (reset) {
    pending.value = true
    page.value = 1
  } else {
    loadingMore.value = true
  }
  try {
    const { data } = await searchService.search(buildParams(page.value))
    if (reset) products.value = data?.products ?? []
    else products.value = [...products.value, ...(data?.products ?? [])]
    total.value = data?.total ?? 0
    totalPages.value = data?.totalPages ?? 1
  } finally {
    pending.value = false
    loadingMore.value = false
  }
}

async function loadMore() {
  if (loadingMore.value || pending.value || page.value >= totalPages.value) return
  page.value += 1
  await runSearch(false)
}

function applyFilters(next) {
  Object.assign(filters, next)
  runSearch(true)
}

function resetFilters() {
  filters.minPrice = null
  filters.maxPrice = null
  filters.inStock = false
  runSearch(true)
}

watch([q, sort], () => runSearch(true))

const sentinelRef = ref(null)
let observer = null

onMounted(() => {
  runSearch(true)
  if (typeof IntersectionObserver !== 'undefined' && sentinelRef.value) {
    observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore()
    }, { rootMargin: '200px' })
    observer.observe(sentinelRef.value)
  }
})
onUnmounted(() => { if (observer) observer.disconnect() })

useSeoMeta({ title: () => (q.value ? `جستجو: ${q.value}` : 'جستجو') })
</script>

<style scoped>
.search-page__bar :deep(.search-bar) { margin-top: 18px; }

.search-page__query {
  margin: 0 18px 12px;
  font-size: 12.5px;
  color: var(--text-secondary);
}

.search-page__loadmore { display: flex; justify-content: center; padding: 16px 0; }
.search-page__spinner {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--glass-border);
  border-top-color: var(--brand-light);
  animation: search-spin .7s linear infinite;
}
.search-page__sentinel { height: 1px; }

.search-page__empty {
  margin: 60px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  color: var(--text-secondary);
  font-size: 12.5px;
}
.search-page__empty-ico {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  color: var(--text-disabled);
}

@keyframes search-spin {
  to { transform: rotate(360deg); }
}
</style>
