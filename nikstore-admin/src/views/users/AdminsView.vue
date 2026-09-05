<template>
  <div class="admins-view">
    <div class="admins-view__head">
      <div>
        <h1 class="admins-view__title">مدیران و کارشناسان</h1>
        <p class="admins-view__subtitle">حساب‌های دارای دسترسی پنل مدیریت</p>
      </div>
      <RouterLink :to="{ name: 'users' }">
        <AdminButton variant="secondary" icon="users" size="sm">لیست کاربران</AdminButton>
      </RouterLink>
    </div>

    <AdminCard flush>
      <AdminTable :columns="columns" :rows="rows" :loading="loading">
        <template #cell-fullName="{ row }">
          <div class="admins-view__name-cell">
            <span class="admins-view__name">{{ row.fullName || 'بدون نام' }}</span>
            <span class="admins-view__phone">{{ row.phone }}</span>
          </div>
        </template>
        <template #cell-role="{ row }">
          <AdminSelect
            v-if="auth.isSuperAdmin"
            :model-value="row.role"
            :options="roleOptions"
            class="admins-view__role-select"
            @update:model-value="(val) => askRoleChange(row, val)"
          />
          <AdminBadge v-else :variant="row.role === 'admin' ? 'success' : 'pending'">
            {{ roleLabel(row.role) }}
          </AdminBadge>
        </template>
        <template #cell-isActive="{ value }">
          <AdminBadge :variant="value ? 'success' : 'danger'">
            {{ value ? 'فعال' : 'غیرفعال' }}
          </AdminBadge>
        </template>
        <template #cell-createdAt="{ value }">
          {{ formatDate(value) }}
        </template>
        <template #cell-actions="{ row }">
          <AdminButton
            v-if="auth.isSuperAdmin"
            variant="ghost"
            size="sm"
            @click="openPermissions(row)"
          >
            دسترسی‌ها
          </AdminButton>
        </template>
        <template #empty>هیچ مدیر یا کارشناسی ثبت نشده است</template>
      </AdminTable>
    </AdminCard>

    <AdminConfirm
      v-model="confirmOpen"
      title="تغییر نقش کاربر"
      :message="confirmMessage"
      confirm-text="تغییر نقش"
      :loading="changingRole"
      @confirm="applyRoleChange"
      @cancel="pendingRole = null"
    />

    <AdminModal v-model="permissionsOpen" title="مدیریت دسترسی‌ها" width="440px">
      <p class="admins-view__perm-hint">
        دسترسی‌های اختصاصی برای {{ permissionsTarget?.fullName || permissionsTarget?.phone }}
      </p>
      <div class="admins-view__perm-list">
        <span v-for="(perm, index) in permissionsDraft" :key="perm" class="admins-view__perm-chip">
          {{ perm }}
          <button type="button" @click="permissionsDraft.splice(index, 1)">
            <AppIcon name="close" :size="12" />
          </button>
        </span>
        <span v-if="!permissionsDraft.length" class="admins-view__perm-empty">
          دسترسی خاصی تعریف نشده است
        </span>
      </div>
      <div class="admins-view__perm-add">
        <AdminInput v-model="newPermission" placeholder="نام دسترسی جدید" @keyup.enter="addPermission" />
        <AdminButton variant="secondary" size="sm" icon="plus" @click="addPermission">افزودن</AdminButton>
      </div>
      <template #footer>
        <AdminButton variant="secondary" size="sm" @click="permissionsOpen = false">انصراف</AdminButton>
        <AdminButton variant="primary" size="sm" :loading="savingPermissions" @click="savePermissions">
          ذخیره
        </AdminButton>
      </template>
    </AdminModal>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AdminCard from '../../components/common/AdminCard.vue'
import AdminTable from '../../components/common/AdminTable.vue'
import AdminBadge from '../../components/common/AdminBadge.vue'
import AdminButton from '../../components/common/AdminButton.vue'
import AdminSelect from '../../components/common/AdminSelect.vue'
import AdminInput from '../../components/common/AdminInput.vue'
import AdminModal from '../../components/common/AdminModal.vue'
import AdminConfirm from '../../components/common/AdminConfirm.vue'
import AppIcon from '../../components/icons/AppIcon.vue'
import { adminService } from '../../services/admin.service'
import { useAuthStore } from '../../stores/auth.store'

