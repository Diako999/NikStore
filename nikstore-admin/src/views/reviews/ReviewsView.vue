<template>
  <div class="space-y-4">

    <!-- Header -->
    <div class="flex items-center gap-3 flex-wrap">
      <h1 class="page-title">نظرات</h1>
      <span v-if="pendingCount > 0"
        class="flex items-center gap-1.5 bg-warning/10 text-warning
               text-xs font-bold px-3 py-1 rounded-full font-fanum">
        <span class="w-2 h-2 rounded-full bg-warning animate-pulse" />
        {{ pendingCount }} نظر در انتظار تأیید
      </span>
    </div>

    <!-- Status tab bar + search -->
    <div class="admin-card">
      <div class="flex flex-wrap items-center justify-between gap-3">

        <!-- Status tabs -->
        <div class="flex items-center gap-1 bg-surface rounded-xl p-1">
          <button
            v-for="tab in statusTabs" :key="tab.value"
            @click="selectTab(tab.value)"
            :class="[
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              activeStatus === tab.value
                ? 'bg-card text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary',
            ]">
            {{ tab.label }}
            <span v-if="tab.count != null"
              class="mr-1.5 font-fanum text-xs"
              :class="tab.value === 'pending' && tab.count > 0
                ? 'text-warning font-bold'
                : 'text-text-disabled'">
              ({{ tab.count }})
            </span>
          </button>
        </div>

        <!-- Search -->
        <AdminInput
          v-model="search"
          placeholder="جستجو در نام محصول یا کاربر..."
          prepend="🔍"
          class="w-72" />
      </div>
    </div>

    <!-- Table -->
    <div class="admin-card p-0 overflow-hidden">
      <AdminTable
        :columns="columns"
        :rows="reviews"
        :loading="loading"
        :skeleton-rows="8"
        empty-text="نظری یافت نشد">

        <!-- Product -->
        <template #cell-product="{ row }">
          <div class="flex items-center gap-2.5 min-w-0">
            <img
              :src="row.productId?.thumbnail"
              class="w-10 h-10 rounded-lg object-contain border border-border bg-surface flex-shrink-0 p-0.5"
              @error="(e) => e.target.style.display = 'none'" />
            <div class="min-w-0 flex-1">
              <router-link
                v-if="row.productId?._id"
                :to="{ name: 'product-edit', params: { id: row.productId._id } }"
                class="text-sm font-medium text-text-primary hover:text-primary hover:underline transition-colors truncate block max-w-[150px]"
                :title="row.productId.name">
                {{ row.productId.name || '(بدون نام)' }}
              </router-link>
              <span v-else class="text-text-disabled text-sm">محصول حذف شده</span>
              <a
                v-if="row.productId?.slug"
                :href="`http://localhost:5173/product/${row.productId.slug}`"
                target="_blank"
                rel="noopener"
                class="text-xs text-text-disabled hover:text-primary transition-colors flex items-center gap-1 mt-0.5">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
                مشاهده در سایت
              </a>
            </div>
          </div>
        </template>

        <!-- User -->
        <template #cell-user="{ row }">
          <div>
            <p class="text-text-primary text-sm font-medium">
              {{ row.userId?.firstName ?? '' }} {{ row.userId?.lastName ?? '' }}
            </p>
            <p class="text-text-disabled text-xs font-fanum" dir="ltr">
              {{ row.userId?.phone }}
            </p>
          </div>
        </template>

        <!-- Rating stars -->
        <template #cell-rating="{ row }">
          <div class="flex items-center gap-0.5 justify-center">
            <span v-for="i in 5" :key="i"
              :class="i <= row.rating ? 'text-yellow-400' : 'text-gray-200'"
              class="text-base leading-none">★</span>
          </div>
        </template>

        <!-- Comment preview with expand -->
        <template #cell-comment="{ row }">
          <div class="max-w-xs">
            <p v-if="row.title"
               class="font-medium text-text-primary text-xs mb-0.5 truncate">
              {{ row.title }}
            </p>
            <p class="text-text-secondary text-xs leading-5 line-clamp-2">
              {{ row.body }}
            </p>
            <button v-if="row.body?.length > 80"
              @click="expandedId = expandedId === row._id ? null : row._id"
              class="text-primary text-xs mt-1 hover:underline">
              {{ expandedId === row._id ? 'بستن' : 'بیشتر...' }}
            </button>
            <div v-if="expandedId === row._id"
                 class="mt-2 p-3 bg-surface rounded-lg border border-border
                        text-text-secondary text-xs leading-6">
              {{ row.body }}
            </div>
          </div>
        </template>

        <!-- Status badge -->
        <template #cell-status="{ row }">
          <AdminBadge
            :variant="REVIEW_STATUSES[row.status]?.color ?? 'gray'"
            size="sm">
            {{ REVIEW_STATUSES[row.status]?.label ?? row.status }}
          </AdminBadge>
        </template>

        <!-- Date -->
        <template #cell-createdAt="{ row }">
          <span class="text-text-secondary text-xs font-fanum">
            {{ formatDate(row.createdAt) }}
          </span>
        </template>

        <!-- Actions: approve / reject / delete -->
        <template #cell-actions="{ row }">
          <div class="flex items-center justify-center gap-1">

            <!-- Approve -->
            <button v-if="row.status !== 'approved'"
              @click="approve(row)"
              :disabled="actionLoading === row._id"
              title="تأیید"
              class="w-8 h-8 rounded-lg flex items-center justify-center
                     text-text-secondary hover:bg-green-50 hover:text-success
                     transition-colors disabled:opacity-40">
              <svg class="w-4 h-4" fill="none" stroke="currentColor"
                   stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M5 13l4 4L19 7"/>
              </svg>
            </button>

            <!-- Reject -->
            <button v-if="row.status !== 'rejected'"
              @click="reject(row)"
              :disabled="actionLoading === row._id"
              title="رد"
              class="w-8 h-8 rounded-lg flex items-center justify-center
                     text-text-secondary hover:bg-yellow-50 hover:text-warning
                     transition-colors disabled:opacity-40">
              <svg class="w-4 h-4" fill="none" stroke="currentColor"
                   stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            <!-- Delete -->
            <button
              @click="confirmDeleteReview(row)"
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
      @update:modelValue="fetchReviews" />

    <!-- Delete confirm -->
    <AdminConfirm
      v-model="deleteDialog.open"
      title="حذف نظر"
      message="این نظر برای همیشه حذف می‌شود. مطمئنید؟"
      confirm-label="بله، حذف شود"
      confirm-variant="danger"
      :loading="deleteDialog.loading"
      @confirm="doDeleteReview" />

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { reviewService } from '@/services/review.service'
import { useUiStore }    from '@/stores/ui.store'
import { useDebounce }   from '@/composables/useDebounce'
import { formatDate }    from '@/utils/formatters'
import { REVIEW_STATUSES, ITEMS_PER_PAGE } from '@/utils/constants'

