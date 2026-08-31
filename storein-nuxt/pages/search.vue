<template>
  <div class="container-main py-4">

    <nav aria-label="مسیر صفحه" class="mb-4">
      <ol class="flex items-center gap-2 text-sm text-text-secondary list-none m-0 p-0">
        <li><NuxtLink to="/" class="hover:text-brand transition-colors">خانه</NuxtLink></li>
        <li aria-hidden="true">
          <svg class="w-3 h-3 rotate-180 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </li>
        <li><span aria-current="page" class="text-text-primary font-medium">نتایج جستجو</span></li>
      </ol>
    </nav>

    <GlassCard padding="md" class="mb-4">
      <GlassSearchBar
        v-model="searchInput"
        placeholder="جستجوی محصول، برند یا دسته‌بندی..."
        class="mb-3"
        @submit="onSearchSubmit"
      />
      <div class="flex items-center gap-3 flex-wrap">
        <svg class="w-5 h-5 text-glass-brand flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
        </svg>
        <div>
          <span class="text-glass-text-secondary text-sm">نتایج جستجو برای: </span>
          <span class="text-glass-text-primary font-bold text-lg">«{{ searchQuery }}»</span>
        </div>
        <span v-if="!loading && searchQuery" class="text-glass-text-secondary text-sm font-fanum mr-auto">
          <span class="text-glass-text-primary font-bold">{{ formatNumber(total) }}</span> کالا
        </span>
      </div>
    </GlassCard>

    <div class="flex gap-4">

      <!-- Sidebar filters (desktop) -->
      <aside v-if="facets && total > 0" class="hidden lg:block w-60 flex-shrink-0">
        <div class="sticky top-24 space-y-4">

          <GlassCard v-if="facets.priceRange" padding="md">
            <h3 id="price-filter-label" class="font-semibold text-sm mb-3 text-glass-text-primary">محدوده قیمت</h3>
            <div class="flex gap-2 text-xs text-glass-text-secondary font-fanum" aria-hidden="true">
              <span>{{ formatNumber(facets.priceRange.min) }} ت</span>
              <span class="mr-auto">{{ formatNumber(facets.priceRange.max) }} ت</span>
            </div>
            <div class="flex gap-2 mt-2" role="group" aria-labelledby="price-filter-label">
              <GlassInput :model-value="priceMin" @update:model-value="v => priceMin = v === '' ? null : Number(v)" type="number" placeholder="از" class="font-fanum" @blur="onFilterChange" />
              <GlassInput :model-value="priceMax" @update:model-value="v => priceMax = v === '' ? null : Number(v)" type="number" placeholder="تا" class="font-fanum" @blur="onFilterChange" />
            </div>
          </GlassCard>

          <GlassCard
            v-for="attr in facets.attributes"
            :key="attr.key"
            padding="md"
          >
            <h3 class="font-semibold text-sm mb-3 text-glass-text-primary">{{ attr.key }}</h3>
            <div class="space-y-2">
              <label
                v-for="val in attr.values"
                :key="val"
                class="flex items-center gap-2 cursor-pointer text-sm text-glass-text-secondary"
              >
                <input
                  type="checkbox"
                  :value="`${attr.key}:${val}`"
                  v-model="selectedAttrs"
                  class="accent-brand"
                  @change="onFilterChange"
                />
                <span>{{ val }}</span>
              </label>
            </div>
          </GlassCard>

          <GlassCard padding="md">
            <label class="flex items-center gap-2 cursor-pointer text-sm font-medium text-glass-text-primary">
              <input type="checkbox" v-model="inStock" class="accent-brand w-4 h-4" @change="onFilterChange" />
              <span>فقط موجود</span>
            </label>
          </GlassCard>

        </div>
      </aside>

      <div class="flex-1 min-w-0">
        <SortBar v-model="sortBy" :total="total" :loading="loading" @update:modelValue="onSortChange" />

        <ProductGrid :products="products" :loading="loading" />

        <div v-if="!loading && products.length === 0 && searchQuery" class="text-center py-16">
          <div class="text-6xl mb-4 select-none">🔍</div>
          <h2 class="text-xl font-bold text-text-primary mb-2">
            نتیجه‌ای برای «{{ searchQuery }}» یافت نشد
          </h2>
          <p class="text-text-secondary mb-2 text-sm">پیشنهادات:</p>
          <ul class="text-text-secondary text-sm mb-6 space-y-1">
            <li>• از کلمات کوتاه‌تر یا متفاوت‌تر استفاده کنید</li>
            <li>• غلط‌های تایپی را بررسی کنید</li>
            <li>• با کلمه فارسی معادل امتحان کنید</li>
          </ul>
          <NuxtLink to="/products" class="inline-block bg-brand text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-dark transition-colors">
            مشاهده همه محصولات
          </NuxtLink>
        </div>

        <div v-if="!searchQuery" class="text-center py-16 text-text-secondary">
          <div class="text-5xl mb-4">🔎</div>
          <p>کلمه‌ای برای جستجو وارد کنید</p>
        </div>

        <BasePagination
          v-if="totalPages > 1"
          :model-value="currentPage"
          :total-pages="totalPages"
          :loading="loading"
          @update:modelValue="onPageChange"
          class="mt-6"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatNumber } from '~/utils/formatters'
