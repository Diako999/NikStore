<template>
  <div class="space-y-4">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="page-title">کاربران</h1>
        <p v-if="!loading" class="text-text-secondary text-sm mt-0.5 font-fanum">
          {{ formatNumber(total) }} کاربر
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="admin-card">
      <div class="flex flex-wrap gap-3 items-end">
        <AdminInput
          v-model="search"
          placeholder="جستجو با نام یا شماره موبایل..."
          prepend="🔍"
          class="flex-1 min-w-[220px]" />
        <AdminSelect
          v-model="roleFilter"
          :options="roleOptions"
          placeholder="همه نقش‌ها"
          class="w-44" />
        <AdminSelect
          v-model="blockedFilter"
          :options="blockedOptions"
          placeholder="همه وضعیت‌ها"
          class="w-44" />
        <AdminButton v-if="search || roleFilter || blockedFilter"
          variant="ghost" @click="resetFilters">
          پاک کردن
        </AdminButton>
      </div>
    </div>

    <!-- Table -->
    <div class="admin-card p-0 overflow-hidden">
      <AdminTable
        :columns="columns"
        :rows="users"
        :loading="loading"
        :skeleton-rows="10"
        empty-text="کاربری یافت نشد">

        <!-- Avatar + Name -->
        <template #cell-name="{ row }">
          <RouterLink
            :to="{ name: 'user-detail', params: { id: row._id } }"
            class="flex items-center gap-3 group">
            <div :class="[
              'w-9 h-9 rounded-full flex items-center justify-center',
              'text-sm font-bold flex-shrink-0 transition-transform group-hover:scale-110',
              row.isBlocked ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                            : row.isAdmin ? 'bg-primary/20 text-primary'
                            : row.role === 'manager' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300',
            ]">
              {{ (row.firstName?.[0] ?? row.phone?.[2] ?? '؟').toUpperCase() }}
            </div>
            <div class="min-w-0">
              <p class="font-medium text-text-primary text-sm group-hover:text-primary transition-colors truncate">
                {{ row.firstName ?? '' }} {{ row.lastName ?? '' }}
              </p>
              <p class="text-text-disabled text-xs font-fanum" dir="ltr">{{ row.phone }}</p>
            </div>
          </RouterLink>
        </template>

        <!-- Role badge -->
        <template #cell-role="{ row }">
          <span v-if="row.isAdmin"
            class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full
                   bg-primary/10 text-primary">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M9.243 3.03a1 1 0 01.514 1.326L9.143 6h2.714l.343-1.644a1 1 0 111.96.41L13.857 6H15a1 1 0 110 2h-1.543l-.75 3.6H14a1 1 0 110 2h-1.793l-.343 1.644a1 1 0 11-1.96-.41L10.143 13H7.43l-.343 1.644a1 1 0 11-1.96-.41L5.43 13H4a1 1 0 110-2h1.793l.75-3.6H5a1 1 0 110-2h1.543l.343-1.644a1 1 0 011.357-.686zM9.857 8L9.107 11.6h2.714L12.571 8H9.857z" clip-rule="evenodd"/>
            </svg>
            ادمین
          </span>
          <span v-else-if="row.role === 'manager'"
            class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full
                   bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 cursor-pointer
                   hover:bg-yellow-200 dark:hover:bg-yellow-900/60 transition-colors"
            :title="`${row.permissions?.length ?? 0} دسترسی فعال`"
            @click.prevent="openPermissions(row)">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            مدیر
            <span class="bg-yellow-200 dark:bg-yellow-800 rounded-full px-1 text-[10px]">
              {{ row.permissions?.length ?? 0 }}
            </span>
          </span>
          <span v-else class="text-[11px] text-text-disabled">کاربر عادی</span>
        </template>

        <!-- Orders count -->
        <template #cell-ordersCount="{ row }">
          <span class="font-fanum font-medium text-text-primary text-sm">
            {{ formatNumber(row.ordersCount ?? 0) }}
          </span>
        </template>

        <!-- Status -->
        <template #cell-isBlocked="{ row }">
          <AdminBadge :variant="row.isBlocked ? 'error' : 'success'" size="sm" :dot="true">
            {{ row.isBlocked ? 'مسدود' : 'فعال' }}
          </AdminBadge>
        </template>

        <!-- Join date -->
        <template #cell-createdAt="{ row }">
          <span class="text-text-secondary text-xs font-fanum">
            {{ formatDate(row.createdAt) }}
          </span>
        </template>

        <!-- Actions -->
        <template #cell-actions="{ row }">
          <div class="flex items-center justify-center gap-1">

            <!-- View -->
            <RouterLink
              :to="{ name: 'user-detail', params: { id: row._id } }"
              class="action-btn hover:bg-primary/10 hover:text-primary"
              title="مشاهده پروفایل">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </RouterLink>

            <!-- Promote to Manager (only for regular users, admin-only) -->
            <button v-if="!row.isAdmin && row.role !== 'manager' && auth.isAdmin"
              @click="promoteToManager(row)"
              title="ارتقاء به مدیر"
              class="action-btn hover:bg-yellow-50 hover:text-yellow-600 dark:hover:bg-yellow-900/30 dark:hover:text-yellow-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </button>

            <!-- Permissions (managers, admin-only) -->
            <button v-if="row.role === 'manager' && auth.isAdmin"
              @click="openPermissions(row)"
              title="مدیریت دسترسی‌ها"
              class="action-btn hover:bg-yellow-50 hover:text-yellow-600 dark:hover:bg-yellow-900/30 dark:hover:text-yellow-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
              </svg>
            </button>

            <!-- Demote to User (managers, admin-only) -->
            <button v-if="row.role === 'manager' && auth.isAdmin"
              @click="demoteToUser(row)"
              title="تبدیل به کاربر عادی"
              class="action-btn hover:bg-red-50 hover:text-error dark:hover:bg-red-900/20">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"/>
              </svg>
            </button>

            <!-- Block / Unblock -->
            <button v-if="!row.isAdmin"
              @click="toggleBlock(row)"
              :title="row.isBlocked ? 'رفع مسدودی' : 'مسدود کردن'"
              :class="[
                'action-btn transition-colors',
                row.isBlocked
                  ? 'hover:bg-green-50 hover:text-success dark:hover:bg-green-900/20'
                  : 'hover:bg-red-50 hover:text-error dark:hover:bg-red-900/20',
              ]">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path v-if="!row.isBlocked" stroke-linecap="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                <path v-else stroke-linecap="round"
                  d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
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
      @update:modelValue="fetchUsers" />

  </div>

  <!-- Permissions modal -->
  <ManagerPermissionsModal
    v-model="permissionsModal"
    :user="selectedManager"
    @saved="onPermissionsSaved" />
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { userService }  from '@/services/user.service'
import { useUiStore }   from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { useDebounce }  from '@/composables/useDebounce'
import { formatNumber, formatDate } from '@/utils/formatters'
import { ITEMS_PER_PAGE } from '@/utils/constants'

