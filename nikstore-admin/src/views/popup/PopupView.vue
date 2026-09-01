<template>
  <div class="space-y-5">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="page-title">پاپ‌آپ سایت</h1>
        <p class="text-text-secondary text-sm mt-0.5">پاپ‌آپی که به بازدیدکنندگان نمایش داده می‌شود</p>
      </div>
      <AdminButton @click="openCreate">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M12 4v16m8-8H4"/>
        </svg>
        پاپ‌آپ جدید
      </AdminButton>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="i in 2" :key="i" class="admin-card h-64 animate-pulse" style="background-color: var(--color-surface);"/>
    </div>

    <!-- Empty -->
    <div v-else-if="!popups.length"
      class="admin-card flex flex-col items-center justify-center py-20 text-center">
      <div class="text-5xl mb-4">🎯</div>
      <h3 class="text-lg font-bold text-text-primary mb-1">هیچ پاپ‌آپی تعریف نشده</h3>
      <p class="text-text-secondary text-sm mb-5">اولین پاپ‌آپ خود را بسازید</p>
      <AdminButton @click="openCreate">ساخت پاپ‌آپ</AdminButton>
    </div>

    <!-- Cards grid -->
    <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="popup in popups"
        :key="popup._id"
        class="admin-card overflow-hidden group"
      >
        <!-- Image preview -->
        <div class="relative h-44 bg-surface rounded-lg overflow-hidden mb-4 flex items-center justify-center">
          <img
            v-if="popup.imageUrl"
            :src="popup.imageUrl"
            :alt="popup.title"
            class="w-full h-full object-cover"
            @error="e => e.target.style.display='none'"
          />
          <div v-else class="text-4xl opacity-20">🖼️</div>
          <!-- Active badge -->
          <span :class="[
            'absolute top-2 right-2 text-xs font-bold px-2.5 py-1 rounded-full',
            popup.isActive
              ? 'bg-green-500 text-white'
              : 'bg-gray-400 text-white',
          ]">
            {{ popup.isActive ? 'فعال' : 'غیرفعال' }}
          </span>
        </div>

        <!-- Info -->
        <h3 class="font-bold text-text-primary text-sm mb-1 truncate">
          {{ popup.title || '(بدون عنوان)' }}
        </h3>
        <p class="text-text-secondary text-xs mb-3 line-clamp-2 min-h-[2.5rem]">
          {{ popup.description || '—' }}
        </p>

        <!-- Meta -->
        <div class="flex items-center gap-3 text-xs text-text-disabled mb-4">
          <span>تاخیر: {{ popup.showDelay }}ث</span>
          <span>·</span>
          <span>{{ showOnceLabel(popup.showOncePer) }}</span>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <button
            @click="toggleActive(popup)"
            :class="[
              'flex-1 py-2 rounded-lg text-xs font-medium transition-colors',
              popup.isActive
                ? 'bg-red-50 text-error hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40'
                : 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40',
            ]"
          >
            {{ popup.isActive ? 'غیرفعال کردن' : 'فعال کردن' }}
          </button>
          <button
            @click="openEdit(popup)"
            class="flex-1 py-2 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            ویرایش
          </button>
          <button
            @click="openPreview(popup)"
            class="w-9 h-9 rounded-lg border border-surface-border text-text-secondary hover:text-primary hover:border-primary transition-colors flex items-center justify-center flex-shrink-0"
            title="پیش‌نمایش"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </button>
          <button
            @click="confirmDelete(popup)"
            class="w-9 h-9 rounded-lg border border-surface-border text-text-secondary hover:text-error hover:border-error transition-colors flex items-center justify-center flex-shrink-0"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- ── Form Modal ──────────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="formModal.open"
        class="fixed inset-0 z-modal flex items-center justify-center p-4"
        style="background: rgba(0,0,0,0.55);"
        @click.self="formModal.open = false"
      >
        <div class="rounded-2xl shadow-modal w-full max-w-xl flex flex-col max-h-[90vh]"
          style="background-color: var(--color-card);">

          <!-- Modal header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
            <h2 class="font-bold text-text-primary">{{ formModal.isEdit ? 'ویرایش پاپ‌آپ' : 'پاپ‌آپ جدید' }}</h2>
            <button @click="formModal.open = false" class="text-text-secondary hover:text-text-primary p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Modal body -->
          <div class="overflow-y-auto flex-1 px-6 py-5 space-y-4">

            <!-- Image upload -->
            <div>
              <label class="field-label">تصویر پاپ‌آپ</label>

              <!-- Preview (when image exists) -->
              <div v-if="form.imageUrl" class="relative rounded-xl overflow-hidden bg-surface border border-border group">
                <img
                  :src="form.imageUrl"
                  class="w-full h-44 object-cover"
                  @error="e => e.target.style.opacity='0.2'"
                />
                <!-- Hover overlay with actions -->
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    @click="triggerImageUpload"
                    :disabled="uploading"
                    class="flex items-center gap-1.5 bg-white text-gray-800 text-xs font-bold px-3 py-2 rounded-lg shadow hover:bg-gray-100 transition-colors"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                    </svg>
                    تغییر تصویر
                  </button>
                  <button
                    type="button"
                    @click="form.imageUrl = ''"
                    class="flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-lg shadow hover:bg-red-600 transition-colors"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    حذف
                  </button>
                </div>
                <!-- Upload spinner overlay -->
                <div v-if="uploading" class="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div class="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"/>
                </div>
              </div>

              <!-- Drop zone (when no image) -->
              <div
                v-else
                @click="triggerImageUpload"
                @dragover.prevent="dragOver = true"
                @dragleave.prevent="dragOver = false"
                @drop.prevent="onDrop"
                :class="[
                  'relative h-44 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200',
                  'flex flex-col items-center justify-center gap-3',
                  dragOver
                    ? 'border-primary bg-primary/8 scale-[1.01]'
                    : 'border-border hover:border-primary/60 hover:bg-primary/4',
                  uploading ? 'pointer-events-none' : '',
                ]"
              >
                <template v-if="!uploading">
                  <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-7.5-7.5h.008v.008H9.75V7.5zm10.5 0h.008v.008h-.008V7.5zM3 6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25V6.75z"/>
                    </svg>
                  </div>
                  <div class="text-center">
                    <p class="text-sm font-medium text-text-primary">
                      تصویر را اینجا رها کنید یا
                      <span class="text-primary underline underline-offset-2">انتخاب کنید</span>
                    </p>
                    <p class="text-xs text-text-disabled mt-1">JPG، PNG، WebP — حداکثر ۵MB</p>
                    <p class="text-xs mt-1" style="color: var(--color-primary); opacity: 0.75;">
                      سایز پیشنهادی: <strong>۸۰۰×۴۵۰</strong> پیکسل (نسبت ۱۶:۹)
                    </p>
                  </div>
                </template>
                <template v-else>
                  <div class="w-10 h-10 border-[3px] border-primary border-t-transparent rounded-full animate-spin"/>
                  <p class="text-sm text-text-secondary">در حال آپلود...</p>
                </template>
              </div>

              <!-- Hidden file input -->
              <input
                ref="imageFileInput"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                class="hidden"
                @change="onFileSelected"
              />

              <!-- Or URL fallback -->
              <div class="mt-2 flex items-center gap-2">
                <div class="flex-1 h-px bg-border"/>
                <span class="text-xs text-text-disabled flex-shrink-0">یا آدرس مستقیم</span>
                <div class="flex-1 h-px bg-border"/>
              </div>
              <AdminInput
                v-model="form.imageUrl"
                placeholder="https://..."
                dir="ltr"
                class="mt-2"
              />
            </div>

            <!-- Title -->
            <div>
              <label class="field-label">عنوان <span class="text-text-disabled text-xs">(اختیاری)</span></label>
              <AdminInput v-model="form.title" placeholder="مثلاً: تخفیف ویژه!" />
            </div>

            <!-- Description -->
            <div>
              <label class="field-label">متن توضیح <span class="text-text-disabled text-xs">(اختیاری)</span></label>
              <textarea
                v-model="form.description"
                rows="3"
                placeholder="توضیح مختصری درباره پیشنهاد..."
                class="field-input resize-none"
              />
            </div>

            <!-- Button text + link -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label">متن دکمه</label>
                <AdminInput v-model="form.buttonText" placeholder="مشاهده بیشتر" />
              </div>
              <div>
                <label class="field-label">لینک دکمه</label>
                <AdminInput v-model="form.buttonLink" placeholder="/products" dir="ltr" />
              </div>
            </div>

            <!-- Delay + showOncePer -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label">تاخیر نمایش (ثانیه)</label>
                <AdminInput v-model.number="form.showDelay" type="number" min="0" max="30" dir="ltr" />
              </div>
              <div>
                <label class="field-label">نمایش مجدد</label>
                <AdminSelect v-model="form.showOncePer" :options="showOnceOptions" />
              </div>
            </div>

            <!-- Active toggle -->
            <div class="flex items-center justify-between py-2 border-t border-border">
              <span class="text-sm font-medium text-text-primary">وضعیت فعال</span>
              <button
                @click="form.isActive = !form.isActive"
                :class="[
                  'relative w-12 h-6 rounded-full transition-colors duration-200',
                  form.isActive ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600',
                ]"
              >
                <span :class="[
                  'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200',
                  form.isActive ? 'right-1' : 'right-7',
                ]"/>
              </button>
            </div>

          </div>

          <!-- Modal footer -->
          <div class="flex gap-3 px-6 py-4 border-t border-border flex-shrink-0">
            <AdminButton variant="secondary" class="flex-1" @click="formModal.open = false" :disabled="formModal.saving">
              انصراف
            </AdminButton>
            <AdminButton class="flex-1" :loading="formModal.saving" @click="saveForm">
              {{ formModal.isEdit ? 'ذخیره تغییرات' : 'ایجاد پاپ‌آپ' }}
            </AdminButton>
          </div>

        </div>
      </div>
    </Teleport>

    <!-- ── Preview Modal ───────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="previewPopup"
        class="fixed inset-0 z-[500] flex items-center justify-center p-4"
        style="background: rgba(0,0,0,0.7);"
        @click.self="previewPopup = null"
      >
        <div class="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
          style="background-color: var(--color-card);">
          <button
            @click="previewPopup = null"
            class="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <img v-if="previewPopup.imageUrl" :src="previewPopup.imageUrl"
            class="w-full max-h-56 object-cover" />
          <div class="p-5">
            <h3 v-if="previewPopup.title" class="text-lg font-bold text-text-primary mb-2">
              {{ previewPopup.title }}
            </h3>
            <p v-if="previewPopup.description" class="text-text-secondary text-sm mb-4">
              {{ previewPopup.description }}
            </p>
            <button v-if="previewPopup.buttonText"
              class="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm">
              {{ previewPopup.buttonText }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete confirm -->
    <AdminConfirm
      v-model="deleteDialog.open"
      title="حذف پاپ‌آپ"
      :message="`آیا از حذف این پاپ‌آپ مطمئنید؟`"
      confirm-label="بله، حذف شود"
      confirm-variant="danger"
      :loading="deleteDialog.loading"
      @confirm="doDelete"
    />

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { popupService }  from '@/services/popup.service'
import { uploadService } from '@/services/upload.service'
import { useUiStore } from '@/stores/ui.store'
import AdminButton  from '@/components/common/AdminButton.vue'
import AdminInput   from '@/components/common/AdminInput.vue'
import AdminSelect  from '@/components/common/AdminSelect.vue'
import AdminConfirm from '@/components/common/AdminConfirm.vue'

const ui = useUiStore()

const popups  = ref([])
const loading = ref(true)
const previewPopup = ref(null)
const deleteDialog = reactive({ open: false, id: null, loading: false })

// ── Image upload ────────────────────────────────────────────
const imageFileInput = ref(null)
const uploading      = ref(false)
const dragOver       = ref(false)

function triggerImageUpload() {
  imageFileInput.value?.click()
}

async function uploadFile(file) {
  if (!file) return
  const MAX = 5 * 1024 * 1024
  if (file.size > MAX) { ui.addToast('حجم فایل نباید بیشتر از ۵MB باشد', 'error'); return }
  uploading.value = true
  try {
    const { data } = await uploadService.uploadImage(file, 'popups')
    form.imageUrl = data?.original?.url || data?.url || ''
  } catch {
    ui.addToast('خطا در آپلود تصویر', 'error')
  } finally {
    uploading.value = false
    if (imageFileInput.value) imageFileInput.value.value = ''
  }
}

function onFileSelected(e) {
  uploadFile(e.target.files?.[0])
}

function onDrop(e) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) uploadFile(file)
}

