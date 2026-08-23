<template>
  <div>

    <!-- Header -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div class="flex items-center gap-3">
        <button @click="$router.back()"
          class="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-text-secondary hover:border-primary hover:text-primary transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
        <div>
          <h1 class="page-title">{{ isEdit ? 'ویرایش محصول' : 'محصول جدید' }}</h1>
          <p v-if="isEdit && form.name" class="text-text-secondary text-sm mt-0.5 truncate max-w-xs">
            {{ form.name }}
          </p>
        </div>
      </div>

    </div>

    <!-- Loading skeleton -->
    <div v-if="loadingProduct" class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div class="lg:col-span-2 space-y-4">
        <AdminSkeleton height="200px" class="rounded-xl" />
        <AdminSkeleton height="300px" class="rounded-xl" />
      </div>
      <div class="space-y-4">
        <AdminSkeleton height="150px" class="rounded-xl" />
        <AdminSkeleton height="120px" class="rounded-xl" />
      </div>
    </div>

    <!-- Form -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

      <!-- LEFT: main content -->
      <div class="lg:col-span-2 space-y-5">

        <!-- اطلاعات پایه -->
        <div class="admin-card">
          <h2 class="section-title mb-4 flex items-center gap-2">
            <span>📋</span> اطلاعات پایه
          </h2>
          <div class="space-y-4">

            <AdminInput
              v-model="form.name"
              label="نام محصول"
              placeholder="مثلاً: عینک آفتابی ری‌بن مدل آویاتور"
              required
              :error="errors.name"
            />

            <div>
              <label class="field-label">آدرس (Slug)</label>
              <input
                v-model="form.slug"
                dir="ltr"
                placeholder="rayban-aviator-sunglasses"
                :class="['field-input text-sm', slugError ? 'border-error focus:ring-error/20' : '']"
                @input="onSlugInput"
              />
              <p v-if="slugError" class="text-error text-xs mt-1">{{ slugError }}</p>
              <p v-else class="text-text-disabled text-xs mt-1">فقط حروف انگلیسی کوچک، اعداد و خط‌تیره (مثال: rayban-aviator)</p>
            </div>

            <AdminSelect
              v-model="form.categoryId"
              label="دسته‌بندی"
              placeholder="یک دسته انتخاب کنید"
              :options="categoryOptions"
              required
              :error="errors.categoryId"
            />

            <AdminSelect
              v-model="form.brandId"
              label="برند"
              :options="brandOptions"
            />

            <AdminTextarea
              v-model="form.description"
              label="توضیحات محصول"
              placeholder="ویژگی‌ها، جنس، مزایا و اطلاعات بیشتر درباره محصول را بنویسید..."
              :rows="5"
            />
          </div>
        </div>

        <!-- تنوع‌های محصول -->
        <div class="admin-card">
          <h2 class="section-title mb-4 flex items-center gap-2">
            <span>🎨</span> تنوع‌های محصول
            <span class="text-text-disabled font-normal text-xs mr-1">(حداقل یک تنوع الزامی است)</span>
          </h2>
          <VariantEditor
            v-model="form.variants"
            :errors="variantErrors"
            :frame-shapes="FRAME_SHAPE_OPTS"
            :frame-materials="FRAME_MATERIAL_OPTS"
            :product-images="productImageUrls"
          />
          <p v-if="errors.variants" class="text-error text-xs mt-2">{{ errors.variants }}</p>
        </div>

      </div>

      <!-- RIGHT: sidebar -->
      <div class="space-y-5">

        <!-- وضعیت -->
        <div class="admin-card">
          <h2 class="section-title mb-4 flex items-center gap-2">
            <span>⚙️</span> وضعیت
          </h2>
          <div class="space-y-2">
            <label
              v-for="opt in statusOptions"
              :key="opt.value"
              :class="[
                'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-150',
                form.status === opt.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-border/70',
              ]"
            >
              <input type="radio" :value="opt.value" v-model="form.status" class="accent-primary" />
              <div>
                <p class="text-sm font-medium text-text-primary">{{ opt.label }}</p>
                <p class="text-text-disabled text-xs">{{ opt.hint }}</p>
              </div>
            </label>
          </div>
        </div>

        <!-- تصاویر -->
        <div class="admin-card">
          <h2 class="section-title mb-4 flex items-center gap-2">
            <span>📸</span> تصاویر محصول
          </h2>
          <ImageUploader v-model="form.images" :max-images="8" />
        </div>

        <!-- تخفیف -->
        <div class="admin-card">
          <h2 class="section-title mb-4 flex items-center gap-2">
            <span>💸</span> تخفیف
          </h2>
          <div class="space-y-3">
            <div class="space-y-1.5">
              <label class="field-label">درصد تخفیف</label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="form.discountPct"
                  type="number" min="0" max="90" step="1"
                  class="field-input w-24 text-center font-fanum font-bold text-xl"
                  dir="ltr"
                  placeholder="0"
                />
                <span class="text-text-secondary text-sm">٪</span>
              </div>
              <p class="text-text-disabled text-xs">۰ = بدون تخفیف &mdash; حداکثر ۹۰٪</p>
            </div>

            <!-- Live preview -->
            <div v-if="form.discountPct > 0 && form.variants[0]?.comparePrice > 0"
              class="rounded-xl p-3 space-y-1.5 text-sm" style="background-color: var(--color-bg);">
              <div class="flex justify-between items-center">
                <span class="text-text-secondary">قیمت اصلی</span>
                <span class="font-fanum line-through text-text-secondary">
                  {{ formatPrice(form.variants[0].comparePrice) }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-text-secondary">قیمت پس از تخفیف</span>
                <span class="font-fanum text-success font-bold">
                  {{ formatPrice(form.variants[0].price) }}
                </span>
              </div>
            </div>

            <button v-if="form.discountPct > 0" type="button"
              class="text-xs text-error hover:underline"
              @click="form.discountPct = 0">
              ✕ حذف تخفیف
            </button>
          </div>
        </div>

        <!-- برچسب‌های دیگر -->
        <div class="admin-card">
          <h2 class="section-title mb-3 flex items-center gap-2">
            <span>🏷️</span> برچسب‌های دیگر
          </h2>
          <TagInput v-model="form.tags" :preset-tags="PRESET_TAGS" />
          <p class="text-text-disabled text-xs mt-2">برچسب‌هایی برای فیلتر و جستجو (مثلاً: UV400، پلاریزه)</p>
        </div>

        <!-- آمار (edit only) -->
        <div v-if="isEdit && originalProduct" class="admin-card">
          <h2 class="section-title mb-3">آمار محصول</h2>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-text-secondary">بازدید</span>
              <span class="font-fanum font-medium">{{ formatNumber(originalProduct.viewCount ?? 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-secondary">تعداد نظرات</span>
              <span class="font-fanum font-medium">{{ formatNumber(originalProduct.reviewCount ?? 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-secondary">میانگین امتیاز</span>
              <span class="font-fanum font-medium">{{ originalProduct.avgRating?.toFixed(1) ?? '—' }}</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- ── Sticky action bar ──────────────────────────────────── -->
    <div class="sticky bottom-0 z-40 mt-8 -mx-6">
      <div class="px-6 py-3 border-t border-border flex items-center gap-4"
           style="background-color: var(--color-card); backdrop-filter: blur(8px); box-shadow: 0 -4px 24px rgba(0,0,0,0.07);">

        <!-- Context (right side in RTL) -->
        <div class="flex items-center gap-3 min-w-0">

          <!-- Back button -->
          <button type="button"
            class="flex-shrink-0 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
            @click="$router.back()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
            </svg>
            <span class="hidden md:inline">بازگشت</span>
          </button>

          <span class="text-border select-none hidden md:block text-lg leading-none">|</span>

          <!-- Title -->
          <p class="text-sm text-text-primary font-medium truncate max-w-[140px] md:max-w-[240px] hidden sm:block">
            {{ isEdit ? (form.name || 'ویرایش محصول') : 'محصول جدید' }}
          </p>

          <!-- Status pill -->
          <Transition name="pill-fade" mode="out-in">
            <span v-if="savedRecently && !isDirty" key="saved"
              class="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/20 text-success text-xs font-medium whitespace-nowrap">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              ذخیره شد
            </span>
            <span v-else-if="isDirty" key="dirty"
              class="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium whitespace-nowrap">
              <span class="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0 animate-pulse" />
              ذخیره نشده
            </span>
          </Transition>
        </div>

        <!-- Spacer -->
        <div class="flex-1" />

        <!-- Action buttons (left side in RTL) -->
        <div class="flex items-center gap-2 flex-shrink-0">

          <!-- Draft -->
          <button type="button"
            :disabled="savingDraft || savingPublish"
            data-testid="btn-save-draft"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-text-secondary hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            @click="saveDraft">
            <svg v-if="savingDraft" class="w-3.5 h-3.5 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <svg v-else class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
            </svg>
            <span class="hidden sm:inline">ذخیره پیش‌نویس</span>
            <span class="sm:hidden">پیش‌نویس</span>
          </button>

          <!-- Publish / Save (primary CTA) -->
          <button type="button"
            :disabled="savingPublish || savingDraft"
            data-testid="btn-publish"
            class="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-[#171717] text-sm font-semibold hover:bg-primary-dark shadow-sm shadow-primary/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
            @click="publish">
            <svg v-if="savingPublish" class="w-3.5 h-3.5 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ isEdit ? 'ذخیره تغییرات' : 'انتشار محصول' }}
            <svg v-if="!savingPublish" class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productService }  from '@/services/product.service'
import { categoryService } from '@/services/category.service'
import { brandService }    from '@/services/brand.service'
import { useUiStore }      from '@/stores/ui.store'
import { formatNumber, formatPrice } from '@/utils/formatters'
import { frameAttributeService } from '@/services/frame-attribute.service'
import { translationService }   from '@/services/translation.service'
import { logger } from '@/utils/logger'
import { persianToSlug, slugFrom, sanitizeSlugInput, SLUG_RE } from '@/utils/slugUtils'

const CTX = 'ProductFormView'

const PRESET_TAGS = [
  // محافظت عدسی
  'UV400', 'UV100', 'پلاریزه', 'آنتی‌رفلکس', 'فتوکرومیک', 'ضدخش', 'ضداب', 'بلوکات',
  // جنس فریم
  'تیتانیوم', 'استیل', 'استات', 'TR90', 'کربن', 'فلکسیبل', 'سبک‌وزن',
  // کاربرد
  'آفتابی', 'طبی', 'اسپرت', 'ورزشی', 'ایمنی', 'کار با کامپیوتر',
  // مخاطب
  'مردانه', 'زنانه', 'بچگانه', 'یونیسکس',
  // سبک
  'کلاسیک', 'رترو', 'لوکس', 'مینیمال', 'اوورسایز',
  // ویژگی
  'دست‌ساز', 'اورجینال', 'تنظیم‌پذیر',
]

import ImageUploader from './components/ImageUploader.vue'
import VariantEditor from './components/VariantEditor.vue'
import TagInput      from './components/TagInput.vue'
import AdminInput    from '@/components/common/AdminInput.vue'
import AdminSelect   from '@/components/common/AdminSelect.vue'
import AdminTextarea from '@/components/common/AdminTextarea.vue'
import AdminButton   from '@/components/common/AdminButton.vue'
import AdminSkeleton from '@/components/common/AdminSkeleton.vue'

const route  = useRoute()
const router = useRouter()
const ui     = useUiStore()

const isEdit = computed(() => !!route.params.id)

const loadingProduct  = ref(false)
const savingDraft     = ref(false)
const savingPublish   = ref(false)
const categories      = ref([])
const brands          = ref([])
const FRAME_SHAPE_OPTS    = ref([])
const FRAME_MATERIAL_OPTS = ref([])
const originalProduct = ref(null)

const form = reactive({
  name:        '',
  slug:        '',
  description: '',
  categoryId:  '',
  brandId:     '',
  images:      [],
  variants:    [{ sku: '', price: 0, comparePrice: 0, costPrice: null, stock: 0, attributes: {} }],
  tags:        [],
  status:      'active',
  discountPct: 0,
})

// Stores the original (pre-discount) prices so changing discountPct multiple times
// always discounts from the true base, not from an already-reduced price.
let _priceBase = []

// When discountPct changes:
//   price     → becomes the discounted selling price (price × (1 − pct/100))
//   comparePrice → set to the original base price (shown crossed-out to customers)
// Guard: skip during fillForm so server-loaded values are not overwritten.
watch(() => form.discountPct, (pct, oldPct) => {
  if (_fillingForm) return
  const p       = Math.max(0, Math.min(90, Number(pct)    || 0))
  const wasZero = (Number(oldPct) || 0) === 0

  if (p > 0) {
    // Capture base prices on first non-zero entry (or when coming from 0).
    // In edit mode the variant already has comparePrice > price → use comparePrice as base.
    if (wasZero || !_priceBase.length) {
      _priceBase = form.variants.map(v => {
        const cp = Number(v.comparePrice)
        const pr = Number(v.price)
        return (cp > 0 && cp > pr) ? cp : pr
      })
    }
    form.variants.forEach((v, i) => {
      const base   = _priceBase[i] ?? Number(v.price)
      v.comparePrice = base
      v.price        = Math.round(base * (1 - p / 100))
    })
  } else {
    // Discount removed: restore original prices and clear comparePrice.
    form.variants.forEach((v, i) => {
      v.price        = _priceBase[i] ?? (Number(v.comparePrice) || Number(v.price))
      v.comparePrice = 0
    })
    _priceBase = []
  }
})

const errors        = reactive({})
const variantErrors = ref({})

const slugError = computed(() => {
  if (!form.slug) return ''
  return SLUG_RE.test(form.slug) ? '' : 'فقط حروف انگلیسی کوچک، اعداد و خط‌تیره مجاز است'
})

// true = slug is auto-derived from name; false = user manually typed it
let _slugAutoMode   = true
let _debounceTimer  = null

async function autoGenSlug(name) {
  if (!_slugAutoMode || !name?.trim()) return
  try {
    const en = await translationService.toEnglish(name.trim())
    if (_slugAutoMode) form.slug = slugFrom(en)
    logger.debug('Slug auto-generated', { name, slug: form.slug }, CTX)
  } catch {
    if (_slugAutoMode) form.slug = persianToSlug(name)
  }
}

watch(() => form.name, (name) => {
  if (!_slugAutoMode) return
  clearTimeout(_debounceTimer)
  _debounceTimer = setTimeout(() => autoGenSlug(name), 500)
})

function onSlugInput(e) {
  _slugAutoMode = false
  const sanitized = sanitizeSlugInput(e.target.value)
  if (sanitized !== e.target.value) e.target.value = sanitized
  form.slug = sanitized
  logger.debug('Slug edited', { slug: form.slug }, CTX)
}

// ── Dirty / saved state ───────────────────────────────────────
const isDirty       = ref(false)
const savedRecently = ref(false)
let   _savedTimer   = null
let   _fillingForm  = false

watch(form, () => { isDirty.value = true }, { deep: true })

function markSaved() {
  isDirty.value = false
  savedRecently.value = true
  clearTimeout(_savedTimer)
  _savedTimer = setTimeout(() => { savedRecently.value = false }, 3000)
}

// Normalized URL strings for VariantEditor image assignment
const productImageUrls = computed(() =>
  form.images
    .map(img => img?.original?.url || img?.url || (typeof img === 'string' ? img : null))
    .filter(Boolean)
)

const categoryOptions = computed(() =>
  categories.value.map(c => ({ value: c._id, label: c.name }))
)
const brandOptions = computed(() => [
  { value: '', label: '— بدون برند —' },
  ...brands.value.map(b => ({ value: b._id, label: b.name })),
])

const statusOptions = [
  { value: 'active',   label: 'فعال',       hint: 'محصول در سایت نمایش داده می‌شود' },
  { value: 'draft',    label: 'پیش‌نویس',   hint: 'ذخیره شده اما نمایش داده نمی‌شود' },
  { value: 'inactive', label: 'غیرفعال',    hint: 'مخفی و غیرقابل خرید' },
]

// ── Validation ────────────────────────────────────
function validate(targetStatus) {
  Object.keys(errors).forEach(k => delete errors[k])
  variantErrors.value = {}
  let valid = true

  if (!form.name.trim() || form.name.length < 3) {
    errors.name = 'نام محصول حداقل ۳ کاراکتر باشد'
    valid = false
  }
  if (form.slug && !SLUG_RE.test(form.slug)) {
    errors.slug = 'فقط حروف انگلیسی کوچک، اعداد و خط‌تیره مجاز است'
    valid = false
  }
  if (!form.categoryId) {
    errors.categoryId = 'دسته‌بندی الزامی است'
    valid = false
  }
  if (!form.variants.length) {
    errors.variants = 'حداقل یک تنوع الزامی است'
    valid = false
  }

  if (targetStatus === 'active') {
    form.variants.forEach((v, idx) => {
      const ve = {}
      if (!v.price || v.price <= 0) ve.price = 'قیمت فروش الزامی است'
      if (v.stock < 0)              ve.stock = 'موجودی نمی‌تواند منفی باشد'
      if (Object.keys(ve).length)   variantErrors.value[idx] = ve
    })
    if (Object.keys(variantErrors.value).length) valid = false
  }

  return valid
}

// ── Build DTO ─────────────────────────────────────
function buildDto(statusOverride) {
  return {
    name:        form.name.trim(),
    ...(form.slug ? { slug: form.slug } : {}),
    description: form.description.trim() || undefined,
    category:    form.categoryId,
    brand:       form.brandId || undefined,
    images:      form.images.map(img =>
      img?.original?.url || img?.url || (typeof img === 'string' ? img : null)
    ).filter(Boolean),
    thumbnail:   (() => {
      const first = form.images[0]
      if (!first) return undefined
      if (typeof first === 'string') return first
      // upload response: { thumbnail: { url }, original: { url } }
      if (first.thumbnail?.url) return first.thumbnail.url
      // string thumbnail (normalized from fillForm): { url, thumbnail: string }
      if (typeof first.thumbnail === 'string' && first.thumbnail) return first.thumbnail
      if (first.url)            return first.url
      if (first.original?.url)  return first.original.url
      return undefined
    })(),
    variants:    form.variants.map(v => ({
      ...(v._id ? { _id: v._id } : {}),
      sku:             v.sku?.trim() || '',
      price:           Number(v.price),
      comparePrice:    Number(v.comparePrice) > 0 ? Number(v.comparePrice) : 0,
      costPrice:       Number(v.costPrice) > 0 ? Number(v.costPrice) : null,
      stock:           Number(v.stock),
      images:          Array.isArray(v.images) ? v.images.filter(Boolean) : [],
      attributes:   Object.entries(v.attributes || {})
        .filter(([k, val]) => k && val)
        .map(([key, value]) => ({ key: String(key), value: String(value) })),
    })),
    tags: form.tags.filter(Boolean),
    status: statusOverride ?? form.status,
  }
}

// ── Save handlers ─────────────────────────────────
async function saveDraft() {
  if (!validate('draft')) return
  savingDraft.value = true
  try {
    const dto = buildDto('draft')
    if (isEdit.value) {
      await productService.update(route.params.id, dto)
      logger.info('Product draft updated', { id: route.params.id }, CTX)
      ui.addToast('پیش‌نویس ذخیره شد', 'success')
    } else {
      const { data } = await productService.create(dto)
      logger.info('Product created as draft', { id: data._id }, CTX)
      ui.addToast('محصول به صورت پیش‌نویس ذخیره شد', 'success')
      router.replace({ name: 'product-edit', params: { id: data._id } })
    }
    markSaved()
  } catch (err) {
    logger.error('Failed to save draft', err, { isEdit: isEdit.value }, CTX)
    ui.addToast(err.response?.data?.message ?? 'خطا در ذخیره', 'error')
  } finally {
    savingDraft.value = false
  }
}

async function publish() {
  if (!validate('active')) return
  savingPublish.value = true
  try {
    const dto = buildDto('active')
    if (isEdit.value) {
      await productService.update(route.params.id, dto)
      logger.info('Product updated and published', { id: route.params.id }, CTX)
      ui.addToast('محصول با موفقیت ذخیره شد ✓', 'success')
    } else {
      const { data } = await productService.create(dto)
      logger.info('Product created and published', { id: data?._id }, CTX)
      ui.addToast('محصول با موفقیت منتشر شد ✓', 'success')
      router.push({ name: 'products' })
    }
    markSaved()
  } catch (err) {
    logger.error('Failed to publish product', err, { isEdit: isEdit.value }, CTX)
    const msg = err.response?.data?.message
    if (Array.isArray(msg)) msg.forEach(m => ui.addToast(m, 'error'))
    else ui.addToast(msg ?? 'خطا در ذخیره محصول', 'error')
  } finally {
    savingPublish.value = false
  }
}

// ── Fill form from product ────────────────────────
function fillForm(p) {
  _fillingForm = true
  _slugAutoMode = false  // slug comes from server; don't overwrite on name changes
  form.name        = p.name        ?? ''
  form.slug        = p.slug        ?? ''
  form.description = p.description ?? ''
  form.categoryId  = p.category?._id  ?? p.category  ?? ''
  form.brandId     = p.brand?._id     ?? p.brand     ?? ''
  form.images      = (p.images ?? []).map((img, idx) => {
    if (typeof img !== 'string') return img
    const thumbnail = (idx === 0 && p.thumbnail) ? p.thumbnail : img
    return { url: img, thumbnail }
  })
  form.tags = p.tags ?? []
  form.status      = p.status      ?? 'draft'

  // Compute discountPct from existing variants (use highest comparePrice vs minPrice)
  const maxCompare = Math.max(0, ...(p.variants ?? []).filter(v => v.comparePrice > 0).map(v => v.comparePrice))
  const minPrice   = p.minPrice ?? 0
  form.discountPct = (maxCompare > minPrice && minPrice > 0)
    ? Math.round((1 - minPrice / maxCompare) * 100)
    : 0

  form.variants    = p.variants?.length
    ? p.variants.map(v => ({
        _id:             v._id,
        sku:             v.sku             ?? '',
        price:           v.price           ?? 0,
        comparePrice:    v.comparePrice    ?? 0,
        costPrice:       v.costPrice       ?? null,
        stock:           v.stock           ?? 0,
        images:          v.images          ?? [],
        attributes:   Array.isArray(v.attributes)
          ? Object.fromEntries(v.attributes.map(a => [a.key, a.value]))
          : (v.attributes ?? {}),
      }))
    : [{ sku: '', price: 0, comparePrice: 0, costPrice: null, stock: 0, attributes: {} }]

  // nextTick runs after all queued watchers — reset flags then
  nextTick(() => {
    _fillingForm = false
    isDirty.value = false
    savedRecently.value = false
  })
}

// ── Lifecycle ─────────────────────────────────────
onMounted(async () => {
  try {
    const [catRes, brandRes, shapeRes, matRes] = await Promise.allSettled([
      categoryService.getAll({ limit: 200 }),
      brandService.getAll(),
      frameAttributeService.getActive('frameShape'),
      frameAttributeService.getActive('frameMaterial'),
    ])
    if (catRes.status === 'fulfilled')
      categories.value = Array.isArray(catRes.value.data) ? catRes.value.data : (catRes.value.data?.items ?? [])
    if (brandRes.status === 'fulfilled')
      brands.value = Array.isArray(brandRes.value.data) ? brandRes.value.data : []
    if (shapeRes.status === 'fulfilled')
      FRAME_SHAPE_OPTS.value = Array.isArray(shapeRes.value.data) ? shapeRes.value.data : []
    if (matRes.status === 'fulfilled')
      FRAME_MATERIAL_OPTS.value = Array.isArray(matRes.value.data) ? matRes.value.data : []
  } catch { /* non-critical */ }

  if (isEdit.value) {
    loadingProduct.value = true
    try {
      const { data } = await productService.getById(route.params.id)
      originalProduct.value = data
      fillForm(data)
    } catch {
      ui.addToast('خطا در بارگذاری محصول', 'error')
      router.push({ name: 'products' })
    } finally {
      loadingProduct.value = false
    }
  }
})
</script>

<style scoped>
.pill-fade-enter-active,
.pill-fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.pill-fade-enter-from,
.pill-fade-leave-to     { opacity: 0; transform: translateY(4px); }
</style>
