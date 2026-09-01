<template>
  <div class="space-y-4">

    <!-- Header -->
    <div class="flex items-center gap-3 flex-wrap">
      <h1 class="page-title">نظرات مقالات</h1>
      <span v-if="pendingCount > 0"
        class="flex items-center gap-1.5 bg-warning/10 text-warning
               text-xs font-bold px-3 py-1 rounded-full font-fanum">
        <span class="w-2 h-2 rounded-full bg-warning animate-pulse" />
        {{ pendingCount }} نظر در انتظار تأیید
      </span>
    </div>

    <!-- Filters bar -->
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
          placeholder="جستجو در متن نظر..."
          prepend="🔍"
          class="w-72" />
      </div>
    </div>

    <!-- Table -->
    <div class="admin-card p-0 overflow-hidden">
      <AdminTable
        :columns="columns"
        :rows="comments"
        :loading="loading"
        :skeleton-rows="8"
        empty-text="نظری یافت نشد">

        <!-- Blog post -->
        <template #cell-blog="{ row }">
          <div class="min-w-0">
            <p class="text-sm font-medium text-text-primary truncate max-w-[180px]"
               :title="row.blog?.title">
              {{ row.blog?.title ?? '(مقاله حذف شده)' }}
            </p>
            <a
              v-if="row.blog?.slug"
              :href="`${siteUrl}/blog/${row.blog.slug}`"
              target="_blank" rel="noopener"
              class="text-xs text-text-disabled hover:text-primary transition-colors
                     flex items-center gap-1 mt-0.5">
              <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor"
                   stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4
                     M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
              مشاهده در سایت
            </a>
          </div>
        </template>

        <!-- Author -->
        <template #cell-author="{ row }">
          <div>
            <p class="text-text-primary text-sm font-medium">
              {{ row.author?.firstName ?? '' }} {{ row.author?.lastName ?? '' }}
            </p>
            <p class="text-text-disabled text-xs font-fanum" dir="ltr">
              {{ row.author?.phone ?? '—' }}
            </p>
          </div>
        </template>

        <!-- Comment content (expandable) -->
        <template #cell-content="{ row }">
          <div class="max-w-xs">
            <p class="text-text-secondary text-xs leading-5 line-clamp-2">
              {{ row.content }}
            </p>
            <button v-if="row.content?.length > 80"
              @click="expandedId = expandedId === row._id ? null : row._id"
              class="text-primary text-xs mt-1 hover:underline">
              {{ expandedId === row._id ? 'بستن' : 'بیشتر...' }}
            </button>
            <div v-if="expandedId === row._id"
                 class="mt-2 p-3 bg-surface rounded-lg border border-border
                        text-text-secondary text-xs leading-6">
              {{ row.content }}
            </div>
          </div>
        </template>

        <!-- Status badge -->
        <template #cell-status="{ row }">
          <AdminBadge
            :variant="row.isApproved ? 'success' : 'warning'"
            size="sm">
            {{ row.isApproved ? 'تأیید شده' : 'در انتظار' }}
          </AdminBadge>
        </template>

        <!-- Date -->
        <template #cell-createdAt="{ row }">
          <span class="text-text-secondary text-xs font-fanum">
            {{ formatDate(row.createdAt) }}
          </span>
        </template>

        <!-- Actions -->
        <template #cell-actions="{ row }">
          <div class="flex items-center justify-center gap-1">

            <!-- Approve (only if pending) -->
            <button v-if="!row.isApproved"
              @click="approve(row)"
              :disabled="actionLoading === row._id"
              title="تأیید نظر"
              class="w-8 h-8 rounded-lg flex items-center justify-center
                     text-text-secondary hover:bg-green-50 hover:text-success
                     transition-colors disabled:opacity-40">
              <svg class="w-4 h-4" fill="none" stroke="currentColor"
                   stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M5 13l4 4L19 7"/>
              </svg>
            </button>

            <!-- Delete -->
            <button
              @click="confirmDelete(row)"
              title="حذف نظر"
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
      @update:modelValue="fetchComments" />

    <!-- Delete confirm -->
    <AdminConfirm
      v-model="deleteDialog.open"
      title="حذف نظر"
      message="این نظر برای همیشه حذف می‌شود. مطمئنید؟"
      confirm-label="بله، حذف شود"
      confirm-variant="danger"
      :loading="deleteDialog.loading"
      @confirm="doDelete" />

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { blogCommentService } from '@/services/blog-comment.service'
import { useUiStore }         from '@/stores/ui.store'
import { useDebounce }        from '@/composables/useDebounce'
import { formatDate }         from '@/utils/formatters'
import { ITEMS_PER_PAGE }     from '@/utils/constants'
import { logger }             from '@/utils/logger'

