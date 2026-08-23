<template>
  <div class="space-y-4">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="page-title">محصولات</h1>
        <p v-if="!loading" class="text-text-secondary text-sm mt-0.5 font-fanum">
          {{ formatNumber(total) }} کالا
        </p>
      </div>
      <RouterLink v-if="canCreate" :to="{ name: 'product-create' }">
        <AdminButton>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M12 4v16m8-8H4"/>
          </svg>
          محصول جدید
        </AdminButton>
      </RouterLink>
    </div>

    <!-- Filters -->
    <ProductFilters :categories="categories" :brands="brands" @change="onFilterChange" />

    <!-- Table -->
    <div class="admin-card p-0 overflow-hidden">
      <AdminTable :columns="columns" :rows="products" :loading="loading" :skeleton-rows="10" empty-text="محصولی یافت نشد">

        <!-- Image + name -->
        <template #cell-name="{ row }">
          <div class="flex items-center gap-3">
            <!-- thumbnail (string) is the dedicated small image; images[0] is the full-size fallback -->
            <div class="w-12 h-12 rounded-lg border border-border bg-surface flex-shrink-0 overflow-hidden flex items-center justify-center">
              <img
                v-if="row.thumbnail || row.images?.[0]"
                :src="row.thumbnail || row.images?.[0]"
                :alt="row.name"
                class="w-full h-full object-contain"
                @error="e => e.target.closest('div').innerHTML = noImagePlaceholder"
              />
              <svg v-else class="w-6 h-6 text-text-disabled" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M6.75 7.5h.008v.008H6.75V7.5zm10.5 0h.008v.008h-.008V7.5zM3 6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25V6.75z"/>
              </svg>
            </div>
            <div class="min-w-0">
              <RouterLink
                :to="{ name: 'product-edit', params: { id: row._id } }"
                class="font-medium text-text-primary hover:text-primary transition-colors text-sm truncate block max-w-[200px]"
              >
                {{ row.name }}
              </RouterLink>
              <div class="flex items-center gap-1.5 mt-0.5">
                <p class="text-text-disabled text-xs font-mono" dir="ltr">{{ row.slug }}</p>
                <span v-if="row.brand?.name"
                  class="inline-flex items-center px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-medium">
                  {{ row.brand.name }}
                </span>
              </div>
            </div>
          </div>
        </template>

        <!-- Category -->
        <template #cell-category="{ row }">
          <span class="text-text-secondary text-sm">{{ row.category?.name ?? '—' }}</span>
        </template>

        <!-- Sell price -->
        <template #cell-minPrice="{ row }">
          <span class="font-fanum text-sm font-medium text-text-primary">
            {{ formatPrice(row.minPrice) }}
          </span>
        </template>

        <!-- Discount -->
        <template #cell-discount="{ row }">
          <div class="flex items-center justify-center gap-1">
            <template v-if="getDiscount(row) > 0">
              <span class="inline-flex items-center px-2 py-0.5 rounded-lg bg-red-100 text-red-600 text-xs font-bold font-fanum">
                {{ getDiscount(row) }}٪
              </span>
              <button @click.stop="openDiscountModal(row)"
                class="w-6 h-6 rounded flex items-center justify-center text-text-disabled hover:text-primary hover:bg-primary/10 transition-colors"
                title="ویرایش تخفیف">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </button>
              <button @click.stop="clearDiscount(row)"
                class="w-6 h-6 rounded flex items-center justify-center text-text-disabled hover:text-error hover:bg-red-50 transition-colors"
                title="حذف تخفیف">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </template>
            <button v-else @click.stop="openDiscountModal(row)"
              class="text-xs text-text-disabled hover:text-primary transition-colors px-1"
              title="افزودن تخفیف">
              + تخفیف
            </button>
          </div>
        </template>

        <!-- Stock -->
        <template #cell-totalStock="{ row }">
          <span :class="[
            'font-fanum text-sm font-bold',
            row.totalStock === 0 ? 'text-error'
            : row.totalStock <= 5 ? 'text-warning'
            : 'text-text-primary',
          ]">
            {{ formatNumber(row.totalStock) }}
          </span>
        </template>

        <!-- Status inline select (optimistic toggle) -->
        <template #cell-status="{ row }">
          <select
            :value="row.status"
            @change="changeStatus(row, $event.target.value)"
            :class="[
              'text-xs font-medium px-2 py-1 rounded-lg border outline-none cursor-pointer transition-colors',
              statusSelectClass(row.status),
            ]"
          >
            <option value="active">فعال</option>
            <option value="draft">پیش‌نویس</option>
            <option value="inactive">غیرفعال</option>
          </select>
        </template>

        <!-- Actions -->
        <template #cell-actions="{ row }">
          <div class="flex items-center gap-1 justify-center">
            <button @click="openDetail(row)"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-900/20 transition-colors"
              title="جزئیات">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </button>
            <button v-if="canCreate" @click="duplicateProduct(row)"
              :disabled="duplicatingId === row._id"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-900/20 transition-colors disabled:opacity-40"
              title="کپی محصول">
              <svg v-if="duplicatingId === row._id" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
            </button>
            <RouterLink v-if="canEdit" :to="{ name: 'product-edit', params: { id: row._id } }"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors"
              title="ویرایش">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </RouterLink>
            <button v-if="canDelete" @click="confirmDelete(row)"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-red-50 hover:text-error transition-colors"
              title="حذف">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </template>

      </AdminTable>
    </div>

    <!-- Pagination -->
    <AdminPagination
      v-model="page"
      :total-pages="totalPages"
      :loading="loading"
      @update:modelValue="fetchProducts"
    />

    <!-- Discount modal -->
    <Teleport to="body">
      <div v-if="discountModal.open"
        class="fixed inset-0 z-modal flex items-center justify-center p-4"
        style="background: rgba(0,0,0,0.5);"
        @click.self="discountModal.open = false"
      >
        <div class="rounded-2xl shadow-modal w-full max-w-sm p-6 space-y-5" style="background-color: var(--color-card);">

          <div>
            <h3 class="text-base font-bold text-text-primary">تنظیم تخفیف</h3>
            <p class="text-sm text-text-secondary mt-0.5 line-clamp-1">{{ discountModal.product?.name }}</p>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-text-secondary">درصد تخفیف</label>
            <div class="flex items-center gap-3">
              <input
                v-model.number="discountModal.pct"
                type="number" min="0" max="90" step="1"
                class="field-input w-28 text-center font-fanum font-bold text-xl"
                dir="ltr"
                @keyup.enter="saveDiscount"
              />
              <span class="text-text-secondary">٪</span>
            </div>
            <p class="text-xs text-text-disabled">
              عدد ۰ یعنی بدون تخفیف — حداکثر ۹۰٪
            </p>
          </div>

          <!-- Preview -->
          <div v-if="discountModal.pct > 0 && discountModal.product" class="rounded-xl p-3 space-y-1 text-sm" style="background-color: var(--color-bg);">
            <div class="flex justify-between text-text-secondary">
              <span>قیمت اصلی</span>
              <span class="font-fanum line-through text-text-disabled">{{ formatPrice(discountModalBase) }}</span>
            </div>
            <div class="flex justify-between text-text-secondary">
              <span>قیمت با تخفیف</span>
              <span class="font-fanum font-medium text-success">{{ formatPrice(Math.round(discountModalBase * (1 - discountModal.pct / 100))) }}</span>
            </div>
          </div>

          <div class="flex gap-2 pt-1">
            <AdminButton variant="secondary" class="flex-1" @click="discountModal.open = false" :disabled="discountModal.loading">
              انصراف
            </AdminButton>
            <AdminButton class="flex-1" :loading="discountModal.loading" @click="saveDiscount">
              ذخیره
            </AdminButton>
          </div>

        </div>
      </div>
    </Teleport>


    <!-- Product detail modal -->
    <ProductDetailModal
      v-model="detailModal.open"
      :product-id="detailModal.productId"
    />

    <!-- Delete confirm -->
    <AdminConfirm
      v-model="deleteDialog.open"
      title="حذف محصول"
      :message="`آیا از حذف «${deleteDialog.product?.name}» مطمئنید؟ این عمل قابل بازگشت نیست.`"
      confirm-label="بله، حذف شود"
      confirm-variant="danger"
      :loading="deleteDialog.loading"
      @confirm="doDelete"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { productService }  from '@/services/product.service'
