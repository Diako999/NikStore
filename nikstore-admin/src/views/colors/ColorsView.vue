<template>
  <div class="colors">
    <div class="colors__head">
      <h1 class="colors__title">رنگ‌ها</h1>
      <AdminButton icon="plus" @click="openCreate">رنگ جدید</AdminButton>
    </div>

    <AdminCard flush>
      <AdminTable :columns="columns" :rows="colors" :loading="loading">
        <template #cell-name="{ row }">
          <div class="colors__name-cell">
            <span class="colors__swatch" :style="{ background: row.hex }" />
            <span>{{ row.name }}</span>
            <span class="colors__hex">{{ row.hex }}</span>
          </div>
        </template>
        <template #cell-isActive="{ value }">
          <AdminBadge :variant="value ? 'success' : 'neutral'">{{ value ? 'فعال' : 'غیرفعال' }}</AdminBadge>
        </template>
        <template #cell-actions="{ row }">
          <div class="colors__row-actions">
            <AdminButton variant="ghost" size="sm" icon="edit" @click="openEdit(row)">ویرایش</AdminButton>
            <AdminButton variant="ghost" size="sm" icon="trash" @click="confirmDelete(row)">حذف</AdminButton>
          </div>
        </template>
        <template #empty>هنوز رنگی ثبت نشده است</template>
      </AdminTable>
    </AdminCard>

    <AdminModal v-model="modalOpen" :title="editing ? 'ویرایش رنگ' : 'رنگ جدید'" width="380px">
      <form class="colors__form" @submit.prevent="submit">
        <AdminInput v-model="form.name" label="نام" />
        <div class="colors__hex-field">
          <AdminInput v-model="form.hex" label="کد رنگ" placeholder="#RRGGBB" />
          <input v-model="form.hex" type="color" class="colors__picker">
        </div>
        <label class="colors__checkbox">
          <input v-model="form.isActive" type="checkbox">
          فعال
        </label>
        <div class="colors__form-actions">
          <AdminButton type="submit" :loading="saving">{{ editing ? 'ذخیره' : 'ایجاد' }}</AdminButton>
          <AdminButton variant="secondary" type="button" @click="modalOpen = false">انصراف</AdminButton>
        </div>
      </form>
    </AdminModal>

    <AdminConfirm
      v-model="confirmOpen"
      title="حذف رنگ"
      :message="`آیا از حذف «${toDelete?.name ?? ''}» مطمئن هستید؟`"
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
import AdminBadge from '../../components/common/AdminBadge.vue'
import AdminModal from '../../components/common/AdminModal.vue'
import AdminInput from '../../components/common/AdminInput.vue'
import AdminConfirm from '../../components/common/AdminConfirm.vue'
import { colorService } from '../../services/color.service'

const columns = [
  { key: 'name', label: 'رنگ' },
  { key: 'isActive', label: 'وضعیت' },
  { key: 'actions', label: '', width: '180px', align: 'end' },
]

const colors = ref([])
const loading = ref(true)

const modalOpen = ref(false)
const editing = ref(null)
const saving = ref(false)
const form = ref(emptyForm())

const confirmOpen = ref(false)
const deleting = ref(false)
const toDelete = ref(null)

function emptyForm() {
  return { name: '', hex: '#3D8B52', isActive: true }
}

async function fetchColors() {
  loading.value = true
  try {
    const { data } = await colorService.list()
    colors.value = data ?? []
  } catch {
    colors.value = []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.value = emptyForm()
  modalOpen.value = true
}

function openEdit(row) {
  editing.value = row
  form.value = { name: row.name, hex: row.hex, isActive: row.isActive !== false }
  modalOpen.value = true
}

async function submit() {
  saving.value = true
  try {
    if (editing.value) await colorService.update(editing.value._id, form.value)
    else await colorService.create(form.value)
    modalOpen.value = false
    await fetchColors()
  } finally {
    saving.value = false
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
    await colorService.remove(toDelete.value._id)
    confirmOpen.value = false
    await fetchColors()
  } finally {
    deleting.value = false
    toDelete.value = null
  }
}

onMounted(fetchColors)
</script>

<style scoped>
.colors { display: flex; flex-direction: column; gap: 20px; }
.colors__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.colors__title { font-size: 20px; font-weight: 700; color: var(--text-primary); }
.colors__name-cell { display: flex; align-items: center; gap: 10px; font-weight: 600; color: var(--text-primary); }
.colors__swatch { width: 20px; height: 20px; border-radius: 50%; border: 1px solid var(--glass-border); flex-shrink: 0; }
.colors__hex { font-size: 11.5px; color: var(--text-secondary); direction: ltr; }
.colors__row-actions { display: flex; justify-content: flex-end; gap: 4px; }
.colors__form { display: flex; flex-direction: column; gap: 14px; }
.colors__hex-field { display: flex; align-items: flex-end; gap: 10px; }
.colors__hex-field :deep(.admin-field) { flex: 1; }
.colors__picker { width: 40px; height: 40px; border-radius: 10px; border: 1px solid var(--glass-border); padding: 2px; background: transparent; cursor: pointer; }
.colors__checkbox { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-primary); }
.colors__form-actions { display: flex; gap: 10px; margin-top: 6px; }
</style>
