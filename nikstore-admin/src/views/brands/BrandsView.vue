<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="page-title">برندها</h1>
        <p class="text-text-secondary text-sm mt-1">{{ total }} برند</p>
      </div>
      <AdminButton @click="openCreate">+ افزودن برند</AdminButton>
    </div>

    <!-- Search -->
    <div class="admin-card mb-5">
      <div class="flex gap-3">
        <div class="relative flex-1">
          <input
            v-model="search"
            type="text"
            placeholder="جستجو در نام برند..."
            class="field-input pl-10"
          />
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">🔍</span>
        </div>
        <select v-model="filterActive" class="field-input w-44">
          <option value="">همه برندها</option>
          <option value="true">فعال</option>
          <option value="false">غیرفعال</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="admin-card">
      <AdminTable
        :columns="columns"
        :rows="pagedBrands"
        :loading="loading"
        empty-text="برندی یافت نشد"
      >
        <template #cell-name="{ row }">
          <div class="flex items-center gap-3">
            <div v-if="row.logo" class="w-10 h-10 rounded-lg overflow-hidden border border-border flex-shrink-0">
              <img :src="row.logo" :alt="row.name" class="w-full h-full object-contain p-1" />
            </div>
            <div v-else class="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0 text-lg">
              🏷️
            </div>
            <div>
              <p class="font-medium text-text-primary">{{ row.name }}</p>
              <p class="text-xs text-text-secondary dir-ltr">{{ row.slug }}</p>
            </div>
          </div>
        </template>

        <template #cell-isActive="{ row }">
          <AdminBadge :variant="row.isActive ? 'success' : 'gray'">
            {{ row.isActive ? 'فعال' : 'غیرفعال' }}
          </AdminBadge>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center gap-2 justify-end">
            <button @click="openEdit(row)"
              class="w-8 h-8 rounded-lg border border-border hover:border-primary hover:text-primary transition-colors flex items-center justify-center text-text-secondary">
              ✏️
            </button>
            <button @click="confirmDelete(row)"
              class="w-8 h-8 rounded-lg border border-border hover:border-red-500 hover:text-red-500 transition-colors flex items-center justify-center text-text-secondary">
              🗑️
            </button>
          </div>
        </template>
      </AdminTable>
      <AdminPagination v-model="page" :total-pages="totalPages" :loading="loading" />
    </div>

    <!-- Form Modal -->
    <AdminModal
      :modelValue="showModal"
      :title="editingBrand ? 'ویرایش برند' : 'افزودن برند جدید'"
      size="md"
      @close="closeModal"
    >
      <div class="space-y-4">
        <AdminInput
          v-model="form.name"
          label="نام برند"
          placeholder="مثلاً: Ray-Ban"
          required
          :error="errors.name"
        />

        <div>
          <label class="field-label">لوگو برند</label>
          <ImageUploader v-model="formImages" :max-images="1" />
        </div>

        <AdminTextarea
          v-model="form.description"
          label="توضیحات"
          placeholder="توضیح کوتاهی درباره این برند..."
          :rows="3"
        />

        <div class="grid grid-cols-2 gap-4">
          <AdminInput
            v-model.number="form.sortOrder"
            label="ترتیب نمایش"
            type="number"
            placeholder="0"
            hint="عدد کوچکتر = اول‌تر"
          />
          <div>
            <label class="field-label">وضعیت</label>
            <label class="flex items-center gap-3 mt-2 cursor-pointer">
              <div
                @click="form.isActive = !form.isActive"
                :class="[
                  'relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer',
                  form.isActive ? 'bg-success' : 'bg-gray-300',
                ]"
              >
                <span :class="[
                  'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
                  form.isActive ? 'left-0.5 translate-x-5' : 'left-0.5',
                ]" />
              </div>
              <span class="text-sm font-medium" :class="form.isActive ? 'text-success' : 'text-text-secondary'">
                {{ form.isActive ? 'فعال' : 'غیرفعال' }}
              </span>
            </label>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-3">
          <AdminButton variant="ghost" class="flex-1" @click="closeModal">انصراف</AdminButton>
          <AdminButton :loading="saving" class="flex-1" @click="submit">
            {{ editingBrand ? 'ذخیره تغییرات' : 'ایجاد برند' }}
          </AdminButton>
        </div>
      </template>
    </AdminModal>

    <!-- Delete Confirm -->
    <AdminConfirm
      :modelValue="showDeleteConfirm"
      title="حذف برند"
      :message="`آیا از حذف برند «${deletingBrand?.name}» مطمئن هستید؟`"
      confirm-text="حذف"
      :loading="deleting"
      @confirm="doDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { brandService } from '@/services/brand.service'