import { categoryService } from '@/services/category.service'
import { brandService }    from '@/services/brand.service'
import { useUiStore }      from '@/stores/ui.store'
import { useAuthStore }    from '@/stores/auth.store'
import { formatPrice, formatNumber } from '@/utils/formatters'
import { ITEMS_PER_PAGE } from '@/utils/constants'

import ProductFilters     from './components/ProductFilters.vue'
import ProductDetailModal from './components/ProductDetailModal.vue'
import AdminTable         from '@/components/common/AdminTable.vue'
import AdminButton        from '@/components/common/AdminButton.vue'
import AdminPagination    from '@/components/common/AdminPagination.vue'
import AdminConfirm       from '@/components/common/AdminConfirm.vue'

const ui     = useUiStore()
const auth   = useAuthStore()
const router = useRouter()

// ── Granular product permissions ──────────────────────────────
const canCreate         = computed(() => auth.hasPermission('products:create'))
const canEdit           = computed(() => auth.hasPermission('products:edit'))
const canDelete         = computed(() => auth.hasPermission('products:delete'))
const canViewSellPrice  = computed(() => auth.hasPermission('products:view_sell_price'))

// SVG shown inside the image container when the image URL fails to load
const noImagePlaceholder = `<svg class="w-6 h-6" style="color:#CBD5E1" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M6.75 7.5h.008v.008H6.75V7.5zm10.5 0h.008v.008h-.008V7.5zM3 6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25V6.75z"/></svg>`