const auth = useAuthStore()

const admins = ref([])
const loading = ref(true)

const columns = [
  { key: 'fullName', label: 'کاربر' },
  { key: 'role', label: 'نقش', width: '180px' },
  { key: 'isActive', label: 'وضعیت' },
  { key: 'createdAt', label: 'تاریخ افزودن' },
  { key: 'actions', label: '', align: 'end' },
]

const roleOptions = [
  { label: 'کاربر عادی', value: 'user' },
  { label: 'کارشناس', value: 'manager' },
  { label: 'مدیر کل', value: 'admin' },
]

function roleLabel(role) {
  return { user: 'کاربر عادی', manager: 'کارشناس', admin: 'مدیر کل' }[role] || role
}

const rows = computed(() =>
  admins.value.map((u) => ({
    ...u,
    fullName: [u.firstName, u.lastName].filter(Boolean).join(' '),
  })),
)

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('fa-IR')
}

async function loadAdmins() {
  loading.value = true
  try {
    const { data } = await adminService.getAdminUsers()
    admins.value = data ?? []
  } catch {
    admins.value = []
  } finally {
    loading.value = false
  }
}

// ── Role change ─────────────────────────────────────────────────
const confirmOpen = ref(false)
const changingRole = ref(false)
const pendingRole = ref(null)
const pendingUser = ref(null)

const confirmMessage = computed(() => {
  if (!pendingUser.value || !pendingRole.value) return ''
  const name = pendingUser.value.fullName || pendingUser.value.phone
  return `نقش "${name}" به «${roleLabel(pendingRole.value)}» تغییر کند؟`
})

function askRoleChange(row, newRole) {
  if (newRole === row.role) return
  pendingUser.value = row
  pendingRole.value = newRole
  confirmOpen.value = true
}

async function applyRoleChange() {
  if (!pendingUser.value || !pendingRole.value) return
  changingRole.value = true
  try {
    await adminService.setUserRole(pendingUser.value._id, pendingRole.value)
    confirmOpen.value = false
    pendingRole.value = null
    await loadAdmins()
  } finally {
    changingRole.value = false
  }
}

// ── Permissions ──────────────────────────────────────────────────
const permissionsOpen = ref(false)
const permissionsTarget = ref(null)
const permissionsDraft = ref([])
const newPermission = ref('')
const savingPermissions = ref(false)

function openPermissions(row) {
  permissionsTarget.value = row
  permissionsDraft.value = [...(row.permissions ?? [])]
  newPermission.value = ''
  permissionsOpen.value = true
}

function addPermission() {
  const value = newPermission.value.trim()
  if (value && !permissionsDraft.value.includes(value)) {
    permissionsDraft.value.push(value)
  }
  newPermission.value = ''
}

async function savePermissions() {
  if (!permissionsTarget.value) return
  savingPermissions.value = true
  try {
    await adminService.setUserPermissions(permissionsTarget.value._id, permissionsDraft.value)
    permissionsOpen.value = false
    await loadAdmins()
  } finally {
    savingPermissions.value = false
  }
}

onMounted(loadAdmins)
</script>

<style scoped>
.admins-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.admins-view__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.admins-view__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.admins-view__subtitle {
  margin-top: 4px;
  font-size: 12.5px;
  color: var(--text-secondary);
}

.admins-view__name-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.admins-view__name {
  font-weight: 600;
  color: var(--text-primary);
}
.admins-view__phone {
  font-size: 11.5px;
  color: var(--text-secondary);
  direction: ltr;
  text-align: end;
}

.admins-view__role-select {
  min-width: 150px;
}

.admins-view__perm-hint {
  font-size: 12.5px;
  color: var(--text-secondary);
  margin-bottom: 14px;
}

.admins-view__perm-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 32px;
  margin-bottom: 16px;
}
.admins-view__perm-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 999px;
  color: var(--text-primary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
}
.admins-view__perm-chip button {
  display: flex;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}
.admins-view__perm-chip button:hover {
  color: #D9534F;
}
.admins-view__perm-empty {
  font-size: 12px;
  color: var(--text-disabled);
}

.admins-view__perm-add {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
.admins-view__perm-add > :first-child {
  flex: 1;
}
</style>
