<template>
  <div class="p-6 max-w-4xl mx-auto">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="text-xl font-bold text-text-primary">رنگ‌ها</h1>
        <p class="text-sm text-text-secondary mt-0.5">{{ colors.length }} رنگ ثبت شده</p>
      </div>
      <AdminButton @click="openCreate">+ افزودن رنگ</AdminButton>
    </div>

    <!-- ── رنگ‌ها ── -->
    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <AdminSkeleton v-for="i in 6" :key="i" height="72px" class="rounded-xl" />
    </div>
    <div v-else-if="!colors.length" class="text-center py-16 text-text-secondary">
      هنوز رنگی ثبت نشده.
    </div>
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div v-for="color in pagedColors" :key="color._id"
        class="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface group">
        <div class="w-10 h-10 rounded-lg flex-shrink-0 border border-black/10 shadow-sm"
          :style="{ backgroundColor: color.hex }" />
        <div class="flex-1 min-w-0">
          <p class="font-medium text-text-primary text-sm truncate">{{ color.name }}</p>
          <p class="text-xs text-text-secondary font-mono">{{ color.hex }}</p>
        </div>
        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button @click="openEdit(color)" class="icon-btn hover:text-primary" title="ویرایش">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828A2 2 0 019 17H7v-2a2 2 0 012-2z"/>
            </svg>
          </button>
          <button @click="confirmDelete(color)" class="icon-btn hover:text-error" title="حذف">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    <AdminPagination v-model="page" :total-pages="colorTotalPages" :loading="loading" />

    <!-- ── Modal: Add/Edit ── -->
    <AdminModal v-model="showModal" :title="editingItem ? 'ویرایش رنگ' : 'افزودن رنگ'" size="sm">
      <form @submit.prevent="saveItem" class="space-y-4">
        <AdminInput v-model="form.name" label="نام رنگ" placeholder="مثلاً: مشکی" required />
        <div>
          <label class="field-label">رنگ <span class="text-error">*</span></label>
          <div class="flex items-center gap-3">
            <input type="color" v-model="form.hex"
              class="w-12 h-10 rounded-lg border border-border cursor-pointer p-0.5" />
            <AdminInput v-model="form.hex" placeholder="#000000" class="flex-1 font-mono" />
          </div>
          <p v-if="hexError" class="text-xs text-error mt-1">{{ hexError }}</p>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" id="colorActive" v-model="form.isActive" class="w-4 h-4 accent-primary" />
          <label for="colorActive" class="text-sm text-text-primary">فعال</label>
        </div>
      </form>
      <template #footer>
        <div class="flex gap-2 justify-end">
          <AdminButton variant="ghost" @click="showModal = false">انصراف</AdminButton>
          <AdminButton @click="saveItem" :loading="saving">
            {{ editingItem ? 'ذخیره تغییرات' : 'افزودن رنگ' }}
          </AdminButton>
        </div>
      </template>
    </AdminModal>

    <AdminConfirm
      v-model="showConfirm"
      title="حذف رنگ"
      :message="`«${deletingItem?.name}» حذف شود؟`"
      :loading="deleting"
      @confirm="deleteItem"
    />

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { colorService }         from '@/services/color.service'
import { useUiStore }   from '@/stores/ui.store'
import AdminButton      from '@/components/common/AdminButton.vue'
import AdminInput       from '@/components/common/AdminInput.vue'
import AdminModal       from '@/components/common/AdminModal.vue'
import AdminConfirm     from '@/components/common/AdminConfirm.vue'
import AdminSkeleton    from '@/components/common/AdminSkeleton.vue'
import AdminPagination  from '@/components/common/AdminPagination.vue'

const ui = useUiStore()

// ── State ──────────────────────────────────────────────────
const loading   = ref(false)
const saving    = ref(false)
const deleting  = ref(false)
const page      = ref(1)
const PER_PAGE  = 24

const showModal   = ref(false)
const showConfirm = ref(false)
const editingItem  = ref(null)
const deletingItem = ref(null)

const colors = ref([])

const form = reactive({
  name: '', hex: '#000000',
  isActive: true,
})

// ── Color helpers ──────────────────────────────────────────
const hexError = computed(() =>
  form.hex && !/^#[0-9A-Fa-f]{6}$/.test(form.hex) ? 'فرمت باید #RRGGBB باشد' : ''
)
const colorTotalPages = computed(() => Math.ceil(colors.value.length / PER_PAGE))
const pagedColors = computed(() =>
  colors.value.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE)
)

// ── Load ──────────────────────────────────────────────────
async function load() {
  loading.value = true
  try {
    const { data } = await colorService.getAll()
    colors.value = Array.isArray(data) ? data : []
  } catch {
    ui.addToast('خطا در بارگذاری', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(load)

// ── Open modal ─────────────────────────────────────────────
function resetForm() {
  form.name = ''; form.hex = '#000000'
  form.isActive = true
}

function openCreate() {
  editingItem.value = null
  resetForm()
  showModal.value = true
}

function openEdit(item) {
  editingItem.value = item
  form.name     = item.name
  form.hex      = item.hex
  form.isActive = item.isActive
  showModal.value = true
}

// ── Save ──────────────────────────────────────────────────
async function saveItem() {
  saving.value = true
  try {
    await saveColor()
    showModal.value = false
    load()
  } catch (e) {
    ui.addToast(e?.response?.data?.message ?? 'خطا در ذخیره', 'error')
  } finally {
    saving.value = false
  }
}

async function saveColor() {
  if (!form.name.trim()) throw new Error('نام الزامی')
  if (hexError.value)    throw new Error(hexError.value)
  const dto = { name: form.name, hex: form.hex, isActive: form.isActive }
  if (editingItem.value) {
    await colorService.update(editingItem.value._id, dto)
    ui.addToast('رنگ ویرایش شد', 'success')
  } else {
    await colorService.create(dto)
    ui.addToast('رنگ افزوده شد', 'success')
  }
}

// ── Delete ────────────────────────────────────────────────
function confirmDelete(item) {
  deletingItem.value = item
  showConfirm.value  = true
}

async function deleteItem() {
  deleting.value = true
  try {
    await colorService.remove(deletingItem.value._id)
    ui.addToast('حذف شد', 'success')
    showConfirm.value = false
    load()
  } catch {
    ui.addToast('خطا در حذف', 'error')
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.icon-btn {
  @apply w-7 h-7 flex items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-primary/10;
}
</style>
