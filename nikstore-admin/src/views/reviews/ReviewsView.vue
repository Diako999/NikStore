<template>
  <div class="reviews">
    <div class="reviews__head">
      <h1 class="reviews__title">نظرات</h1>
      <AdminSelect v-model="statusFilter" :options="statusOptions" class="reviews__filter" />
    </div>

    <AdminCard flush>
      <AdminTable :columns="columns" :rows="reviews" :loading="loading">
        <template #cell-product="{ row }">
          {{ row.productId?.name || row.productId || '—' }}
        </template>
        <template #cell-user="{ row }">
          {{ userLabel(row.userId) }}
        </template>
        <template #cell-rating="{ value }">
          <span class="reviews__stars">{{ '★'.repeat(value) }}{{ '☆'.repeat(5 - value) }}</span>
        </template>
        <template #cell-body="{ row }">
          <div class="reviews__body-cell">
            <strong v-if="row.title">{{ row.title }}</strong>
            <span class="reviews__body-excerpt">{{ row.body }}</span>
          </div>
        </template>
        <template #cell-status="{ value }">
          <AdminBadge :variant="statusVariant(value)">{{ statusLabel(value) }}</AdminBadge>
        </template>
        <template #cell-actions="{ row }">
          <div class="reviews__row-actions">
            <AdminButton
              v-if="row.status !== 'approved'"
              variant="ghost"
              size="sm"
              icon="check"
              @click="setStatus(row, 'approved')"
            >
              تایید
            </AdminButton>
            <AdminButton
              v-if="row.status !== 'rejected'"
              variant="ghost"
              size="sm"
              icon="close"
              @click="setStatus(row, 'rejected')"
            >
              رد
            </AdminButton>
            <AdminButton variant="ghost" size="sm" icon="trash" @click="confirmDelete(row)">حذف</AdminButton>
          </div>
        </template>
        <template #empty>نظری برای نمایش وجود ندارد</template>
      </AdminTable>
      <AdminPagination v-model:page="page" :page-size="limit" :total="total" />
    </AdminCard>

    <AdminConfirm
      v-model="confirmOpen"
      title="حذف نظر"
      message="آیا از حذف این نظر مطمئن هستید؟"
      danger
      :loading="deleting"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import AdminCard from '../../components/common/AdminCard.vue'
import AdminTable from '../../components/common/AdminTable.vue'
import AdminButton from '../../components/common/AdminButton.vue'
import AdminBadge from '../../components/common/AdminBadge.vue'
import AdminSelect from '../../components/common/AdminSelect.vue'
import AdminPagination from '../../components/common/AdminPagination.vue'
import AdminConfirm from '../../components/common/AdminConfirm.vue'
import { reviewService } from '../../services/review.service'

const columns = [
  { key: 'product', label: 'محصول' },
  { key: 'user', label: 'کاربر' },
  { key: 'rating', label: 'امتیاز' },
  { key: 'body', label: 'متن' },
  { key: 'status', label: 'وضعیت' },
  { key: 'actions', label: '', width: '220px', align: 'end' },
]

const statusOptions = [
  { label: 'در انتظار بررسی', value: 'pending' },
  { label: 'تاییدشده', value: 'approved' },
  { label: 'ردشده', value: 'rejected' },
  { label: 'همه', value: '' },
]

const reviews = ref([])
const total = ref(0)
const page = ref(1)
const limit = 20
const loading = ref(true)
const statusFilter = ref('pending')

const confirmOpen = ref(false)
const deleting = ref(false)
const toDelete = ref(null)

function userLabel(user) {
  if (!user || typeof user === 'string') return user || '—'
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.phone || '—'
}

function statusLabel(value) {
  return { pending: 'در انتظار', approved: 'تاییدشده', rejected: 'ردشده' }[value] || value
}

function statusVariant(value) {
  return { pending: 'pending', approved: 'success', rejected: 'danger' }[value] || 'neutral'
}

async function fetchReviews() {
  loading.value = true
  try {
    const { data } = await reviewService.getAdminList({
      page: page.value,
      limit,
      status: statusFilter.value || undefined,
    })
    reviews.value = data?.items ?? data?.reviews ?? []
    total.value = data?.total ?? reviews.value.length
  } catch {
    reviews.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function setStatus(row, status) {
  await reviewService.updateStatus(row._id, { status })
  await fetchReviews()
}

function confirmDelete(row) {
  toDelete.value = row
  confirmOpen.value = true
}

async function handleDelete() {
  if (!toDelete.value) return
  deleting.value = true
  try {
    await reviewService.remove(toDelete.value._id)
    confirmOpen.value = false
    await fetchReviews()
  } finally {
    deleting.value = false
    toDelete.value = null
  }
}

watch(statusFilter, () => {
  page.value = 1
  fetchReviews()
})
watch(page, fetchReviews)
onMounted(fetchReviews)
</script>

<style scoped>
.reviews { display: flex; flex-direction: column; gap: 20px; }
.reviews__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.reviews__title { font-size: 20px; font-weight: 700; color: var(--text-primary); }
.reviews__filter { min-width: 180px; }
.reviews__stars { color: #E7C878; letter-spacing: 1px; }
.reviews__body-cell { display: flex; flex-direction: column; gap: 2px; max-width: 320px; }
.reviews__body-excerpt { font-size: 12px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.reviews__row-actions { display: flex; justify-content: flex-end; gap: 4px; }
</style>