import { useUiStore } from '@/stores/ui.store'
import AdminButton     from '@/components/common/AdminButton.vue'
import AdminTable      from '@/components/common/AdminTable.vue'
import AdminBadge      from '@/components/common/AdminBadge.vue'
import AdminModal      from '@/components/common/AdminModal.vue'
import AdminInput      from '@/components/common/AdminInput.vue'
import AdminTextarea   from '@/components/common/AdminTextarea.vue'
import AdminConfirm    from '@/components/common/AdminConfirm.vue'
import AdminPagination from '@/components/common/AdminPagination.vue'
import ImageUploader   from '@/views/products/components/ImageUploader.vue'

const ui = useUiStore()

const PER_PAGE    = 15
const brands      = ref([])
const loading     = ref(false)
const search      = ref('')
const filterActive = ref('')
const page        = ref(1)

const columns = [
  { key: 'name',      label: 'برند' },
  { key: 'isActive',  label: 'وضعیت' },
  { key: 'sortOrder', label: 'ترتیب' },
  { key: 'actions',   label: '', class: 'w-24' },
]

const filteredBrands = computed(() => {
  let list = brands.value
  if (search.value.trim())
    list = list.filter(b => b.name.includes(search.value.trim()))
  if (filterActive.value !== '')
    list = list.filter(b => String(b.isActive) === filterActive.value)
  return list
})

const totalPages  = computed(() => Math.ceil(filteredBrands.value.length / PER_PAGE))
const pagedBrands = computed(() =>
  filteredBrands.value.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE)
)
const total = computed(() => filteredBrands.value.length)

watch([search, filterActive], () => { page.value = 1 })

async function loadBrands() {
  loading.value = true
  try {
    const { data } = await brandService.getAll()
    brands.value = Array.isArray(data) ? data : []
  } catch {
    ui.addToast('خطا در بارگذاری برندها', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(loadBrands)

// ── Form ──────────────────────────────────────────────────────
const showModal    = ref(false)
const editingBrand = ref(null)
const saving       = ref(false)
const formImages   = ref([])
const errors       = reactive({ name: '' })

const form = reactive({
  name:        '',
  description: '',
  sortOrder:   0,
  isActive:    true,
})

function openCreate() {
  editingBrand.value = null
  form.name = form.description = ''
  form.sortOrder = 0
  form.isActive = true
  formImages.value = []
  errors.name = ''
  showModal.value = true
}

function openEdit(brand) {
  editingBrand.value = brand
  form.name        = brand.name        ?? ''
  form.description = brand.description ?? ''
  form.sortOrder   = brand.sortOrder   ?? 0
  form.isActive    = brand.isActive    ?? true
  formImages.value = brand.logo ? [{ original: { url: brand.logo }, thumbnail: { url: brand.logo } }] : []
  errors.name = ''
  showModal.value = true
}

function closeModal() { showModal.value = false }

async function submit() {
  errors.name = ''
  if (!form.name.trim() || form.name.length < 2) {
    errors.name = 'نام برند حداقل ۲ کاراکتر باشد'
    return
  }
  saving.value = true
  try {
    const dto = {
      name:        form.name.trim(),
      description: form.description.trim() || undefined,
      logo:        formImages.value[0]?.original?.url || undefined,
      sortOrder:   Number(form.sortOrder),
      isActive:    form.isActive,
    }
    if (editingBrand.value) {
      const { data } = await brandService.update(editingBrand.value._id, dto)
      const idx = brands.value.findIndex(b => b._id === editingBrand.value._id)
      if (idx !== -1) brands.value[idx] = data
      ui.addToast('برند ویرایش شد', 'success')
    } else {
      const { data } = await brandService.create(dto)
      brands.value.unshift(data)
      ui.addToast('برند ایجاد شد', 'success')
    }
    closeModal()
  } catch (err) {
    const msg = err.response?.data?.message
    ui.addToast(Array.isArray(msg) ? msg[0] : (msg ?? 'خطا در ذخیره'), 'error')
  } finally {
    saving.value = false
  }
}

// ── Delete ────────────────────────────────────────────────────
const showDeleteConfirm = ref(false)
const deletingBrand     = ref(null)
const deleting          = ref(false)

function confirmDelete(brand) {
  deletingBrand.value = brand
  showDeleteConfirm.value = true
}

async function doDelete() {
  deleting.value = true
  try {
    await brandService.remove(deletingBrand.value._id)
    brands.value = brands.value.filter(b => b._id !== deletingBrand.value._id)
    ui.addToast('برند حذف شد', 'success')
    showDeleteConfirm.value = false
  } catch (err) {
    const msg = err.response?.data?.message
    ui.addToast(msg ?? 'خطا در حذف برند', 'error')
  } finally {
    deleting.value = false
  }
}
</script>
