<template>
  <div class="space-y-4">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="page-title">کدهای تخفیف</h1>
        <p v-if="!loading"
           class="text-text-secondary text-sm mt-0.5 font-fanum">
          {{ formatNumber(total) }} کد تخفیف
        </p>
      </div>
      <AdminButton @click="openCreate">
        <svg class="w-4 h-4" fill="none" stroke="currentColor"
             stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M12 4v16m8-8H4"/>
        </svg>
        کد تخفیف جدید
      </AdminButton>
    </div>

    <!-- Filters -->
    <div class="admin-card">
      <div class="flex flex-wrap gap-3 items-end">
        <AdminInput
          v-model="search"
          placeholder="جستجو در کد تخفیف..."
          prepend="🔍"
          class="flex-1 min-w-[200px]" />
        <AdminSelect
          v-model="activeFilter"
          :options="activeOptions"
          placeholder="همه کدها"
          class="w-40" />
        <AdminButton v-if="search || activeFilter"
          variant="ghost" @click="resetFilters">
          پاک کردن
        </AdminButton>
      </div>
    </div>

    <!-- Table -->
    <div class="admin-card p-0 overflow-hidden">
      <AdminTable
        :columns="columns"
        :rows="discounts"
        :loading="loading"
        :skeleton-rows="8"
        empty-text="کد تخفیفی یافت نشد">

        <!-- Code -->
        <template #cell-code="{ row }">
          <code class="bg-surface border border-border rounded-lg
                       px-2.5 py-1 text-sm font-mono font-bold
                       text-text-primary tracking-widest">
            {{ row.code }}
          </code>
        </template>

        <!-- Type + Value -->
        <template #cell-discountType="{ row }">
          <div>
            <p class="font-bold text-text-primary text-sm font-fanum">
              {{ row.discountType === 'percentage'
                ? row.value + '٪'
                : formatPrice(row.value) }}
            </p>
            <p class="text-text-disabled text-xs">
              {{ row.discountType === 'percentage' ? 'درصدی' : 'مبلغ ثابت' }}
            </p>
          </div>
        </template>

        <!-- Usage progress -->
        <template #cell-usageCount="{ row }">
          <div class="min-w-[100px]">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-fanum text-text-secondary">
                {{ formatNumber(row.usageCount) }}
                <template v-if="row.maxUsageCount">
                  / {{ formatNumber(row.maxUsageCount) }}
                </template>
                <template v-else>
                  / <span class="text-text-disabled">∞</span>
                </template>
              </span>
            </div>
            <div v-if="row.maxUsageCount"
                 class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-300"
                   :class="usagePercent(row) > 80 ? 'bg-warning' : 'bg-primary'"
                   :style="{ width: usagePercent(row) + '%' }" />
            </div>
          </div>
        </template>

        <!-- Expiry date -->
        <template #cell-endDate="{ row }">
          <div class="text-xs">
            <p v-if="row.endDate" class="font-fanum"
               :class="isExpired(row) ? 'text-error font-medium' : 'text-text-secondary'">
              {{ isExpired(row) ? '⚠️ ' : '' }}{{ formatDate(row.endDate) }}
            </p>
            <p v-else class="text-text-disabled">بدون انقضا</p>
          </div>
        </template>

        <!-- isActive toggle -->
        <template #cell-isActive="{ row }">
          <button @click="toggleActive(row)"
            :disabled="togglingId === row._id"
            :class="[
              'relative w-10 h-[22px] rounded-full transition-colors duration-200',
              row.isActive ? 'bg-success' : 'bg-gray-300',
              togglingId === row._id
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer',
            ]">
            <span :class="[
              'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow',
              'transition-transform duration-200',
              row.isActive ? 'left-0.5 translate-x-4' : 'left-0.5',
            ]" />
          </button>
        </template>

        <!-- Actions -->
        <template #cell-actions="{ row }">
          <div class="flex items-center justify-center gap-1">
            <!-- Edit -->
            <button @click="openEdit(row)"
              title="ویرایش"
              class="w-8 h-8 rounded-lg flex items-center justify-center
                     text-text-secondary hover:bg-primary/10 hover:text-primary
                     transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor"
                   stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                     m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <!-- Delete -->
            <button @click="confirmDelete(row)"
              title="حذف"
              class="w-8 h-8 rounded-lg flex items-center justify-center
                     text-text-secondary hover:bg-red-50 hover:text-error
                     transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor"
                   stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0
                     01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1
                     1 0 00-1 1v3M4 7h16"/>
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
      @update:modelValue="fetchDiscounts" />

    <!-- Create / Edit modal -->
    <DiscountFormModal
      v-model="showFormModal"
      :discount="editingDiscount"
      @saved="onSaved" />

    <!-- Delete confirm -->
    <AdminConfirm
      v-model="deleteDialog.open"
      title="حذف کد تخفیف"
      message="این کد تخفیف برای همیشه حذف می‌شود. مطمئنید؟"
      confirm-label="بله، حذف شود"
      confirm-variant="danger"
      :loading="deleteDialog.loading"
      @confirm="doDelete" />

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { discountService } from '@/services/discount.service'
import { useUiStore }      from '@/stores/ui.store'
import { useDebounce }     from '@/composables/useDebounce'
import { formatPrice, formatNumber, formatDate } from '@/utils/formatters'
import { ITEMS_PER_PAGE }  from '@/utils/constants'
import { logger }          from '@/utils/logger'