import AdminTable      from '@/components/common/AdminTable.vue'
import AdminBadge      from '@/components/common/AdminBadge.vue'
import AdminInput      from '@/components/common/AdminInput.vue'
import AdminPagination from '@/components/common/AdminPagination.vue'
import AdminConfirm    from '@/components/common/AdminConfirm.vue'

const ui      = useUiStore()
const siteUrl = import.meta.env.VITE_SITE_URL || ''

const comments      = ref([])
const loading       = ref(true)
const total         = ref(0)
const pendingCount  = ref(0)
const page          = ref(1)
const activeStatus  = ref('')
const search        = ref('')
const expandedId    = ref(null)
const actionLoading = ref(null)
const deleteDialog  = ref({ open: false, comment: null, loading: false })

const dSearch    = useDebounce(search)
const totalPages = computed(() => Math.ceil(total.value / ITEMS_PER_PAGE))

const statusTabs = computed(() => [
  { value: '',         label: 'همه',       count: null },
  { value: 'pending',  label: 'در انتظار', count: pendingCount.value },
  { value: 'approved', label: 'تأیید شده', count: null },
])

const columns = [
  { key: 'blog',      label: 'مقاله',   width: '200px' },
  { key: 'author',    label: 'کاربر',   width: '150px' },
  { key: 'content',   label: 'نظر',     width: '280px' },
  { key: 'status',    label: 'وضعیت',   width: '110px', align: 'center' },
  { key: 'createdAt', label: 'تاریخ',   width: '110px' },
  { key: 'actions',   label: '',        width: '90px',  align: 'center' },
]

watch(dSearch, () => { page.value = 1; fetchComments() })

function selectTab(value) {
  activeStatus.value = value
  page.value = 1
  fetchComments()
}

async function fetchComments() {
  loading.value = true
  try {
    const { data } = await blogCommentService.getAll({
      page:  page.value,
      limit: ITEMS_PER_PAGE,
      ...(activeStatus.value ? { status: activeStatus.value } : {}),
      ...(dSearch.value       ? { search: dSearch.value }      : {}),
    })
    comments.value     = data?.items        ?? []
    total.value        = data?.total        ?? 0
    pendingCount.value = data?.pendingCount ?? 0
    logger.info('BlogComments: fetched', { total: total.value, pending: pendingCount.value }, 'BlogCommentsView')
  } catch (err) {
    logger.error('BlogComments: fetch failed', err, {}, 'BlogCommentsView')
    ui.addToast('خطا در بارگذاری نظرات', 'error')
  } finally {
    loading.value = false
  }
}

async function approve(comment) {
  actionLoading.value = comment._id
  try {
    await blogCommentService.approve(comment._id)
    comment.isApproved = true
    if (pendingCount.value > 0) pendingCount.value--
    logger.info('BlogComments: approved', { id: comment._id }, 'BlogCommentsView')
    ui.addToast('نظر تأیید شد', 'success')
  } catch (err) {
    logger.error('BlogComments: approve failed', err, { id: comment._id }, 'BlogCommentsView')
    ui.addToast('خطا در تأیید نظر', 'error')
  } finally {
    actionLoading.value = null
  }
}

function confirmDelete(comment) {
  deleteDialog.value = { open: true, comment, loading: false }
}

async function doDelete() {
  const comment = deleteDialog.value.comment
  deleteDialog.value.loading = true
  try {
    await blogCommentService.remove(comment._id)
    comments.value = comments.value.filter(c => c._id !== comment._id)
    total.value--
    if (!comment.isApproved && pendingCount.value > 0) pendingCount.value--
    logger.info('BlogComments: deleted', { id: comment._id }, 'BlogCommentsView')
    ui.addToast('نظر حذف شد', 'success')
    deleteDialog.value.open = false
  } catch (err) {
    logger.error('BlogComments: delete failed', err, { id: comment._id }, 'BlogCommentsView')
    ui.addToast('خطا در حذف نظر', 'error')
  } finally {
    deleteDialog.value.loading = false
  }
}

onMounted(fetchComments)
</script>
