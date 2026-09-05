<template>
  <div class="products-view">
    <div class="products-view__header">
      <h1 class="products-view__title">محصولات</h1>
      <AdminButton icon="plus" @click="router.push('/products/new')">افزودن محصول</AdminButton>
    </div>

    <AdminCard>
      <ProductFilters v-model="filters" :categories="categories" />
    </AdminCard>

    <AdminCard flush>
      <AdminTable :columns="columns" :rows="products" :loading="loading">
        <template #cell-thumbnail="{ row }">
          <img
            v-if="row.thumbnail || row.images?.[0]"
            :src="row.thumbnail || row.images[0]"
            class="products-view__thumb"
            :alt="row.name"
          >
          <div v-else class="products-view__thumb products-view__thumb--empty">
            <AppIcon name="image" :size="16" />
          </div>
        </template>
        <template #cell-name="{ row }">
          <div class="products-view__name">{{ row.name }}</div>
          <div class="products-view__slug">{{ row.slug }}</div>
        </template>
        <template #cell-category="{ row }">{{ row.category?.name || '—' }}</template>
        <template #cell-price="{ row }">
          <span v-if="row.minPrice === row.maxPrice">{{ formatPrice(row.minPrice) }}</span>
          <span v-else>{{ formatPrice(row.minPrice) }} تا {{ formatPrice(row.maxPrice) }}</span>
        </template>
        <template #cell-totalStock="{ value }">
          <AdminBadge :variant="value > 0 ? 'success' : 'danger'">{{ formatNumber(value) }} عدد</AdminBadge>
        </template>
        <template #cell-status="{ value }">
          <AdminBadge :variant="statusVariant(value)">{{ statusLabel(value) }}</AdminBadge>
        </template>
        <template #cell-actions="{ row }">
          <div class="products-view__actions">
            <button type="button" class="products-view__icon-btn" title="ویرایش" @click="router.push(`/products/${row._id}/edit`)">
              <AppIcon name="edit" :size="16" />
            </button>
            <button type="button" class="products-view__icon-btn" title="کپی" @click="handleDuplicate(row)">
              <AppIcon name="copy" :size="16" />
            </button>
            <button type="button" class="products-view__icon-btn products-view__icon-btn--danger" title="حذف" @click="confirmRemove(row)">
              <AppIcon name="trash" :size="16" />
            </button>
          </div>
        </template>
      </AdminTable>
    </AdminCard>

    <AdminPagination v-model:page="page" :page-size="limit" :total="total" @update:page="load" />

    <AdminConfirm
      v-model="confirmOpen"
      title="حذف محصول"
      :message="`آیا از حذف «${pendingProduct?.name}» مطمئن هستید؟ این عملیات قابل بازگشت نیست.`"
      danger
      :loading="removing"
      @confirm="handleRemove"
    />
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AdminCard from '../../components/common/AdminCard.vue'
import AdminTable from '../../components/common/AdminTable.vue'
import AdminBadge from '../../components/common/AdminBadge.vue'
import AdminButton from '../../components/common/AdminButton.vue'
import AdminPagination from '../../components/common/AdminPagination.vue'
import AdminConfirm from '../../components/common/AdminConfirm.vue'
import AppIcon from '../../components/icons/AppIcon.vue'
import ProductFilters from './components/ProductFilters.vue'
import { productService } from '../../services/product.service'
import { categoryService } from '../../services/category.service'
import { formatPrice, formatNumber } from '../../utils/format'

const router = useRouter()

const columns = [
  { key: 'thumbnail', label: '', width: '56px' },
  { key: 'name', label: 'محصول' },
  { key: 'category', label: 'دسته‌بندی' },
  { key: 'price', label: 'قیمت' },
  { key: 'totalStock', label: 'موجودی' },
  { key: 'status', label: 'وضعیت' },
  { key: 'actions', label: '', width: '120px', align: 'end' },
]

const products = ref([])
const categories = ref([])
const loading = ref(true)
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const filters = ref({ search: '', category: '', status: '' })

const confirmOpen = ref(false)
const pendingProduct = ref(null)
const removing = ref(false)

function statusLabel(status) {
  return { active: 'در حال فروش', draft: 'پیش‌نویس', inactive: 'غیرفعال' }[status] || status
}
function statusVariant(status) {
  return { active: 'success', draft: 'pending', inactive: 'neutral' }[status] || 'neutral'
}

async function load() {
  loading.value = true
  try {
    const { data } = await productService.adminList({
      page: page.value,
      limit: limit.value,
      search: filters.value.search || undefined,
      category: filters.value.category || undefined,
      status: filters.value.status || undefined,
    })
    products.value = data?.products ?? []
    total.value = data?.total ?? 0
  } catch {
    products.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  try {
    const { data } = await categoryService.list()
    categories.value = data ?? []
  } catch {
    categories.value = []
  }
}

async function handleDuplicate(row) {
  try {
    await productService.duplicate(row._id)
    await load()
  } catch {
    // silently ignored — table stays as-is if duplication fails
  }
}

function confirmRemove(row) {
  pendingProduct.value = row
  confirmOpen.value = true
}

async function handleRemove() {
  if (!pendingProduct.value) return
  removing.value = true
  try {
    await productService.remove(pendingProduct.value._id)
    confirmOpen.value = false
    await load()
  } finally {
    removing.value = false
  }
}

let debounceTimer = null
function onFiltersChange() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    load()
  }, 150)
}

watch(filters, onFiltersChange, { deep: true })

onMounted(() => {
  load()
  loadCategories()
})
</script>

<style scoped>
.products-view {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.products-view__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.products-view__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}
.products-view__thumb {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  display: block;
}
.products-view__thumb--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  color: var(--text-disabled);
}
.products-view__name {
  font-weight: 600;
  color: var(--text-primary);
}
.products-view__slug {
  font-size: 11px;
  color: var(--text-secondary);
}
.products-view__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}
.products-view__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--glass-border);
  cursor: pointer;
}
.products-view__icon-btn:hover {
  background: var(--glass);
  color: var(--text-primary);
}
.products-view__icon-btn--danger:hover {
  color: #D9534F;
  border-color: #D9534F;
}
</style>
