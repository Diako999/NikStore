<template>
  <AdminModal
    :modelValue="modelValue"
    :title="isEdit ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'"
    size="md"
    @close="close"
  >
    <div class="space-y-4">

      <AdminInput
        v-model="form.name"
        label="نام دسته‌بندی"
        placeholder="مثلاً: عینک آفتابی"
        required
        :error="errors.name"
      />

      <div>
        <label class="field-label">آدرس (Slug)</label>
        <div class="relative">
          <input
            :value="form.slug"
            dir="ltr"
            placeholder="auto-generated"
            class="field-input text-sm"
            :class="slugError ? 'border-error focus:ring-error/20' : ''"
            @input="onSlugInput"
          />
          <span
            v-if="slugAutoMode && !form.slug"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
            style="color: var(--color-text-disabled);"
          >خودکار</span>
        </div>
        <p v-if="slugError" class="text-error text-xs mt-1">{{ slugError }}</p>
        <p v-else class="text-xs mt-1" style="color: var(--color-text-disabled);">
          {{ slugAutoMode ? 'بر اساس نام تولید می‌شود' : 'دستی ویرایش شده' }}
        </p>
      </div>

      <AdminSelect
        v-model="form.parentId"
        label="دسته والد"
        placeholder="— دسته اصلی (بدون والد) —"
        :options="parentOptions"
      />

      <AdminTextarea
        v-model="form.description"
        label="توضیحات"
        placeholder="توضیح کوتاهی درباره این دسته..."
        :rows="3"
      />

      <div>
        <label class="field-label">تصویر دسته‌بندی</label>
        <ImageUploader v-model="formImages" :max-images="1" />
      </div>

      <!-- جنسیت -->
      <div>
        <label class="field-label mb-2 block">جنسیت (اختیاری)</label>
        <div class="grid grid-cols-5 gap-2">
          <button
            v-for="opt in GENDER_OPTS" :key="opt.value"
            type="button"
            @click="form.gender = form.gender === opt.value ? '' : opt.value"
            class="py-2 rounded-lg border text-xs font-medium transition-colors"
            :class="form.gender === opt.value
              ? 'border-primary bg-primary text-white'
              : 'border-border text-text-secondary hover:border-primary/50'"
          >{{ opt.label }}</button>
        </div>
        <p class="text-text-disabled text-xs mt-1.5">برای فیلتر جنسیت در فروشگاه استفاده می‌شود</p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <AdminInput
          v-model.number="form.order"
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
              ]" style="transform-origin: center;" />
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
        <AdminButton variant="ghost" class="flex-1" @click="close">انصراف</AdminButton>
        <AdminButton :loading="saving" class="flex-1" @click="submit">
          {{ isEdit ? 'ذخیره تغییرات' : 'ایجاد دسته‌بندی' }}
        </AdminButton>
      </div>
    </template>
  </AdminModal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { categoryService } from '@/services/category.service'
import { translationService } from '@/services/translation.service'
import { useUiStore }      from '@/stores/ui.store'
import { logger }          from '@/utils/logger'
import { persianToSlug, slugFrom, sanitizeSlugInput, SLUG_RE } from '@/utils/slugUtils'
import AdminModal    from '@/components/common/AdminModal.vue'
import AdminInput    from '@/components/common/AdminInput.vue'
import AdminSelect   from '@/components/common/AdminSelect.vue'
import AdminTextarea from '@/components/common/AdminTextarea.vue'
import AdminButton   from '@/components/common/AdminButton.vue'
import ImageUploader from '@/views/products/components/ImageUploader.vue'

const CTX = 'CategoryFormModal'