const CTX = 'DiscountsView'

import AdminTable      from '@/components/common/AdminTable.vue'
import AdminButton     from '@/components/common/AdminButton.vue'
import AdminInput      from '@/components/common/AdminInput.vue'
import AdminSelect     from '@/components/common/AdminSelect.vue'
import AdminPagination from '@/components/common/AdminPagination.vue'
import AdminConfirm    from '@/components/common/AdminConfirm.vue'
import DiscountFormModal from './components/DiscountFormModal.vue'

const ui = useUiStore()

const discounts      = ref([])
const loading        = ref(true)
const total          = ref(0)
const page           = ref(1)
const search         = ref('')
const activeFilter   = ref('')
const togglingId     = ref(null)
const showFormModal  = ref(false)
const editingDiscount = ref(null)
const deleteDialog   = ref({ open: false, item: null, loading: false })

const dSearch    = useDebounce(search)
const totalPages = computed(() => Math.ceil(total.value / ITEMS_PER_PAGE))

watch(dSearch,      () => { page.value = 1; fetchDiscounts() })
watch(activeFilter, () => { page.value = 1; fetchDiscounts() })

const columns = [
  { key: 'code',          label: 'کد تخفیف',  width: '160px' },
  { key: 'discountType',  label: 'نوع / مقدار', width: '140px' },
  { key: 'usageCount',    label: 'استفاده',    width: '140px' },
  { key: 'endDate',       label: 'انقضا',      width: '130px' },
  { key: 'isActive',      label: 'وضعیت',      width: '80px',  align: 'center' },
  { key: 'actions',       label: '',           width: '80px',  align: 'center' },
]

const activeOptions = [
  { value: 'true',  label: 'فقط فعال‌ها' },
  { value: 'false', label: 'فقط غیرفعال‌ها' },
]

function usagePercent(row) {
  if (!row.maxUsageCount) return 0
  return Math.min(100, Math.round((row.usageCount / row.maxUsageCount) * 100))
}

function isExpired(row) {
  if (!row.endDate) return false
  return new Date(row.endDate) < new Date()
}

function openCreate() {
  editingDiscount.value = null
  showFormModal.value   = true
}

function openEdit(row) {
  editingDiscount.value = row
  showFormModal.value   = true
}

function onSaved(discount) {
  if (editingDiscount.value) {
    const idx = discounts.value.findIndex(d => d._id === discount._id)
    if (idx !== -1) discounts.value[idx] = discount
  } else {
    fetchDiscounts()
  }
}

async function toggleActive(row) {
  togglingId.value = row._id
  const prev = row.isActive
  row.isActive = !prev
  try {
    const { data } = await discountService.toggle(row._id)
    row.isActive = data?.isActive ?? !prev
    logger.info('discounts: toggled', { code: row.code, isActive: row.isActive }, CTX)
    ui.addToast(
      row.isActive ? 'کد تخفیف فعال شد' : 'کد تخفیف غیرفعال شد',
      row.isActive ? 'success' : 'warning'
    )
  } catch (err) {
    row.isActive = prev
    logger.error('discounts: toggle failed', { err, code: row.code }, CTX)
    ui.addToast('خطا در تغییر وضعیت', 'error')
  } finally {
    togglingId.value = null
  }
}

function confirmDelete(item) {
  deleteDialog.value = { open: true, item, loading: false }
}

async function doDelete() {
  deleteDialog.value.loading = true
  const item = deleteDialog.value.item
  try {
    await discountService.softDelete(item._id)
    discounts.value = discounts.value.filter(d => d._id !== item._id)
    total.value--
    logger.info('discounts: deleted', { code: item.code }, CTX)
    ui.addToast('کد تخفیف حذف شد', 'success')
    deleteDialog.value.open = false
  } catch (err) {
    logger.error('discounts: delete failed', { err, code: item.code }, CTX)
    ui.addToast('خطا در حذف کد تخفیف', 'error')
  } finally {
    deleteDialog.value.loading = false
  }
}

function resetFilters() {
  search.value      = ''
  activeFilter.value = ''
}

async function fetchDiscounts() {
  loading.value = true
  logger.debug('discounts: fetching', { page: page.value, search: dSearch.value, isActive: activeFilter.value }, CTX)
  try {
    const { data } = await discountService.getAll({
      page:    page.value,
      limit:   ITEMS_PER_PAGE,
      hasCode: true,
      ...(dSearch.value             ? { search:   dSearch.value }        : {}),
      ...(activeFilter.value !== '' ? { isActive: activeFilter.value }   : {}),
    })
    discounts.value = data?.discounts ?? []
    total.value     = data?.total     ?? 0
    logger.info('discounts: loaded', { count: discounts.value.length, total: total.value }, CTX)
  } catch (err) {
    logger.error('discounts: fetch failed', { err }, CTX)
    ui.addToast('خطا در بارگذاری کدهای تخفیف', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  logger.debug('discounts: view mounted', {}, CTX)
  fetchDiscounts()
})
</script>