const products      = ref([])
const categories    = ref([])
const brands        = ref([])
const loading       = ref(true)
const total         = ref(0)
const page          = ref(1)
const activeFilters = ref({ search: '', categoryId: '', status: '', sortBy: 'newest' })
const deleteDialog  = ref({ open: false, product: null, loading: false })
const discountModal = ref({ open: false, product: null, pct: 0, loading: false })
const detailModal   = ref({ open: false, productId: null })

// ── Duplicate ─────────────────────────────────────
const duplicatingId = ref(null)

async function duplicateProduct(row) {
  duplicatingId.value = row._id
  try {
    const { data } = await productService.duplicate(row._id)
    ui.addToast(`کپی «${row.name}» ساخته شد`, 'success')
    router.push({ name: 'product-edit', params: { id: data._id } })
  } catch {
    ui.addToast('خطا در کپی محصول', 'error')
  } finally {
    duplicatingId.value = null
  }
}

function openDetail(row) {
  detailModal.value = { open: true, productId: row._id }
}

const totalPages = computed(() => Math.ceil(total.value / ITEMS_PER_PAGE))

const columns = computed(() => [
  { key: 'name',     label: 'نام محصول', width: '260px' },
  { key: 'category', label: 'دسته‌بندی', width: '110px' },
  ...(canViewSellPrice.value
    ? [{ key: 'minPrice', label: 'قیمت فروش', width: '130px', align: 'center' }]
    : []),
  { key: 'discount',   label: 'تخفیف',  width: '120px', align: 'center' },
  { key: 'totalStock', label: 'موجودی', width: '90px',  align: 'center', sortable: true },
  { key: 'status',     label: 'وضعیت',  width: '110px', align: 'center' },
  { key: 'actions',   label: '',        width: '144px', align: 'center' },
])

async function fetchProducts() {
  loading.value = true
  try {
    const { data } = await productService.getAll({
      page:     page.value,
      limit:    ITEMS_PER_PAGE,
      search:   activeFilters.value.search     || undefined,
      category: activeFilters.value.categoryId || undefined,
      brand:    activeFilters.value.brandId    || undefined,
      status:   activeFilters.value.status     || undefined,
      sort:     activeFilters.value.sortBy,
    })
    products.value = data?.products ?? []
    total.value    = data?.total    ?? 0
  } catch {
    ui.addToast('خطا در بارگذاری محصولات', 'error')
  } finally {
    loading.value = false
  }
}

async function fetchCategories() {
  try {
    const { data } = await categoryService.getAll({ limit: 200 })
    categories.value = Array.isArray(data) ? data : (data?.items ?? [])
  } catch { /* non-critical */ }
}

async function fetchBrands() {
  try {
    const { data } = await brandService.getAll()
    brands.value = Array.isArray(data) ? data : []
  } catch { /* non-critical */ }
}

function onFilterChange(filters) {
  activeFilters.value = filters
  page.value = 1
  fetchProducts()
}

async function changeStatus(product, newStatus) {
  const prev = product.status
  product.status = newStatus
  try {
    await productService.toggleStatus(product._id, newStatus)
    ui.addToast(`وضعیت «${product.name}» تغییر کرد`, 'success')
  } catch {
    product.status = prev
    ui.addToast('خطا در تغییر وضعیت', 'error')
  }
}