import AdminTable      from '@/components/common/AdminTable.vue'
import AdminBadge      from '@/components/common/AdminBadge.vue'
import AdminButton     from '@/components/common/AdminButton.vue'
import AdminInput      from '@/components/common/AdminInput.vue'
import AdminSelect     from '@/components/common/AdminSelect.vue'
import AdminPagination from '@/components/common/AdminPagination.vue'
import ManagerPermissionsModal from './components/ManagerPermissionsModal.vue'

const ui   = useUiStore()
const auth = useAuthStore()

// ── Permissions modal ─────────────────────────────────────────────
const permissionsModal = ref(false)
const selectedManager  = ref(null)

function openPermissions(user) {
  selectedManager.value  = user
  permissionsModal.value = true
}

function onPermissionsSaved(updatedUser) {
  patchLocalUser(updatedUser)
}

// ── Table state ───────────────────────────────────────────────────
const users         = ref([])
const loading       = ref(true)
const total         = ref(0)
const page          = ref(1)
const search        = ref('')
const roleFilter    = ref('')
const blockedFilter = ref('')

const dSearch    = useDebounce(search)
const totalPages = computed(() => Math.ceil(total.value / ITEMS_PER_PAGE))

watch(dSearch,       () => { page.value = 1; fetchUsers() })
watch(roleFilter,    () => { page.value = 1; fetchUsers() })
watch(blockedFilter, () => { page.value = 1; fetchUsers() })

