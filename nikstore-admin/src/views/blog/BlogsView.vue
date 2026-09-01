<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="page-title">مدیریت بلاگ</h1>
        <p class="text-text-secondary text-sm mt-0.5">{{ total }} پست ثبت شده</p>
      </div>
      <RouterLink :to="{ name: 'blog-create' }">
        <AdminButton>+ پست جدید</AdminButton>
      </RouterLink>
    </div>

    <!-- Filters -->
    <div class="admin-card mb-5 flex flex-wrap items-center gap-3">
      <div class="flex-1 min-w-48 relative">
        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled text-sm">🔍</span>
        <input
          v-model="filters.search"
          @input="onSearch"
          type="text"
          placeholder="جستجو در عنوان، تگ..."
          class="field-input pr-9 w-full"
        />
      </div>

      <select v-model="filters.status" @change="fetchPosts" class="field-input min-w-36">
        <option value="">همه وضعیت‌ها</option>
        <option value="published">منتشر شده</option>
        <option value="draft">پیش‌نویس</option>
        <option value="archived">آرشیو</option>
      </select>

      <select v-model="filters.sortBy" @change="fetchPosts" class="field-input min-w-36">
        <option value="newest">جدیدترین</option>
        <option value="oldest">قدیمی‌ترین</option>
        <option value="popular">محبوب‌ترین</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <AdminSkeleton v-for="i in 5" :key="i" height="76px" class="rounded-xl" />
    </div>

    <!-- Empty -->
    <div v-else-if="!posts.length"
         class="admin-card flex flex-col items-center py-16 gap-4">
      <div class="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center text-3xl">📝</div>
      <p class="text-text-secondary">
        {{ filters.search || filters.status ? 'پستی با این فیلترها یافت نشد.' : 'هنوز پستی منتشر نشده.' }}
      </p>
      <RouterLink :to="{ name: 'blog-create' }">
        <AdminButton>اولین پست را بنویسید</AdminButton>
      </RouterLink>
    </div>

    <!-- Post list -->
    <div v-else class="space-y-3">
      <div
        v-for="post in posts"
        :key="post._id"
        class="admin-card flex items-start gap-4 hover:shadow-md transition-shadow"
      >
        <!-- Featured image -->
        <div class="w-24 h-16 rounded-xl overflow-hidden bg-surface flex-shrink-0">
          <img
            v-if="post.featuredImage"
            :src="post.featuredImage"
            :alt="post.title"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-2xl text-text-disabled">📝</div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <RouterLink
              :to="{ name: 'blog-edit', params: { id: post._id } }"
              class="font-semibold text-text-primary text-sm hover:text-primary transition-colors truncate"
            >
              {{ post.title }}
            </RouterLink>
            <AdminBadge :variant="statusMeta(post.status).color" size="sm">
              {{ statusMeta(post.status).label }}
            </AdminBadge>
          </div>

          <p v-if="post.excerpt" class="text-text-secondary text-xs mt-1 line-clamp-1">
            {{ post.excerpt }}
          </p>

          <div class="flex items-center gap-3 mt-1.5 text-xs text-text-disabled flex-wrap">
            <span v-if="post.author">
              ✍️ {{ post.author.firstName || '' }} {{ post.author.lastName || post.author.phone || '' }}
            </span>
            <span>📅 {{ formatDate(post.createdAt) }}</span>
            <span v-if="post.status === 'published'">👁 {{ post.viewCount ?? 0 }} بازدید</span>
            <div v-if="post.tags?.length" class="flex items-center gap-1 flex-wrap">
              <span
                v-for="tag in post.tags.slice(0, 3)"
                :key="tag"
                class="bg-surface px-1.5 py-0.5 rounded text-xs"
              >
                #{{ tag }}
              </span>
              <span v-if="post.tags.length > 3" class="text-text-disabled">
                +{{ post.tags.length - 3 }}
              </span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1 flex-shrink-0">
          <RouterLink :to="{ name: 'blog-edit', params: { id: post._id } }">
            <button
              class="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-text-secondary hover:bg-surface hover:text-primary transition-colors"
              title="ویرایش"
            >✏️</button>
          </RouterLink>
          <a
            v-if="post.status === 'published'"
            :href="`${siteUrl}/blog/${post.slug}`"
            target="_blank"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-text-secondary hover:bg-surface hover:text-info transition-colors"
            title="مشاهده در سایت"
          >🔗</a>
          <button
            @click="confirmDelete(post)"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-text-secondary hover:bg-error/10 hover:text-error transition-colors"
            title="حذف"
          >🗑</button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-5">
      <AdminPagination v-model="page" :total-pages="totalPages" @update:model-value="fetchPosts" />
    </div>

    <!-- Delete confirm -->
    <AdminConfirm
      v-model="deleteDialogOpen"
      title="حذف پست"
      :message="`پست «${deletingPost?.title}» حذف شود؟`"
      confirm-label="بله، حذف شود"
      :loading="deleting"
      @confirm="doDelete"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { blogService }  from '@/services/blog.service'
import { useUiStore }   from '@/stores/ui.store'
import AdminButton     from '@/components/common/AdminButton.vue'
import AdminBadge      from '@/components/common/AdminBadge.vue'
import AdminSkeleton   from '@/components/common/AdminSkeleton.vue'
import AdminConfirm    from '@/components/common/AdminConfirm.vue'
import AdminPagination from '@/components/common/AdminPagination.vue'

const siteUrl = import.meta.env.VITE_SITE_URL || 'http://localhost:3000'

const ui = useUiStore()

const posts     = ref([])
const loading   = ref(false)
const total     = ref(0)
const page      = ref(1)
const totalPages = ref(1)

const filters = reactive({
  search: '',
  status: '',
  sortBy: 'newest',
})

const deleteDialogOpen = ref(false)
const deletingPost     = ref(null)
const deleting         = ref(false)

const STATUS_META = {
  published: { label: 'منتشر شده', color: 'success' },
  draft:     { label: 'پیش‌نویس',  color: 'warning' },
  archived:  { label: 'آرشیو',     color: 'gray'    },
}
function statusMeta(s) { return STATUS_META[s] ?? { label: s, color: 'gray' } }

function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(iso))
}

async function fetchPosts() {
  loading.value = true
  try {
    const { data } = await blogService.getAll({
      page:   page.value,
      limit:  15,
      search: filters.search || undefined,
      status: filters.status || undefined,
      sortBy: filters.sortBy,
    })
    posts.value      = data.posts ?? []
    total.value      = data.total ?? 0
    totalPages.value = data.totalPages ?? 1
  } catch {
    ui.addToast('خطا در بارگذاری پست‌ها', 'error')
  } finally {
    loading.value = false
  }
}

const onSearch = useDebounceFn(() => {
  page.value = 1
  fetchPosts()
}, 350)

function confirmDelete(post) {
  deletingPost.value   = post
  deleteDialogOpen.value = true
}

async function doDelete() {
  if (!deletingPost.value) return
  deleting.value = true
  try {
    await blogService.remove(deletingPost.value._id)
    posts.value       = posts.value.filter(p => p._id !== deletingPost.value._id)
    total.value       = Math.max(0, total.value - 1)
    deleteDialogOpen.value = false
    ui.addToast('پست حذف شد', 'success')
  } catch {
    ui.addToast('خطا در حذف پست', 'error')
  } finally {
    deleting.value = false
  }
}

onMounted(fetchPosts)
</script>
