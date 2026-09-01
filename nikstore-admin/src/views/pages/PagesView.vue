<template>
  <div class="space-y-5">

    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="page-title">صفحات</h1>
        <p class="text-text-secondary text-sm mt-0.5">صفحات ثابت سایت مثل درباره ما، تماس و...</p>
      </div>
      <RouterLink :to="{ name: 'page-create' }">
        <AdminButton>+ صفحه جدید</AdminButton>
      </RouterLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <AdminSkeleton v-for="i in 4" :key="i" height="64px" class="rounded-xl" />
    </div>

    <!-- Empty -->
    <div v-else-if="!pages.length"
         class="admin-card py-16 text-center text-text-disabled">
      <p class="text-4xl mb-3">📄</p>
      <p class="font-medium">هنوز صفحه‌ای ساخته نشده</p>
      <RouterLink :to="{ name: 'page-create' }" class="text-primary text-sm mt-2 inline-block hover:underline">
        اولین صفحه را بسازید
      </RouterLink>
    </div>

    <!-- List -->
    <div v-else class="space-y-2">
      <div
        v-for="item in pagedPages"
        :key="item._id"
        class="admin-card flex items-center gap-4 hover:border-primary/40 transition-colors"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-semibold text-text-primary truncate">{{ item.title }}</span>
            <span
              :class="[
                'text-xs px-2 py-0.5 rounded-full font-medium',
                item.status === 'published'
                  ? 'bg-green-100 text-green-700 dark:bg-green-400/20 dark:text-green-400'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-400/20 dark:text-yellow-400',
              ]"
            >{{ item.status === 'published' ? 'منتشر شده' : 'پیش‌نویس' }}</span>
          </div>
          <p class="text-text-secondary text-xs mt-0.5 font-mono dir-ltr">/pages/{{ item.slug }}</p>
          <p v-if="item.excerpt" class="text-text-disabled text-xs mt-0.5 truncate">{{ item.excerpt }}</p>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <a
            :href="`${frontUrl}/pages/${item.slug}`"
            target="_blank"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-surface transition-colors text-sm"
            title="مشاهده در سایت"
          >🔗</a>
          <RouterLink :to="{ name: 'page-edit', params: { id: item._id } }">
            <button class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-surface transition-colors text-sm">
              ✏️
            </button>
          </RouterLink>
          <button
            @click="confirmDelete(item)"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-error hover:bg-error/10 transition-colors text-sm"
          >🗑️</button>
        </div>
      </div>
      <AdminPagination v-model="page" :total-pages="totalPages" :loading="loading" />
    </div>

    <!-- Delete confirm modal -->
    <Transition name="fade">
      <div v-if="deleteTarget"
           class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
           @click.self="deleteTarget = null">
        <div class="admin-card max-w-sm w-full space-y-4">
          <h3 class="font-bold text-text-primary">حذف صفحه</h3>
          <p class="text-text-secondary text-sm">
            آیا از حذف صفحه <strong>«{{ deleteTarget.title }}»</strong> مطمئنید؟
            این عمل قابل بازگشت نیست.
          </p>
          <div class="flex gap-2 justify-end">
            <AdminButton variant="ghost" @click="deleteTarget = null">انصراف</AdminButton>
            <AdminButton variant="danger" :loading="deleting" @click="doDelete">حذف</AdminButton>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { pageService }    from '@/services/page.service'
import { useUiStore }     from '@/stores/ui.store'
import AdminButton     from '@/components/common/AdminButton.vue'
import AdminSkeleton   from '@/components/common/AdminSkeleton.vue'
import AdminPagination from '@/components/common/AdminPagination.vue'

const ui = useUiStore()
const frontUrl = import.meta.env.VITE_FRONT_URL ?? 'http://localhost:5173'

const PER_PAGE     = 10
const pages        = ref([])
const loading      = ref(true)
const deleteTarget = ref(null)
const deleting     = ref(false)
const page         = ref(1)

const totalPages  = computed(() => Math.ceil(pages.value.length / PER_PAGE))
const pagedPages  = computed(() =>
  pages.value.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE)
)

async function load() {
  loading.value = true
  try {
    const { data } = await pageService.getAll()
    pages.value = data
  } catch {
    ui.addToast('خطا در بارگذاری صفحات', 'error')
  } finally {
    loading.value = false
  }
}

function confirmDelete(page) {
  deleteTarget.value = page
}

async function doDelete() {
  deleting.value = true
  try {
    await pageService.remove(deleteTarget.value._id)
    pages.value = pages.value.filter(p => p._id !== deleteTarget.value._id)
    ui.addToast('صفحه حذف شد', 'success')
    deleteTarget.value = null
  } catch {
    ui.addToast('خطا در حذف صفحه', 'error')
  } finally {
    deleting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.dir-ltr { direction: ltr; unicode-bidi: embed; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