import AdminTable      from '@/components/common/AdminTable.vue'
import AdminBadge      from '@/components/common/AdminBadge.vue'
import AdminInput      from '@/components/common/AdminInput.vue'
import AdminPagination from '@/components/common/AdminPagination.vue'
import AdminConfirm    from '@/components/common/AdminConfirm.vue'

const ui = useUiStore()

const reviews       = ref([])
const loading       = ref(true)
const total         = ref(0)
const pendingCount  = ref(0)
const page          = ref(1)
const activeStatus  = ref('')
const search        = ref('')
const expandedId    = ref(null)
const actionLoading = ref(null)
const deleteDialog  = ref({ open: false, review: null, loading: false })

const dSearch    = useDebounce(search)
const totalPages = computed(() => Math.ceil(total.value / ITEMS_PER_PAGE))

watch(dSearch, () => { page.value = 1; fetchReviews() })

const statusTabs = computed(() => [
  { value: '',         label: 'همه',        count: null },
  { value: 'pending',  label: 'در انتظار',  count: pendingCount.value },
  { value: 'approved', label: 'تأیید شده',  count: null },
  { value: 'rejected', label: 'رد شده',     count: null },
])

const columns = [
  { key: 'product',   label: 'محصول',  width: '220px' },
  { key: 'user',      label: 'کاربر',  width: '150px' },
  { key: 'rating',    label: 'امتیاز', width: '110px', align: 'center' },
  { key: 'comment',   label: 'نظر',    width: '260px' },
  { key: 'status',    label: 'وضعیت',  width: '100px', align: 'center' },
  { key: 'createdAt', label: 'تاریخ',  width: '110px' },
  { key: 'actions',   label: '',       width: '110px', align: 'center' },
]

function selectTab(value) {
  activeStatus.value = value
  page.value = 1
  fetchReviews()
}

async function fetchReviews() {
  loading.value = true
  try {
    const { data } = await reviewService.getAll({
      page:  page.value,
      limit: ITEMS_PER_PAGE,
      ...(activeStatus.value ? { status: activeStatus.value } : {}),
      ...(dSearch.value       ? { search: dSearch.value }      : {}),
    })
    reviews.value      = data?.items       ?? []
    total.value        = data?.total       ?? 0
    pendingCount.value = data?.pendingCount ?? 0
  } catch {
    ui.addToast('خطا در بارگذاری نظرات', 'error')
  } finally {
    loading.value = false
  }
}

async function approve(review) {
  actionLoading.value = review._id
  try {
    await reviewService.approve(review._id)
    review.status = 'approved'
    if (pendingCount.value > 0) pendingCount.value--
    ui.addToast('نظر تأیید شد', 'success')
  } catch {
    ui.addToast('خطا در تأیید نظر', 'error')
  } finally {
    actionLoading.value = null
  }
}

async function reject(review) {
  actionLoading.value = review._id
  try {
    await reviewService.reject(review._id)
    review.status = 'rejected'
    if (pendingCount.value > 0) pendingCount.value--
    ui.addToast('نظر رد شد', 'warning')
  } catch {
    ui.addToast('خطا در رد نظر', 'error')
  } finally {
    actionLoading.value = null
  }
}

function confirmDeleteReview(review) {
  deleteDialog.value = { open: true, review, loading: false }
}

async function doDeleteReview() {
  const review = deleteDialog.value.review
  deleteDialog.value.loading = true
  try {
    await reviewService.remove(review._id)
    reviews.value = reviews.value.filter(r => r._id !== review._id)
    total.value--
    if (review.status === 'pending' && pendingCount.value > 0)
      pendingCount.value--
    ui.addToast('نظر حذف شد', 'success')
    deleteDialog.value.open = false
  } catch {
    ui.addToast('خطا در حذف نظر', 'error')
  } finally {
    deleteDialog.value.loading = false
  }
}

onMounted(fetchReviews)
</script>