const props = defineProps({
  modelValue:    Boolean,
  category:      { type: Object, default: null },
  parentOptions: { type: Array,  default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'saved'])
const ui   = useUiStore()

const isEdit = computed(() => !!props.category)
const saving = ref(false)

const GENDER_OPTS = [
  { label: 'بدون',     value: ''       },
  { label: 'مردانه',   value: 'men'    },
  { label: 'زنانه',    value: 'women'  },
  { label: 'بچگانه',   value: 'kids'   },
  { label: 'یونیسکس',  value: 'unisex' },
]

const form = reactive({
  name:        '',
  slug:        '',
  parentId:    '',
  description: '',
  gender:      '',
  order:       0,
  isActive:    true,
})
const errors     = reactive({ name: '' })
const formImages = ref([])

// ── Slug auto-generation ─────────────────────────────────────────
const slugAutoMode = ref(true)
let _debounceTimer = null

const slugError = computed(() => {
  if (!form.slug) return ''
  return SLUG_RE.test(form.slug) ? '' : 'فقط حروف انگلیسی کوچک، اعداد و خط‌تیره مجاز است'
})

async function autoGenSlug(name) {
  if (!slugAutoMode.value || !name?.trim()) return
  try {
    const en = await translationService.toEnglish(name.trim())
    if (slugAutoMode.value) form.slug = slugFrom(en)
    logger.debug('Category slug auto-generated', { name, slug: form.slug }, CTX)
  } catch {
    if (slugAutoMode.value) form.slug = persianToSlug(name)
    logger.debug('Category slug fallback (transliteration)', { name, slug: form.slug }, CTX)
  }
}

watch(() => form.name, (name) => {
  if (!slugAutoMode.value) return
  clearTimeout(_debounceTimer)
  _debounceTimer = setTimeout(() => autoGenSlug(name), 500)
})

function onSlugInput(e) {
  slugAutoMode.value = false
  const sanitized = sanitizeSlugInput(e.target.value)
  if (sanitized !== e.target.value) e.target.value = sanitized
  form.slug = sanitized
  logger.debug('Category slug edited manually', { slug: form.slug }, CTX)
}

// ── Modal open/close ─────────────────────────────────────────────
watch(() => props.modelValue, (open) => {
  if (!open) return
  clearTimeout(_debounceTimer)
  if (props.category) {
    // Edit mode: slug comes from server, disable auto-generation
    slugAutoMode.value = false
    form.name        = props.category.name        ?? ''
    form.slug        = props.category.slug        ?? ''
    form.parentId    = props.category.parentId    ?? ''
    form.description = props.category.description ?? ''
    form.gender      = props.category.gender      ?? ''
    form.order       = props.category.sortOrder   ?? 0
    form.isActive    = props.category.isActive    ?? true
    formImages.value = props.category.image ? [props.category.image] : []
    logger.debug('Category form opened for edit', { id: props.category._id, slug: form.slug }, CTX)
  } else {
    // Create mode: enable auto-generation
    slugAutoMode.value = true
    form.name = form.slug = form.description = form.parentId = ''
    form.gender   = ''
    form.order    = 0
    form.isActive = true
    formImages.value = []
    logger.debug('Category form opened for create', {}, CTX)
  }
  errors.name = ''
})

async function submit() {
  errors.name = ''
  if (!form.name.trim() || form.name.length < 2) {
    errors.name = 'نام دسته‌بندی حداقل ۲ کاراکتر باشد'
    return
  }
  saving.value = true
  try {
    const dto = {
      name:        form.name.trim(),
      parent:      form.parentId || undefined,
      description: form.description.trim() || undefined,
      image:       formImages.value[0]?.original?.url || undefined,
      sortOrder:   Number(form.order),
      gender:      form.gender || '',
      isActive:    form.isActive,
      ...(form.slug ? { slug: form.slug } : {}),
    }
    let result
    if (isEdit.value) {
      logger.info('Updating category', { id: props.category._id, slug: dto.slug }, CTX)
      const { data } = await categoryService.update(props.category._id, dto)
      result = data
      ui.addToast('دسته‌بندی ویرایش شد', 'success')
    } else {
      logger.info('Creating category', { name: dto.name, slug: dto.slug }, CTX)
      const { data } = await categoryService.create(dto)
      result = data
      ui.addToast('دسته‌بندی ایجاد شد', 'success')
    }
    emit('saved', result)
    close()
  } catch (err) {
    const msg = err.response?.data?.message
    logger.error('Category save failed', err, { isEdit: isEdit.value }, CTX)
    ui.addToast(Array.isArray(msg) ? msg[0] : (msg ?? 'خطا در ذخیره'), 'error')
  } finally {
    saving.value = false
  }
}

function close() { emit('update:modelValue', false) }
</script>
