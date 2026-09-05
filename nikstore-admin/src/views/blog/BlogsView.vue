<template>
  <div class="blogs">
    <div class="blogs__head">
      <h1 class="blogs__title">مقالات وبلاگ</h1>
      <div class="blogs__head-actions">
        <router-link to="/blog/comments">
          <AdminButton variant="secondary" icon="message">مدیریت نظرات</AdminButton>
        </router-link>
        <router-link to="/blog/create">
          <AdminButton icon="plus">مقاله جدید</AdminButton>
        </router-link>
      </div>
    </div>

    <AdminCard>
      <div class="blogs__filters">
        <AdminInput
          v-model="search"
          placeholder="جستجو در عنوان یا خلاصه..."
          icon="search"
          @keyup.enter="applyFilters"
        />
        <AdminSelect
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="همه وضعیت‌ها"
          @update:model-value="applyFilters"
        />
        <AdminButton variant="secondary" size="sm" @click="applyFilters">اعمال فیلتر</AdminButton>
        <AdminButton variant="ghost" size="sm" @click="resetFilters">پاک کردن</AdminButton>
      </div>
    </AdminCard>

    <AdminCard flush>
      <AdminTable :columns="columns" :rows="posts" :loading="loading">
        <template #cell-featuredImage="{ value }">
          <div class="blogs__cover">
            <img v-if="value" :src="value" alt="" loading="lazy">
            <AppIcon v-else name="image" :size="18" />
          </div>
        </template>
        <template #cell-title="{ row }">
          <div class="blogs__title-cell">
            <span class="blogs__title-text">{{ row.title }}</span>
            <span class="blogs__slug">/{{ row.slug }}</span>
          </div>
        </template>
        <template #cell-status="{ value }">
          <AdminBadge :variant="statusVariant(value)">{{ statusLabel(value) }}</AdminBadge>
        </template>
        <template #cell-publishedAt="{ row }">
          {{ formatDate(row.publishedAt || row.createdAt) }}
        </template>
        <template #cell-actions="{ row }">
          <div class="blogs__row-actions">
            <router-link :to="`/blog/${row._id}/edit`">
              <AdminButton variant="ghost" size="sm" icon="edit">ویرایش</AdminButton>
            </router-link>
            <AdminButton variant="ghost" size="sm" icon="trash" @click="confirmDelete(row)">
              حذف
            </AdminButton>
          </div>
        </template>
        <template #empty>هنوز مقاله‌ای ثبت نشده است</template>
      </AdminTable>

      <AdminPagination v-model:page="page" :page-size="limit" :total="total" @update:page="fetchPosts" />
    </AdminCard>

    <AdminConfirm
      v-model="confirmOpen"
      title="حذف مقاله"
      :message="`آیا از حذف «${toDelete?.title ?? ''}» مطمئن هستید؟`"
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
import AppIcon from '../../components/icons/AppIcon.vue'
import { blogService } from '../../services/blog.service'

const columns = [
  { key: 'featuredImage', label: 'تصویر', width: '64px' },
  { key: 'title', label: 'عنوان' },
  { key: 'status', label: 'وضعیت' },
  { key: 'publishedAt', label: 'تاریخ انتشار' },
  { key: 'actions', label: '', width: '180px', align: 'end' },
]

const statusOptions = [
  { label: 'پیش‌نویس', value: 'draft' },
  { label: 'منتشرشده', value: 'published' },
  { label: 'بایگانی‌شده', value: 'archived' },
]

const posts = ref([])
const loading = ref(true)
const search = ref('')
const statusFilter = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)

const confirmOpen = ref(false)
const deleting = ref(false)
const toDelete = ref(null)

function statusLabel(status) {
  return statusOptions.find((o) => o.value === status)?.label ?? status
}
function statusVariant(status) {
  if (status === 'published') return 'success'
  if (status === 'archived') return 'danger'
  return 'pending'
}
function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('fa-IR')
}

async function fetchPosts() {
  loading.value = true
  try {
    const { data } = await blogService.getAdminList({
      page: page.value,
      limit: limit.value,
      search: search.value || undefined,
      status: statusFilter.value || undefined,
    })
    posts.value = data?.posts ?? []
    total.value = data?.total ?? 0
  } catch {
    posts.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  page.value = 1
  fetchPosts()
}

function resetFilters() {
  search.value = ''
  statusFilter.value = ''
  applyFilters()
}

function confirmDelete(row) {
  toDelete.value = row
  confirmOpen.value = true
}

async function handleDelete() {
  if (!toDelete.value) return
  deleting.value = true
  try {
    await blogService.remove(toDelete.value._id)
    confirmOpen.value = false
    await fetchPosts()
  } finally {
    deleting.value = false
    toDelete.value = null
  }
}

onMounted(fetchPosts)
</script>

<style scoped>
.blogs {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.blogs__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.blogs__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}
.blogs__head-actions {
  display: flex;
  gap: 10px;
}
.blogs__filters {
  display: grid;
  grid-template-columns: 2fr 1fr auto auto;
  gap: 12px;
  align-items: end;
}
@media (max-width: 1023px) {
  .blogs__filters {
    grid-template-columns: 1fr;
  }
}
.blogs__cover {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  color: var(--text-disabled);
}
.blogs__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.blogs__title-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.blogs__title-text {
  font-weight: 600;
  color: var(--text-primary);
}
.blogs__slug {
  font-size: 11.5px;
  color: var(--text-secondary);
  direction: ltr;
  text-align: start;
}
.blogs__row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}
</style>
