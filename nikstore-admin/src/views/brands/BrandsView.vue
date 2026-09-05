<template>
  <div class="brands">
    <div class="brands__head">
      <h1 class="brands__title">برندها</h1>
      <AdminButton icon="plus" @click="openCreate">برند جدید</AdminButton>
    </div>

    <AdminCard flush>
      <AdminTable :columns="columns" :rows="brands" :loading="loading">
        <template #cell-name="{ row }">
          <div class="brands__name-cell">
            <img v-if="row.logo" :src="row.logo" class="brands__logo" alt="">
            <span>{{ row.name }}</span>
          </div>
        </template>
        <template #cell-isActive="{ value }">
          <AdminBadge :variant="value ? 'success' : 'neutral'">{{ value ? 'فعال' : 'غیرفعال' }}</AdminBadge>
        </template>
        <template #cell-actions="{ row }">
          <div class="brands__row-actions">
            <AdminButton variant="ghost" size="sm" icon="edit" @click="openEdit(row)">ویرایش</AdminButton>
            <AdminButton variant="ghost" size="sm" icon="trash" @click="confirmDelete(row)">حذف</AdminButton>
          </div>
        </template>
        <template #empty>هنوز برندی ثبت نشده است</template>
      </AdminTable>
    </AdminCard>

    <AdminModal v-model="modalOpen" :title="editing ? 'ویرایش برند' : 'برند جدید'">
      <form class="brands__form" @submit.prevent="submit">
        <AdminInput v-model="form.name" label="نام" />
        <AdminInput v-model="form.logo" label="آدرس لوگو" />
        <AdminTextarea v-model="form.description" label="توضیحات" :rows="3" />
        <label class="brands__checkbox">
          <input v-model="form.isActive" type="checkbox">
          فعال
        </label>
        <div class="brands__form-actions">
          <AdminButton type="submit" :loading="saving">{{ editing ? 'ذخیره' : 'ایجاد' }}</AdminButton>
          <AdminButton variant="secondary" type="button" @click="modalOpen = false">انصراف</AdminButton>
        </div>
      </form>
    </AdminModal>

    <AdminConfirm
      v-model="confirmOpen"
      title="حذف برند"
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
import AdminTextarea from '../../components/common/AdminTextarea.vue'
import AdminConfirm from '../../components/common/AdminConfirm.vue'
import { brandService } from '../../services/brand.service'

const columns = [
  { key: 'name', label: 'نام' },
  { key: 'isActive', label: 'وضعیت' },
  { key: 'actions', label: '', width: '180px', align: 'end' },
]

const brands = ref([])
const loading = ref(true)

const modalOpen = ref(false)
const editing = ref(null)
const saving = ref(false)
const form = ref(emptyForm())

const confirmOpen = ref(false)
const deleting = ref(false)
const toDelete = ref(null)

function emptyForm() {
  return { name: '', logo: '', description: '', isActive: true }
}

async function fetchBrands() {
  loading.value = true
  try {
    const { data } = await brandService.list()
    brands.value = data ?? []
  } catch {
    brands.value = []
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
  form.value = {
    name: row.name,
    logo: row.logo || '',
    description: row.description || '',
    isActive: row.isActive !== false,
  }
  modalOpen.value = true
}

async function submit() {
  saving.value = true
  try {
    if (editing.value) await brandService.update(editing.value._id, form.value)
    else await brandService.create(form.value)
    modalOpen.value = false
    await fetchBrands()
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
    await brandService.remove(toDelete.value._id)
    confirmOpen.value = false
    await fetchBrands()
  } finally {
    deleting.value = false
    toDelete.value = null
  }
}

onMounted(fetchBrands)
</script>

<style scoped>
.brands { display: flex; flex-direction: column; gap: 20px; }
.brands__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.brands__title { font-size: 20px; font-weight: 700; color: var(--text-primary); }
.brands__name-cell { display: flex; align-items: center; gap: 10px; font-weight: 600; color: var(--text-primary); }
.brands__logo { width: 28px; height: 28px; border-radius: 8px; object-fit: cover; background: var(--glass); }
.brands__row-actions { display: flex; justify-content: flex-end; gap: 4px; }
.brands__form { display: flex; flex-direction: column; gap: 14px; }
.brands__checkbox { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-primary); }
.brands__form-actions { display: flex; gap: 10px; margin-top: 6px; }
</style>