import SortBar          from '~/components/products/SortBar.vue'
import ProductGrid      from '~/components/products/ProductGrid.vue'
import BasePagination   from '~/components/common/BasePagination.vue'
import http             from '~/services/http.service'
import GlassCard        from '~/components/glass/GlassCard.vue'
import GlassSearchBar   from '~/components/glass/GlassSearchBar.vue'
import GlassInput       from '~/components/glass/GlassInput.vue'

definePageMeta({ layout: 'default' })

const route  = useRoute()
const router = useRouter()
const ui     = useUiStore()

const searchInput   = ref('')
const products      = ref([])
const loading       = ref(false)
const total         = ref(0)
const facets        = ref(null)
const currentPage   = ref(1)
const sortBy        = ref('relevant')
const priceMin      = ref(null)
const priceMax      = ref(null)
const inStock       = ref(false)
const selectedAttrs = ref([])
const LIMIT         = 24

const searchQuery = computed(() => String(route.query.q || '').trim())
useSeoMeta({ title: () => searchQuery.value ? `جستجو: ${searchQuery.value}` : 'جستجو', robots: 'noindex' })
const totalPages  = computed(() => Math.max(1, Math.ceil(total.value / LIMIT)))

async function fetchSearch() {
  if (!searchQuery.value) { products.value = []; total.value = 0; facets.value = null; return }
  loading.value = true
  try {
    const params = {
      q:     searchQuery.value,
      page:  currentPage.value,
      limit: LIMIT,
      sort:  sortBy.value,
      ...(priceMin.value ? { minPrice: priceMin.value } : {}),
      ...(priceMax.value ? { maxPrice: priceMax.value } : {}),
      ...(inStock.value  ? { inStock: true }            : {}),
      ...(selectedAttrs.value.length ? { attrs: selectedAttrs.value.join(',') } : {}),
    }
    const { data } = await http.get('/search', { params })
    products.value = data?.products ?? []
    total.value    = data?.total    ?? 0
    facets.value   = data?.facets   ?? null
  } catch {
    ui.addToast('خطا در جستجو. دوباره تلاش کنید', 'error')
    products.value = []
    total.value    = 0
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  sortBy.value      = route.query.sortBy || 'relevant'
  currentPage.value = Number(route.query.page) || 1
  priceMin.value    = route.query.minPrice ? Number(route.query.minPrice) : null
  priceMax.value    = route.query.maxPrice ? Number(route.query.maxPrice) : null
  inStock.value     = route.query.inStock === 'true'
  searchInput.value = searchQuery.value
  await fetchSearch()
})

watch(searchQuery, async (q) => {
  currentPage.value   = 1
  selectedAttrs.value = []
  priceMin.value      = null
  priceMax.value      = null
  inStock.value       = false
  searchInput.value   = q
  await fetchSearch()
})

function onSearchSubmit(q) {
  const query = String(q ?? searchInput.value).trim()
  if (!query) return
  router.push({ path: '/search', query: { q: query } })
}

function onSortChange() {
  currentPage.value = 1
  fetchSearch()
  router.replace({ query: { ...route.query, sortBy: sortBy.value, page: undefined } })
}

function onFilterChange() {
  currentPage.value = 1
  fetchSearch()
  router.replace({
    query: {
      ...route.query,
      page:     undefined,
      minPrice: priceMin.value || undefined,
      maxPrice: priceMax.value || undefined,
      inStock:  inStock.value  || undefined,
    },
  })
}

async function onPageChange(p) {
  currentPage.value = p
  await fetchSearch()
  router.replace({ query: { ...route.query, page: p > 1 ? p : undefined } })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>