const showOnceOptions = [
  { value: 'session', label: 'یک‌بار در هر نشست' },
  { value: 'day',     label: 'یک‌بار در روز' },
  { value: 'week',    label: 'یک‌بار در هفته' },
  { value: 'always',  label: 'هر بار نمایش داده شود' },
]

function showOnceLabel(val) {
  return showOnceOptions.find(o => o.value === val)?.label ?? val
}

const defaultForm = () => ({
  title:       '',
  description: '',
  imageUrl:    '',
  buttonText:  'مشاهده بیشتر',
  buttonLink:  '/',
  isActive:    true,
  showDelay:   2,
  showOncePer: 'day',
})

const form = reactive(defaultForm())
const formModal = reactive({ open: false, isEdit: false, editId: null, saving: false })

function openCreate() {
  Object.assign(form, defaultForm())
  formModal.isEdit = false
  formModal.editId = null
  formModal.open = true
}

function openEdit(popup) {
  Object.assign(form, {
    title:       popup.title       ?? '',
    description: popup.description ?? '',
    imageUrl:    popup.imageUrl    ?? '',
    buttonText:  popup.buttonText  ?? '',
    buttonLink:  popup.buttonLink  ?? '',
    isActive:    popup.isActive    ?? true,
    showDelay:   popup.showDelay   ?? 2,
    showOncePer: popup.showOncePer ?? 'day',
  })
  formModal.isEdit = true
  formModal.editId = popup._id
  formModal.open = true
}

