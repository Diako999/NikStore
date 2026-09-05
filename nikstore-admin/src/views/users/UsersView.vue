<template>
  <div class="users-view">
    <div class="users-view__head">
      <div>
        <h1 class="users-view__title">کاربران</h1>
        <p class="users-view__subtitle">مدیریت مشتریان فروشگاه</p>
      </div>
      <RouterLink :to="{ name: 'admins' }" class="users-view__admins-link">
        <AdminButton variant="secondary" icon="shield" size="sm">مدیران و کارشناسان</AdminButton>
      </RouterLink>
    </div>

    <AdminCard flush>
      <div class="users-view__toolbar">
        <AdminInput
          v-model="search"
          placeholder="جستجو بر اساس نام یا موبایل..."
          icon="search"
          class="users-view__search"
        />
        <AdminSelect
          v-model="statusFilter"
          :options="statusOptions"
          class="users-view__status-filter"
        />
      </div>

      <AdminTable :columns="columns" :rows="rows" :loading="loading">
        <template #cell-fullName="{ row }">
          <div class="users-view__name-cell">
            <span class="users-view__name">{{ row.fullName || 'بدون نام' }}</span>
            <span class="users-view__phone">{{ row.phone }}</span>
          </div>
        </template>
        <template #cell-createdAt="{ value }">
          {{ formatDate(value) }}
        </template>
        <template #cell-isBlocked="{ value }">
          <AdminBadge :variant="value ? 'danger' : 'success'">
            {{ value ? 'مسدود' : 'فعال' }}
          </AdminBadge>
        </template>
        <template #cell-actions="{ row }">
          <div class="users-view__row-actions">
            <RouterLink :to="{ name: 'user-detail', params: { id: row._id } }">
              <AdminButton variant="ghost" size="sm">مشاهده</AdminButton>
            </RouterLink>
            <AdminButton
              variant="ghost"
              size="sm"
              @click="askToggleBlock(row)"
            >
              {{ row.isBlocked ? 'رفع مسدودی' : 'مسدودسازی' }}
            </AdminButton>
          </div>
        </template>
        <template #empty>کاربری یافت نشد</template>
      </AdminTable>

      <AdminPagination v-model:page="page" :page-size="limit" :total="total" />
    </AdminCard>

    <AdminConfirm
      v-model="confirmOpen"
      :title="pendingUser?.isBlocked ? 'رفع مسدودی کاربر' : 'مسدودسازی کاربر'"
      :message="confirmMessage"
      :confirm-text="pendingUser?.isBlocked ? 'رفع مسدودی' : 'مسدودسازی'"
      :danger="!pendingUser?.isBlocked"
      :loading="toggling"
      @confirm="confirmToggleBlock"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AdminCard from '../../components/common/AdminCard.vue'
import AdminTable from '../../components/common/AdminTable.vue'
import AdminInput from '../../components/common/AdminInput.vue'
import AdminSelect from '../../components/common/AdminSelect.vue'
import AdminBadge from '../../components/common/AdminBadge.vue'
import AdminButton from '../../components/common/AdminButton.vue'
import AdminPagination from '../../components/common/AdminPagination.vue'
import AdminConfirm from '../../components/common/AdminConfirm.vue'
import { userService } from '../../services/user.service'

const columns = [
  { key: 'fullName', label: 'کاربر' },
  { key: 'createdAt', label: 'تاریخ عضویت' },
  { key: 'isBlocked', label: 'وضعیت' },
  { key: 'actions', label: '', width: '200px', align: 'end' },
]

const statusOptions = [
  { label: 'همه کاربران', value: '' },
  { label: 'فعال', value: 'false' },
  { label: 'مسدود', value: 'true' },
]

const users = ref([])
const total = ref(0)
const page = ref(1)
const limit = 20
const loading = ref(true)
const search = ref('')
const statusFilter = ref('')

const confirmOpen = ref(false)
const pendingUser = ref(null)
const toggling = ref(false)

const rows = computed(() =>
  users.value.map((u) => ({
    ...u,
    fullName: [u.firstName, u.lastName].filter(Boolean).join(' '),
  })),
)

const confirmMessage = computed(() => {
  if (!pendingUser.value) return ''
  const name = pendingUser.value.fullName || pendingUser.value.phone
  return pendingUser.value.isBlocked
    ? `آیا مسدودیت "${name}" برداشته شود؟`
    : `آیا "${name}" مسدود شود؟ این کاربر دیگر نمی‌تواند وارد حساب خود شود.`
})

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('fa-IR')
}

async function loadUsers() {
  loading.value = true
  try {
    const { data } = await userService.getUsers({
      page: page.value,
      limit,
      search: search.value || undefined,
      isBlocked: statusFilter.value || undefined,
    })
    users.value = data?.items ?? []
    total.value = data?.total ?? 0
  } catch {
    users.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function askToggleBlock(row) {
  pendingUser.value = row
  confirmOpen.value = true
}

async function confirmToggleBlock() {
  if (!pendingUser.value) return
  toggling.value = true
  try {
    await userService.toggleUserBlock(pendingUser.value._id)
    confirmOpen.value = false
    await loadUsers()
  } finally {
    toggling.value = false
  }
}

let searchDebounce
watch(search, () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    page.value = 1
    loadUsers()
  }, 350)
})

watch(statusFilter, () => {
  page.value = 1
  loadUsers()
})

watch(page, loadUsers)

onMounted(loadUsers)
</script>

<style scoped>
.users-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.users-view__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.users-view__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.users-view__subtitle {
  margin-top: 4px;
  font-size: 12.5px;
  color: var(--text-secondary);
}

.users-view__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--glass-border);
  flex-wrap: wrap;
}

.users-view__search {
  flex: 1;
  min-width: 220px;
}

.users-view__status-filter {
  min-width: 160px;
}

.users-view__name-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.users-view__name {
  font-weight: 600;
  color: var(--text-primary);
}

.users-view__phone {
  font-size: 11.5px;
  color: var(--text-secondary);
  direction: ltr;
  text-align: end;
}

.users-view__row-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}
</style>
