<template>
  <div class="popups">
    <div class="popups__head">
      <h1 class="popups__title">پاپ‌آپ‌ها</h1>
      <AdminButton icon="plus" @click="openCreate">پاپ‌آپ جدید</AdminButton>
    </div>

    <AdminCard flush>
      <AdminTable :columns="columns" :rows="popups" :loading="loading">
        <template #cell-title="{ row }">
          <div class="popups__title-cell">
            <img v-if="row.imageUrl" :src="row.imageUrl" class="popups__thumb" alt="">
            <span>{{ row.title || 'بدون عنوان' }}</span>
          </div>
        </template>
        <template #cell-showOncePer="{ value }">{{ frequencyLabel(value) }}</template>
        <template #cell-isActive="{ row }">
          <AdminButton variant="ghost" size="sm" @click="toggle(row)">
            <AdminBadge :variant="row.isActive ? 'success' : 'neutral'">{{ row.isActive ? 'فعال' : 'غیرفعال' }}</AdminBadge>
          </AdminButton>
        </template>
        <template #cell-actions="{ row }">
          <div class="popups__row-actions">
            <AdminButton variant="ghost" size="sm" icon="edit" @click="openEdit(row)">ویرایش</AdminButton>
            <AdminButton variant="ghost" size="sm" icon="trash" @click="confirmDelete(row)">حذف</AdminButton>
          </div>
        </template>
        <template #empty>هنوز پاپ‌آپی ثبت نشده است</template>
      </AdminTable>
    </AdminCard>

    <AdminModal v-model="modalOpen" :title="editing ? 'ویرایش پاپ‌آپ' : 'پاپ‌آپ جدید'" width="520px">
      <form class="popups__form" @submit.prevent="submit">
        <AdminInput v-model="form.title" label="عنوان" />
        <AdminTextarea v-model="form.description" label="توضیحات" :rows="3" />
        <div class="popups__image-field">
          <img v-if="form.imageUrl" :src="form.imageUrl" class="popups__preview" alt="">
          <input type="file" accept="image/*" @change="onImagePick">
          <span v-if="uploading" class="popups__uploading">در حال آپلود...</span>
        </div>
        <div class="popups__row">
          <AdminInput v-model="form.buttonText" label="متن دکمه" />
          <AdminInput v-model="form.buttonLink" label="لینک دکمه" />
        </div>
        <div class="popups__row">
          <AdminInput v-model.number="form.showDelay" type="number" label="تاخیر نمایش (ثانیه)" />
          <AdminSelect v-model="form.showOncePer" label="دفعه نمایش" :options="frequencyOptions" />
        </div>
        <label class="popups__checkbox">
          <input v-model="form.isActive" type="checkbox">
          فعال
        </label>
        <div class="popups__form-actions">
          <AdminButton type="submit" :loading="saving">{{ editing ? 'ذخیره' : 'ایجاد' }}</AdminButton>
          <AdminButton variant="secondary" type="button" @click="modalOpen = false">انصراف</AdminButton>
        </div>
      </form>
    </AdminModal>

    <AdminConfirm
      v-model="confirmOpen"
      title="حذف پاپ‌آپ"
      :message="`آیا از حذف این پاپ‌آپ مطمئن هستید؟`"
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
import AdminSelect from '../../components/common/AdminSelect.vue'
import AdminTextarea from '../../components/common/AdminTextarea.vue'
import AdminConfirm from '../../components/common/AdminConfirm.vue'
import { popupService } from '../../services/popup.service'
import { uploadService } from '../../services/upload.service'

const columns = [
  { key: 'title', label: 'عنوان' },
  { key: 'showOncePer', label: 'دفعه نمایش' },
  { key: 'isActive', label: 'وضعیت' },
  { key: 'actions', label: '', width: '180px', align: 'end' },
]

const frequencyOptions = [
  { label: 'هر بار', value: 'always' },
  { label: 'هر جلسه', value: 'session' },
  { label: 'روزی یک‌بار', value: 'day' },
  { label: 'هفته‌ای یک‌بار', value: 'week' },
]

const popups = ref([])
const loading = ref(true)
const uploading = ref(false)

const modalOpen = ref(false)
const editing = ref(null)
const saving = ref(false)
const form = ref(emptyForm())

const confirmOpen = ref(false)
const deleting = ref(false)
const toDelete = ref(null)

function emptyForm() {
  return {
    title: '', description: '', imageUrl: '', buttonText: '', buttonLink: '',
    showDelay: 0, showOncePer: 'day', isActive: true,
  }
}

function frequencyLabel(value) {
  return frequencyOptions.find((o) => o.value === value)?.label || '—'
}

async function fetchPopups() {
  loading.value = true
  try {
    const { data } = await popupService.list()
    popups.value = data ?? []
  } catch {
    popups.value = []
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
  form.value = { ...emptyForm(), ...row }
  modalOpen.value = true
}

async function onImagePick(e) {
  const file = e.target.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const { data } = await uploadService.uploadImage(file, 'banners')
    form.value.imageUrl = data.original.url
  } finally {
    uploading.value = false
  }
}

async function submit() {
  saving.value = true
  try {
    if (editing.value) await popupService.update(editing.value._id, form.value)
    else await popupService.create(form.value)
    modalOpen.value = false
    await fetchPopups()
  } finally {
    saving.value = false
  }
}

async function toggle(row) {
  await popupService.toggle(row._id)
  await fetchPopups()
}

function confirmDelete(row) {
  toDelete.value = row
  confirmOpen.value = true
}

async function handleDelete() {
  if (!toDelete.value) return
  deleting.value = true
  try {
    await popupService.remove(toDelete.value._id)
    confirmOpen.value = false
    await fetchPopups()
  } finally {
    deleting.value = false
    toDelete.value = null
  }
}

onMounted(fetchPopups)
</script>

<style scoped>
.popups { display: flex; flex-direction: column; gap: 20px; }
.popups__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.popups__title { font-size: 20px; font-weight: 700; color: var(--text-primary); }
.popups__title-cell { display: flex; align-items: center; gap: 10px; font-weight: 600; color: var(--text-primary); }
.popups__thumb { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; background: var(--glass); }
.popups__row-actions { display: flex; justify-content: flex-end; gap: 4px; }
.popups__form { display: flex; flex-direction: column; gap: 14px; }
.popups__row { display: flex; gap: 12px; }
.popups__row > * { flex: 1; }
.popups__image-field { display: flex; flex-direction: column; gap: 8px; }
.popups__preview { width: 100%; max-height: 140px; object-fit: cover; border-radius: 12px; background: var(--glass); }
.popups__uploading { font-size: 11.5px; color: var(--text-secondary); }
.popups__checkbox { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-primary); }
.popups__form-actions { display: flex; gap: 10px; margin-top: 6px; }
</style>