const columns = [
  { key: 'name',        label: 'کاربر',       width: '220px' },
  { key: 'role',        label: 'نقش',          width: '120px', align: 'center' },
  { key: 'ordersCount', label: 'سفارشات',      width: '80px',  align: 'center' },
  { key: 'isBlocked',   label: 'وضعیت',        width: '90px',  align: 'center' },
  { key: 'createdAt',   label: 'تاریخ عضویت',  width: '110px' },
  { key: 'actions',     label: '',             width: '130px', align: 'center' },
]

const roleOptions = [
  { value: 'user',    label: 'کاربر عادی' },
  { value: 'manager', label: 'مدیر' },
]

const blockedOptions = [
  { value: 'false', label: 'فقط فعال‌ها' },
  { value: 'true',  label: 'فقط مسدودها' },
]

// ── API calls ─────────────────────────────────────────────────────
async function fetchUsers() {
  loading.value = true
  try {
    const params = {
      page: page.value, limit: ITEMS_PER_PAGE,
      ...(dSearch.value       ? { search:    dSearch.value }   : {}),
      ...(roleFilter.value    ? { role:      roleFilter.value } : {}),
      ...(blockedFilter.value ? { isBlocked: blockedFilter.value } : {}),
    }
    const { data } = await userService.getAll(params)
    users.value = data?.items ?? []
    total.value = data?.total ?? 0
  } catch {
    ui.addToast('خطا در بارگذاری کاربران', 'error')
  } finally {
    loading.value = false
  }
}

async function toggleBlock(user) {
  const prev = user.isBlocked
  user.isBlocked = !prev
  try {
    const { data } = await userService.block(user._id)
    user.isBlocked = data?.isBlocked ?? !prev
    ui.addToast(
      user.isBlocked
        ? `کاربر «${user.firstName ?? user.phone}» مسدود شد`
        : `مسدودی «${user.firstName ?? user.phone}» رفع شد`,
      user.isBlocked ? 'warning' : 'success',
    )
  } catch {
    user.isBlocked = prev
    ui.addToast('خطا در تغییر وضعیت کاربر', 'error')
  }
}

async function promoteToManager(user) {
  try {
    const { data } = await userService.setRole(user._id, 'manager')
    patchLocalUser(data)
    ui.addToast(`«${user.firstName ?? user.phone}» به مدیر ارتقاء یافت`, 'success')
    openPermissions({ ...user, ...data })
  } catch (err) {
    const msg = err.response?.data?.message
    ui.addToast(Array.isArray(msg) ? msg[0] : (msg ?? 'خطا در ارتقاء کاربر'), 'error')
  }
}

async function demoteToUser(user) {
  try {
    const { data } = await userService.setRole(user._id, 'user')
    patchLocalUser(data)
    ui.addToast(`«${user.firstName ?? user.phone}» به کاربر عادی تبدیل شد`, 'warning')
  } catch (err) {
    const msg = err.response?.data?.message
    ui.addToast(Array.isArray(msg) ? msg[0] : (msg ?? 'خطا در تغییر نقش'), 'error')
  }
}

function patchLocalUser(updated) {
  const idx = users.value.findIndex(u => u._id === updated._id)
  if (idx !== -1) users.value[idx] = { ...users.value[idx], ...updated }
}

function resetFilters() {
  search.value = ''
  roleFilter.value = ''
  blockedFilter.value = ''
}

onMounted(fetchUsers)
</script>

<style scoped>
.action-btn {
  @apply w-8 h-8 rounded-lg flex items-center justify-center
         text-text-secondary transition-colors;
}
</style>
