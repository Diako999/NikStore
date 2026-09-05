<template>
  <div class="categories">
    <div class="categories__head">
      <h1 class="categories__title">دسته‌بندی‌ها</h1>
      <AdminButton icon="plus" @click="openCreate">دسته‌بندی جدید</AdminButton>
    </div>

    <AdminCard flush>
      <AdminTable :columns="columns" :rows="rows" :loading="loading">
        <template #cell-name="{ row }">
          <span :style="{ paddingInlineStart: row.depth * 18 + 'px' }" class="categories__name">
            {{ row.name }}
          </span>
        </template>
        <template #cell-gender="{ value }">
          {{ genderLabel(value) }}
        </template>
        <template #cell-isActive="{ value }">
          <AdminBadge :variant="value ? 'success' : 'neutral'">
            {{ value ? 'فعال' : 'غیرفعال' }}
          </AdminBadge>
        </template>
        <template #cell-actions="{ row }">
          <div class="categories__row-actions">
            <AdminButton variant="ghost" size="sm" icon="edit" @click="openEdit(row)">ویرایش</AdminButton>
            <AdminButton variant="ghost" size="sm" icon="trash" @click="confirmDelete(row)">حذف</AdminButton>
          </div>
        </template>
        <template #empty>هنوز دسته‌بندی‌ای ثبت نشده است</template>
      </AdminTable>
    </AdminCard>

    <AdminModal v-model="modalOpen" :title="editing ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'">
      <form class="categories__form" @submit.prevent="submit">
        <AdminInput v-model="form.name" label="نام" />
        <AdminSelect v-model="form.parent" label="دسته والد" :options="parentOptions" placeholder="بدون والد" />
        <AdminSelect v-model="form.gender" label="جنسیت" :options="genderOptions" />
        <AdminTextarea v-model="form.description" label="توضیحات" :rows="3" />
        <label class="categories__checkbox">
          <input v-model="form.isActive" type="checkbox">
          فعال
        </label>
        <div class="categories__form-actions">
          <AdminButton type="submit" :loading="saving">{{ editing ? 'ذخیره' : 'ایجاد' }}</AdminButton>
          <AdminButton variant="secondary" type="button" @click="modalOpen = false">انصراف</AdminButton>
        </div>
      </form>
    </AdminModal>

    <AdminConfirm
      v-model="confirmOpen"
      title="حذف دسته‌بندی"
      :message="`آیا از حذف «${toDelete?.name ?? ''}» مطمئن هستید؟`"
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
import AdminBadge from '../../components/common/AdminBadge.vue'
import AdminModal from '../../components/common/AdminModal.vue'
import AdminInput from '../../components/common/AdminInput.vue'
import AdminSelect from '../../components/common/AdminSelect.vue'
import AdminTextarea from '../../components/common/AdminTextarea.vue'
import AdminConfirm from '../../components/common/AdminConfirm.vue'
import { categoryService } from '../../services/category.service'

const columns = [
  { key: 'name', label: 'نام' },
  { key: 'gender', label: 'جنسیت' },
  { key: 'isActive', label: 'وضعیت' },
  { key: 'actions', label: '', width: '180px', align: 'end' },
]

const genderOptions = [
  { label: 'همه', value: '' },
  { label: 'زنانه', value: 'women' },
  { label: 'مردانه', value: 'men' },
  { label: 'بچگانه', value: 'kids' },
  { label: 'یونیسکس', value: 'unisex' },
]

const tree = ref([])
const loading = ref(true)

const modalOpen = ref(false)
const editing = ref(null)
const saving = ref(false)
const form = ref(emptyForm())

const confirmOpen = ref(false)
const deleting = ref(false)
const toDelete = ref(null)

function emptyForm() {
  return { name: '', parent: '', gender: '', description: '', isActive: true }
}

function flatten(nodes, depth = 0) {
  return nodes.flatMap((n) => [{ ...n, depth }, ...flatten(n.children ?? [], depth + 1)])
}

const rows = computed(() => flatten(tree.value))

const parentOptions = computed(() => [
  { label: 'بدون والد', value: '' },
  ...rows.value
    .filter((c) => c._id !== editing.value?._id)
    .map((c) => ({ label: '—'.repeat(c.depth) + ' ' + c.name, value: c._id })),
])

function genderLabel(value) {
  return genderOptions.find((o) => o.value === value)?.label || '—'
}

async function fetchCategories() {
  loading.value = true
  try {
    const { data } = await categoryService.tree()
    tree.value = data ?? []
  } catch {
    tree.value = []
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
    parent: row.parent || '',
    gender: row.gender || '',
    description: row.description || '',
    isActive: row.isActive !== false,
  }
  modalOpen.value = true
}

async function submit() {
  saving.value = true
  try {
    const payload = { ...form.value, parent: form.value.parent || undefined }
    if (editing.value) await categoryService.update(editing.value._id, payload)
    else await categoryService.create(payload)
    modalOpen.value = false
    await fetchCategories()
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
    await categoryService.remove(toDelete.value._id)
    confirmOpen.value = false
    await fetchCategories()
  } finally {
    deleting.value = false
    toDelete.value = null
  }
}

onMounted(fetchCategories)
</script>

<style scoped>
.categories { display: flex; flex-direction: column; gap: 20px; }
.categories__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.categories__title { font-size: 20px; font-weight: 700; color: var(--text-primary); }
.categories__name { font-weight: 600; color: var(--text-primary); }
.categories__row-actions { display: flex; justify-content: flex-end; gap: 4px; }
.categories__form { display: flex; flex-direction: column; gap: 14px; }
.categories__checkbox { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-primary); }
.categories__form-actions { display: flex; gap: 10px; margin-top: 6px; }
</style>
