<template>
  <div class="pages">
    <div class="pages__head">
      <h1 class="pages__title">صفحات ثابت</h1>
      <router-link to="/pages/create">
        <AdminButton icon="plus">صفحه جدید</AdminButton>
      </router-link>
    </div>

    <AdminCard>
      <AdminInput v-model="search" placeholder="جستجو در عنوان یا اسلاگ..." icon="search" />
    </AdminCard>

    <AdminCard flush>
      <AdminTable :columns="columns" :rows="filteredPages" :loading="loading">
        <template #cell-title="{ row }">
          <div class="pages__title-cell">
            <span class="pages__title-text">{{ row.title }}</span>
            <span class="pages__slug">/{{ row.slug }}</span>
          </div>
        </template>
        <template #cell-status="{ value }">
          <AdminBadge :variant="value === 'published' ? 'success' : 'pending'">
            {{ value === 'published' ? 'منتشرشده' : 'پیش‌نویس' }}
          </AdminBadge>
        </template>
        <template #cell-actions="{ row }">
          <div class="pages__row-actions">
            <router-link :to="`/pages/${row._id}/edit`">
              <AdminButton variant="ghost" size="sm" icon="edit">ویرایش</AdminButton>
            </router-link>
            <AdminButton variant="ghost" size="sm" icon="trash" @click="confirmDelete(row)">
              حذف
            </AdminButton>
          </div>
        </template>
        <template #empty>هنوز صفحه‌ای ثبت نشده است</template>
      </AdminTable>
    </AdminCard>

    <AdminConfirm
      v-model="confirmOpen"
      title="حذف صفحه"
      :message="`آیا از حذف «${toDelete?.title ?? ''}» مطمئن هستید؟`"
      danger
      :loading="deleting"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AdminCard from '../../components/common/AdminCard.vue'
import AdminTable from '../../components/common/AdminTable.vue'
import AdminButton from '../../components/common/AdminButton.vue'
import AdminInput from '../../components/common/AdminInput.vue'
import AdminBadge from '../../components/common/AdminBadge.vue'
import AdminConfirm from '../../components/common/AdminConfirm.vue'
import { pageService } from '../../services/page.service'

const columns = [
  { key: 'title', label: 'عنوان' },
  { key: 'status', label: 'وضعیت' },
  { key: 'order', label: 'ترتیب', align: 'center', width: '90px' },
  { key: 'actions', label: '', width: '180px', align: 'end' },
]

const pages = ref([])
const loading = ref(true)
const search = ref('')

const confirmOpen = ref(false)
const deleting = ref(false)
const toDelete = ref(null)

const filteredPages = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return pages.value
  return pages.value.filter(
    (p) => p.title?.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q),
  )
})

async function fetchPages() {
  loading.value = true
  try {
    const { data } = await pageService.getAdminList()
    pages.value = data ?? []
  } catch {
    pages.value = []
  } finally {
    loading.value = false
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
    await pageService.remove(toDelete.value._id)
    confirmOpen.value = false
    await fetchPages()
  } finally {
    deleting.value = false
    toDelete.value = null
  }
}

onMounted(fetchPages)
</script>

<style scoped>
.pages {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.pages__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.pages__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}
.pages__title-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.pages__title-text {
  font-weight: 600;
  color: var(--text-primary);
}
.pages__slug {
  font-size: 11.5px;
  color: var(--text-secondary);
  direction: ltr;
  text-align: start;
}
.pages__row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}
</style>