function confirmDelete(product) {
  deleteDialog.value = { open: true, product, loading: false }
}

async function doDelete() {
  const product = deleteDialog.value.product
  deleteDialog.value.loading = true
  try {
    await productService.remove(product._id)
    products.value = products.value.filter(p => p._id !== product._id)
    total.value--
    ui.addToast(`محصول «${product.name}» حذف شد`, 'success')
    deleteDialog.value.open = false
  } catch {
    ui.addToast('خطا در حذف محصول', 'error')
  } finally {
    deleteDialog.value.loading = false
  }
}

// ── Discount helpers ──────────────────────────────
function getDiscount(row) {
  // Compare each variant's own price vs its own comparePrice — never cross-variant
  const active = (row.variants ?? [])
    .filter(v => v.isActive !== false && v.comparePrice > 0 && v.price > 0 && v.comparePrice > v.price)
  if (!active.length) return 0
  // Use the cheapest variant (the one driving minPrice in the table)
  active.sort((a, b) => a.price - b.price)
  const v = active[0]
  return Math.round((1 - v.price / v.comparePrice) * 100)
}

function openDiscountModal(row) {
  discountModal.value = { open: true, product: row, pct: getDiscount(row), loading: false }
}

// Base price for the discount modal preview: original price before any discount
const discountModalBase = computed(() => {
  const p = discountModal.value.product
  if (!p) return 0
  if (p.maxComparePrice > 0) return p.maxComparePrice
  const variantMax = Math.max(0, ...(p.variants ?? []).filter(v => v.comparePrice > 0).map(v => v.comparePrice))
  return variantMax > 0 ? variantMax : p.minPrice
})

function buildVariantsWithDiscount(variants, pct) {
  return (variants ?? []).map(v => {
    // Always discount from the original price (comparePrice if set, otherwise current price)
    const base = v.comparePrice > 0 ? v.comparePrice : Number(v.price)
    return {
      ...(v._id ? { _id: v._id } : {}),
      sku:          v.sku ?? '',
      price:        pct > 0 ? Math.round(base * (1 - pct / 100)) : base,
      comparePrice: pct > 0 ? base : 0,
      stock:        Number(v.stock ?? 0),
      attributes:   Array.isArray(v.attributes) ? v.attributes : [],
    }
  })
}

async function saveDiscount() {
  const { product, pct } = discountModal.value
  if (pct < 0 || pct > 90) { ui.addToast('درصد تخفیف باید بین ۰ تا ۹۰ باشد', 'error'); return }
  discountModal.value.loading = true
  try {
    const updatedVariants = buildVariantsWithDiscount(product.variants, pct)
    await productService.update(product._id, {
      name:     product.name,
      category: product.category?._id ?? product.category,
      variants: updatedVariants,
    })
    // Optimistic update: sync both price and comparePrice in the local row
    product.variants = product.variants.map((v, i) => ({
      ...v,
      price:        updatedVariants[i].price,
      comparePrice: updatedVariants[i].comparePrice,
    }))
    product.minPrice = Math.min(...product.variants.filter(v => v.isActive !== false).map(v => v.price))
    ui.addToast('تخفیف با موفقیت ذخیره شد', 'success')
    discountModal.value.open = false
  } catch {
    ui.addToast('خطا در ذخیره تخفیف', 'error')
  } finally {
    discountModal.value.loading = false
  }
}

async function clearDiscount(row) {
  try {
    const updatedVariants = buildVariantsWithDiscount(row.variants, 0)
    await productService.update(row._id, {
      name:     row.name,
      category: row.category?._id ?? row.category,
      variants: updatedVariants,
    })
    // Optimistic update: restore original price and clear comparePrice
    row.variants = row.variants.map((v, i) => ({
      ...v,
      price:        updatedVariants[i].price,
      comparePrice: 0,
    }))
    row.minPrice = Math.min(...row.variants.filter(v => v.isActive !== false).map(v => v.price))
    ui.addToast('تخفیف حذف شد', 'success')
  } catch {
    ui.addToast('خطا در حذف تخفیف', 'error')
  }
}

function statusSelectClass(status) {
  return {
    active:   'bg-green-100 text-green-700 border-green-200',
    draft:    'bg-yellow-100 text-yellow-700 border-yellow-200',
    inactive: 'bg-red-100 text-red-700 border-red-200',
  }[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'
}

onMounted(() => Promise.allSettled([fetchProducts(), fetchCategories(), fetchBrands()]))
</script>