function openPreview(popup) {
  previewPopup.value = popup
}

async function saveForm() {
  formModal.saving = true
  try {
    if (formModal.isEdit) {
      const { data } = await popupService.update(formModal.editId, { ...form })
      const idx = popups.value.findIndex(p => p._id === formModal.editId)
      if (idx > -1) popups.value[idx] = data
      ui.addToast('پاپ‌آپ ویرایش شد', 'success')
    } else {
      const { data } = await popupService.create({ ...form })
      popups.value.unshift(data)
      ui.addToast('پاپ‌آپ ایجاد شد', 'success')
    }
    formModal.open = false
  } catch {
    ui.addToast('خطا در ذخیره پاپ‌آپ', 'error')
  } finally {
    formModal.saving = false
  }
}

async function toggleActive(popup) {
  const prev = popup.isActive
  popup.isActive = !popup.isActive
  try {
    await popupService.toggle(popup._id)
    ui.addToast(popup.isActive ? 'پاپ‌آپ فعال شد' : 'پاپ‌آپ غیرفعال شد', 'success')
  } catch {
    popup.isActive = prev
    ui.addToast('خطا در تغییر وضعیت', 'error')
  }
}

function confirmDelete(popup) {
  deleteDialog.open = true
  deleteDialog.id = popup._id
  deleteDialog.loading = false
}

async function doDelete() {
  deleteDialog.loading = true
  try {
    await popupService.remove(deleteDialog.id)
    popups.value = popups.value.filter(p => p._id !== deleteDialog.id)
    ui.addToast('پاپ‌آپ حذف شد', 'success')
    deleteDialog.open = false
  } catch {
    ui.addToast('خطا در حذف', 'error')
  } finally {
    deleteDialog.loading = false
  }
}

onMounted(async () => {
  try {
    const { data } = await popupService.getAll()
    popups.value = Array.isArray(data) ? data : []
  } catch {
    ui.addToast('خطا در بارگذاری پاپ‌آپ‌ها', 'error')
  } finally {
    loading.value = false
  }
})
</script>
