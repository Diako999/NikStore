<template>
  <div class="banners">
    <div class="banners__head">
      <h1 class="banners__title">بنرها</h1>
      <AdminButton icon="plus" @click="openCreate">بنر جدید</AdminButton>
    </div>

    <AdminCard flush>
      <AdminTable :columns="columns" :rows="banners" :loading="loading">
        <template #cell-title="{ row }">
          <div class="banners__title-cell">
            <img v-if="row.imageUrl" :src="row.imageUrl" class="banners__thumb" alt="">
            <span>{{ row.title }}</span>
          </div>
        </template>
        <template #cell-type="{ value }">{{ value === 'hero' ? 'هیرو' : 'پروموشن' }}</template>
        <template #cell-isActive="{ row }">
          <AdminButton variant="ghost" size="sm" @click="toggle(row)">
            <AdminBadge :variant="row.isActive ? 'success' : 'neutral'">{{ row.isActive ? 'فعال' : 'غیرفعال' }}</AdminBadge>
          </AdminButton>
        </template>
        <template #cell-order="{ row, index }">
          <div class="banners__order">
            <button type="button" class="banners__order-btn" :disabled="index === 0" @click="move(index, -1)">
              <AppIcon name="chevron-up" :size="14" />
            </button>
            <button type="button" class="banners__order-btn" :disabled="index === banners.length - 1" @click="move(index, 1)">
              <AppIcon name="chevron-down" :size="14" />
            </button>
          </div>
        </template>
        <template #cell-actions="{ row }">
          <div class="banners__row-actions">
            <AdminButton variant="ghost" size="sm" icon="edit" @click="openEdit(row)">ویرایش</AdminButton>
            <AdminButton variant="ghost" size="sm" icon="trash" @click="confirmDelete(row)">حذف</AdminButton>
          </div>
        </template>
        <template #empty>هنوز بنری ثبت نشده است</template>
      </AdminTable>
    </AdminCard>

    <AdminModal v-model="modalOpen" :title="editing ? 'ویرایش بنر' : 'بنر جدید'" width="560px">
      <form class="banners__form" @submit.prevent="submit">
        <AdminInput v-model="form.title" label="عنوان" />
        <AdminInput v-model="form.eyebrow" label="برچسب بالا (اختیاری)" />
        <AdminInput v-model="form.subtitle" label="زیرعنوان" />
        <div class="banners__row">
          <AdminInput v-model="form.cta" label="متن دکمه" />
          <AdminInput v-model="form.ctaLink" label="لینک دکمه" />
        </div>
        <div class="banners__image-field">
          <img v-if="form.imageUrl" :src="form.imageUrl" class="banners__preview" alt="">
          <input type="file" accept="image/*" @change="onImagePick">
          <span v-if="uploading" class="banners__uploading">در حال آپلود...</span>
        </div>
        <div class="banners__row">
          <AdminSelect v-model="form.type" label="نوع" :options="typeOptions" />
          <AdminSelect v-model="form.badgeType" label="نشان" :options="badgeOptions" />
        </div>
        <label class="banners__checkbox">
          <input v-model="form.isActive" type="checkbox">
          فعال
        </label>
        <div class="banners__form-actions">
          <AdminButton type="submit" :loading="saving">{{ editing ? 'ذخیره' : 'ایجاد' }}</AdminButton>
          <AdminButton variant="secondary" type="button" @click="modalOpen = false">انصراف</AdminButton>
        </div>
      </form>
    </AdminModal>

    <AdminConfirm
      v-model="confirmOpen"
      title="حذف بنر"
      :message="`آیا از حذف «${toDelete?.title ?? ''}» مطمئن هستید؟`"
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
import AdminConfirm from '../../components/common/AdminConfirm.vue'
import AppIcon from '../../components/icons/AppIcon.vue'
import { bannerService } from '../../services/banner.service'
import { uploadService } from '../../services/upload.service'

const columns = [
  { key: 'title', label: 'عنوان' },
  { key: 'type', label: 'نوع' },
  { key: 'isActive', label: 'وضعیت' },
  { key: 'order', label: 'ترتیب', width: '80px', align: 'center' },
  { key: 'actions', label: '', width: '180px', align: 'end' },
]

const typeOptions = [
  { label: 'هیرو', value: 'hero' },
  { label: 'پروموشن', value: 'promo' },
]

const badgeOptions = [
  { label: 'بدون نشان', value: 'none' },
  { label: 'حراج', value: 'sale' },
  { label: 'جدید', value: 'new' },
  { label: 'فصلی', value: 'season' },
]

const banners = ref([])
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
    title: '', eyebrow: '', subtitle: '', cta: '', ctaLink: '',
    imageUrl: '', type: 'promo', badgeType: 'none', isActive: true,
  }
}

async function fetchBanners() {
  loading.value = true
  try {
    const { data } = await bannerService.adminList()
    banners.value = (data ?? []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  } catch {
    banners.value = []
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
    if (editing.value) await bannerService.update(editing.value._id, form.value)
    else await bannerService.create(form.value)
    modalOpen.value = false
    await fetchBanners()
  } finally {
    saving.value = false
  }
}

async function toggle(row) {
  await bannerService.toggle(row._id)
  await fetchBanners()
}

async function move(index, delta) {
  const target = index + delta
  if (target < 0 || target >= banners.value.length) return
  const items = banners.value.slice()
  const [item] = items.splice(index, 1)
  items.splice(target, 0, item)
  banners.value = items
  await bannerService.reorder(items.map((b) => b._id))
}

function confirmDelete(row) {
  toDelete.value = row
  confirmOpen.value = true
}

async function handleDelete() {
  if (!toDelete.value) return
  deleting.value = true
  try {
    await bannerService.remove(toDelete.value._id)
    confirmOpen.value = false
    await fetchBanners()
  } finally {
    deleting.value = false
    toDelete.value = null
  }
}

onMounted(fetchBanners)
</script>

<style scoped>
.banners { display: flex; flex-direction: column; gap: 20px; }
.banners__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.banners__title { font-size: 20px; font-weight: 700; color: var(--text-primary); }
.banners__title-cell { display: flex; align-items: center; gap: 10px; font-weight: 600; color: var(--text-primary); }
.banners__thumb { width: 48px; height: 32px; border-radius: 6px; object-fit: cover; background: var(--glass); }
.banners__order { display: flex; flex-direction: column; gap: 2px; align-items: center; }
.banners__order-btn {
  width: 22px; height: 22px; border-radius: 6px; border: 1px solid var(--glass-border);
  background: var(--glass); color: var(--text-secondary); display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.banners__order-btn:disabled { opacity: .35; cursor: not-allowed; }
.banners__row-actions { display: flex; justify-content: flex-end; gap: 4px; }
.banners__form { display: flex; flex-direction: column; gap: 14px; }
.banners__row { display: flex; gap: 12px; }
.banners__row > * { flex: 1; }
.banners__image-field { display: flex; flex-direction: column; gap: 8px; }
.banners__preview { width: 100%; max-height: 140px; object-fit: cover; border-radius: 12px; background: var(--glass); }
.banners__uploading { font-size: 11.5px; color: var(--text-secondary); }
.banners__checkbox { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-primary); }
.banners__form-actions { display: flex; gap: 10px; margin-top: 6px; }
</style>
