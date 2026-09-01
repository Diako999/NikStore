import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { productService } from '~/services/product.service'
import { logger } from '~/utils/logger'

export const useProductStore = defineStore('product', () => {
  const products       = ref([])
  const currentProduct = ref(null)
  const loading        = ref(false)
  const total          = ref(0)
  const page           = ref(1)
  const limit          = ref(24)
  // True only when the last fetchProducts() call itself failed (network
  // error / non-2xx) — distinct from a successful fetch that genuinely
  // returned zero results. Lets the UI tell "no products match your
  // filters" apart from "we couldn't reach the server."
  const error          = ref(false)

  const filters = reactive({
    sortBy:   'newest',
    category: null,
    brand:    null,
    genders:  [],
    minPrice: null,
    maxPrice: null,
    inStock:  false,
  })

  // ── Fetch products ─────────────────────────────────────────────
  async function fetchProducts(extraParams = {}) {
    loading.value = true
    error.value   = false
    try {
      const params = {
        page:   page.value,
        limit:  limit.value,
        status: 'active',
        sort: filters.sortBy,
        ...extraParams,
      }
      if (filters.category)        params.category = filters.category
      if (filters.brand)           params.brand    = filters.brand
      if (filters.genders?.length) params.gender   = filters.genders.join(',')
      if (filters.minPrice)        params.minPrice = filters.minPrice
      if (filters.maxPrice)        params.maxPrice = filters.maxPrice
      if (filters.inStock)         params.inStock  = true

      const { data } = await productService.getAll(params)
      products.value = data?.products ?? data?.items ?? []
      total.value    = data?.total ?? 0
    } catch (err) {
      logger.error('product: fetchProducts failed', err, {}, 'ProductStore')
      products.value = []
      total.value    = 0
      error.value    = true
    } finally {
      loading.value = false
    }
  }

  // ── Fetch single product ────────────────────────────────────────
  async function fetchProductBySlug(slug) {
    loading.value = true
    try {
      const { data } = await productService.getBySlug(slug)
      currentProduct.value = data
    } catch (error) {
      logger.error('product: fetchProductBySlug failed', error, { slug }, 'ProductStore')
      throw error
    } finally {
      loading.value = false
    }
  }

  // ── Filter helpers ──────────────────────────────────────────────
  function setFilter(key, value) {
    filters[key] = value
    page.value   = 1
  }

  function resetFilters() {
    filters.sortBy   = 'newest'
    filters.category = null
    filters.brand    = null
    filters.genders  = []
    filters.minPrice = null
    filters.maxPrice = null
    filters.inStock  = false
    page.value       = 1
  }

  function setPage(p) {
    page.value = p
  }

  // ── URL sync helpers ────────────────────────────────────────────
  function toQueryParams() {
    const q = {}
    if (filters.sortBy && filters.sortBy !== 'newest') q.sort        = filters.sortBy
    if (filters.category)        q.category = filters.category
    if (filters.brand)           q.brand    = filters.brand
    if (filters.genders?.length) q.gender   = filters.genders.join(',')
    if (filters.minPrice)        q.minPrice = filters.minPrice
    if (filters.maxPrice)        q.maxPrice = filters.maxPrice
    if (filters.inStock)         q.inStock  = '1'
    if (page.value > 1)          q.page     = page.value
    return q
  }

  function fromQueryParams(query) {
    filters.sortBy   = query.sort     || query.sortBy || 'newest'
    filters.category = query.category || null
    filters.brand    = query.brand    || null
    filters.genders  = query.gender   ? query.gender.split(',') : []
    filters.minPrice = query.minPrice ? Number(query.minPrice)  : null
    filters.maxPrice = query.maxPrice ? Number(query.maxPrice)  : null
    filters.inStock  = query.inStock  === '1'
    page.value       = query.page     ? Number(query.page)      : 1
  }

  const totalPages = computed(() => Math.ceil(total.value / limit.value))

  return {
    products, currentProduct, loading, total, page, limit, filters, error,
    fetchProducts, fetchProductBySlug,
    setFilter, resetFilters, setPage,
    toQueryParams, fromQueryParams,
    totalPages,
  }
})
