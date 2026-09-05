<template>
  <div class="comments">
    <div class="comments__head">
      <h1 class="comments__title">مدیریت نظرات وبلاگ</h1>
      <router-link to="/blog">
        <AdminButton variant="secondary" size="sm">بازگشت به مقالات</AdminButton>
      </router-link>
    </div>

    <AdminCard>
      <div class="comments__filters">
        <AdminInput v-model="search" placeholder="جستجو در متن نظر..." icon="search" @keyup.enter="applyFilters" />
        <AdminSelect v-model="statusFilter" :options="statusOptions" placeholder="همه وضعیت‌ها" @update:model-value="applyFilters" />
        <AdminButton variant="secondary" size="sm" @click="applyFilters">اعمال فیلتر</AdminButton>
        <AdminBadge v-if="pendingCount" variant="pending">{{ pendingCount }} در انتظار تایید</AdminBadge>
      </div>
    </AdminCard>

    <AdminCard flush>
      <AdminTable :columns="columns" :rows="comments" :loading="loading">
        <template #cell-content="{ value }">
          <span class="comments__excerpt">{{ value }}</span>
        </template>
        <template #cell-blog="{ row }">
          {{ row.blog?.title ?? '—' }}
        </template>
        <template #cell-author="{ row }">
          {{ authorName(row.author) }}
        </template>
        <template #cell-isApproved="{ value }">
          <AdminBadge :variant="value ? 'success' : 'pending'">{{ value ? 'تایید‌شده' : 'در انتظار' }}</AdminBadge>
        </template>
        <template #cell-createdAt="{ value }">
          {{ formatDate(value) }}
        </template>
        <template #cell-actions="{ row }">
          <div class="comments__row-actions">
            <AdminButton
              v-if="!row.isApproved"
              variant="ghost"
              size="sm"
              icon="check"
              :loading="approvingId === row._id"
              @click="handleApprove(row)"
            >
              تایید
            </AdminButton>
            <AdminButton variant="ghost" size="sm" icon="trash" @click="confirmDelete(row)">
              حذف
            </AdminButton>
          </div>
        </template>
        <template #empty>نظری برای نمایش وجود ندارد</template>
      </AdminTable>

      <AdminPagination v-model:page="page" :page-size="limit" :total="total" @update:page="fetchComments" />
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
import { onMounted, ref } from 'vue'
import AdminCard from '../../components/common/AdminCard.vue'
import AdminTable from '../../components/common/AdminTable.vue'
import AdminButton from '../../components/common/AdminButton.vue'
import AdminInput from '../../components/common/AdminInput.vue'
import AdminSelect from '../../components/common/AdminSelect.vue'
import AdminBadge from '../../components/common/AdminBadge.vue'
import AdminPagination from '../../components/common/AdminPagination.vue'
import AdminConfirm from '../../components/common/AdminConfirm.vue'
import { blogService } from '../../services/blog.service'

const columns = [
  { key: 'content', label: 'متن نظر' },
  { key: 'blog', label: 'مقاله' },
  { key: 'author', label: 'نویسنده' },
  { key: 'isApproved', label: 'وضعیت' },
  { key: 'createdAt', label: 'تاریخ' },
  { key: 'actions', label: '', width: '160px', align: 'end' },
]

const statusOptions = [
  { label: 'در انتظار', value: 'pending' },
  { label: 'تایید‌شده', value: 'approved' },
]

const comments = ref([])
const loading = ref(true)
const search = ref('')
const statusFilter = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const pendingCount = ref(0)

const approvingId = ref(null)
const confirmOpen = ref(false)
const deleting = ref(false)
const toDelete = ref(null)

function authorName(author) {
  if (!author) return '—'
  const name = [author.firstName, author.lastName].filter(Boolean).join(' ')
  return name || author.phone || '—'
}
function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('fa-IR')
}

async function fetchComments() {
  loading.value = true
  try {
    const { data } = await blogService.getAllComments({
      page: page.value,
      limit: limit.value,
      status: statusFilter.value || undefined,
      search: search.value || undefined,
    })
    comments.value = data?.items ?? []
    total.value = data?.total ?? 0
    pendingCount.value = data?.pendingCount ?? 0
  } catch {
    comments.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  page.value = 1
  fetchComments()
}

async function handleApprove(row) {
  approvingId.value = row._id
  try {
    await blogService.approveComment(row._id)
    row.isApproved = true
    pendingCount.value = Math.max(0, pendingCount.value - 1)
  } finally {
    approvingId.value = null
  }
}

function confirmDelete(row) {
  toDelete.value = row
  confirmOpen.value = true
}

async function handleDelete() {
  if (!toDelete.value) return
  deleting.value = true
  try {
    await blogService.deleteComment(toDelete.value._id)
    confirmOpen.value = false
    await fetchComments()
  } finally {
    deleting.value = false
    toDelete.value = null
  }
}

onMounted(fetchComments)
</script>

<style scoped>
.comments {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.comments__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.comments__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}
.comments__filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.comments__filters > :first-child {
  flex: 1;
  min-width: 220px;
}
.comments__excerpt {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 420px;
  color: var(--text-primary);
}
.comments__row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}
</style>
