<template>
  <div class="dfp">

    <!-- ── Page Header ── -->
    <div class="dfp-header">
      <RouterLink to="/discounts" class="dfp-back">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
        </svg>
      </RouterLink>
      <div class="dfp-header-text">
        <h1>{{ isEdit ? 'ویرایش تخفیف' : 'تخفیف جدید' }}</h1>
        <p>{{ isEdit ? `ویرایش: ${form.title}` : 'ایجاد تخفیف خودکار برای فروشگاه' }}</p>
      </div>
    </div>

    <div v-if="loadingForm" class="dfp-loading">
      <svg class="spin" width="32" height="32" fill="none" viewBox="0 0 24 24">
        <circle class="op25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>

    <form v-else @submit.prevent="submit" class="dfp-form">

      <!-- ── Section 1: اطلاعات پایه ── -->
      <div class="section-card">
        <div class="section-head">
          <div class="section-num">۱</div>
          <div>
            <h2 class="section-title">اطلاعات پایه</h2>
            <p class="section-desc">عنوان و توضیح مختصر برای تخفیف</p>
          </div>
        </div>
        <div class="section-body">
          <div class="field-group">
            <label class="fl">عنوان تخفیف <span class="req">*</span></label>
            <div class="input-wrap">
              <span class="input-icon">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M7 7h10M7 12h6M7 17h8"/>
                </svg>
              </span>
              <input v-model="form.title" type="text" dir="rtl"
                placeholder="مثال: جشنواره عید نوروز"
                class="fi" :class="{ 'fi--err': errors.title }"/>
            </div>
            <p v-if="errors.title" class="err-msg">{{ errors.title }}</p>
          </div>

          <div class="field-group">
            <label class="fl">توضیحات <span class="opt">اختیاری</span></label>
            <textarea v-model="form.description" dir="rtl" rows="2"
              placeholder="توضیح کوتاه برای مدیریت داخلی..."
              class="fi fi--textarea"/>
          </div>
        </div>
      </div>

      <!-- ── Section 2: مقدار تخفیف ── -->
      <div class="section-card">
        <div class="section-head">
          <div class="section-num">۲</div>
          <div>
            <h2 class="section-title">مقدار تخفیف</h2>
            <p class="section-desc">نوع و میزان تخفیف اعمال‌شده</p>
          </div>
        </div>
        <div class="section-body">
          <div class="type-toggle">
            <label class="type-btn" :class="{ 'type-btn--on': form.discountType === 'percentage' }">
              <input type="radio" v-model="form.discountType" value="percentage" class="sr-only"/>
              <span class="type-symbol">٪</span>
              درصدی
            </label>
            <label class="type-btn" :class="{ 'type-btn--on': form.discountType === 'fixed' }">
              <input type="radio" v-model="form.discountType" value="fixed" class="sr-only"/>
              <span class="type-symbol">T</span>
              مبلغ ثابت
            </label>
          </div>

          <div class="field-group mt-3">
            <label class="fl">
              {{ form.discountType === 'percentage' ? 'درصد تخفیف' : 'مبلغ تخفیف' }}
              <span class="req">*</span>
            </label>
            <div class="value-row">
              <div class="val-badge" :class="form.discountType === 'percentage' ? 'val-pct' : 'val-fix'">
                {{ form.discountType === 'percentage' ? '٪' : 'تومان' }}
              </div>
              <input v-model.number="form.value" type="number" min="0"
                :max="form.discountType === 'percentage' ? 100 : undefined"
                :placeholder="form.discountType === 'percentage' ? '20' : '50000'"
                class="fi val-input" :class="{ 'fi--err': errors.value }"
                dir="ltr"/>
            </div>
            <p v-if="errors.value" class="err-msg">{{ errors.value }}</p>
            <p v-else-if="form.value > 0 && form.discountType === 'percentage'" class="hint-text">
              {{ form.value }}٪ از قیمت کسر می‌شود
            </p>
          </div>

          <div v-if="form.discountType === 'percentage'" class="opt-field">
            <label class="fl">سقف تخفیف <span class="opt">اختیاری</span></label>
            <div class="value-row">
              <div class="val-badge val-fix">تومان</div>
              <input v-model.number="form.maxDiscountAmount" type="number" min="0"
                placeholder="بدون سقف" class="fi val-input" dir="ltr"/>
            </div>
            <p class="hint-text">حداکثر مبلغ تخفیف — اگر خالی باشد سقفی ندارد</p>
          </div>
        </div>
      </div>

      <!-- ── Section 3: بازه زمانی ── -->
      <div class="section-card section-card--timed">
        <div class="section-head">
          <div class="section-num section-num--red">۳</div>
          <div>
            <h2 class="section-title">بازه زمانی <span class="opt">اختیاری</span></h2>
            <p class="section-desc">اگر تاریخ وارد نشود، تخفیف بدون محدودیت اعمال می‌شود</p>
          </div>
        </div>
        <div class="section-body">
          <div class="date-grid">
            <PersianDatePicker
              v-model="form.startDate"
              label="تاریخ شروع"
              :required="false"
              :error="errors.startDate"
              placeholder="انتخاب تاریخ شروع"
            />
            <PersianDatePicker
              v-model="form.endDate"
              label="تاریخ پایان"
              :required="false"
              :min-date="form.startDate || ''"
              :error="errors.endDate"
              placeholder="انتخاب تاریخ پایان"
            />
          </div>
          <p v-if="dateRangeError" class="err-msg mt-2">{{ dateRangeError }}</p>
          <div v-if="dateDuration" class="duration-bar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            مدت اجرای تخفیف: <strong>{{ dateDuration }}</strong>
          </div>
        </div>
      </div>


      <!-- ── Section 4: هدف تخفیف ── -->
      <div class="section-card">
        <div class="section-head">
          <div class="section-num">۴</div>
          <div>
            <h2 class="section-title">هدف تخفیف <span class="req">*</span></h2>
            <p class="section-desc">تخفیف روی کدام محصولات اعمال می‌شود؟</p>
          </div>
        </div>
        <div class="section-body">

          <!-- همه محصولات toggle -->
          <div :class="['all-toggle', form.targetAll ? 'all-toggle--on' : '']"
               @click="form.targetAll = !form.targetAll">
            <div class="all-toggle-text">
              <span class="all-toggle-title">همه محصولات</span>
              <span class="all-toggle-sub">تخفیف بدون محدودیت برای همه اعمال می‌شود</span>
            </div>
            <div :class="['sw-track', form.targetAll ? 'sw-on' : 'sw-off']">
              <span :class="['sw-thumb', form.targetAll ? 'sw-thumb-on' : '']"/>
            </div>
          </div>

          <!-- دو پنل دسته‌بندی + برند -->
          <div v-if="!form.targetAll" class="target-panels">

            <!-- Panel: دسته‌بندی‌ها -->
            <div class="target-panel">
              <div class="panel-head">
                <span class="panel-icon">🗂️</span>
                <span class="panel-title">دسته‌بندی‌ها</span>
                <span v-if="form.targetIds.length" class="panel-badge">{{ form.targetIds.length }}</span>
              </div>
              <div class="panel-search">
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input v-model="categorySearch" type="text" dir="rtl" placeholder="جستجو..." class="panel-search-input"/>
              </div>
              <div v-if="loadingCategories" class="panel-loading">در حال بارگذاری...</div>
              <!-- tree view (no search active) -->
              <div v-else-if="!categorySearch.trim()" class="panel-list">
                <CategoryTreeNode
                  v-for="node in categoryTree"
                  :key="node._id"
                  :node="node"
                  :depth="0"
                  :selected-ids="form.targetIds"
                  @toggle="toggleCategory"
                />
                <p v-if="!categoryTree.length" class="hint-text p-2">دسته‌بندی یافت نشد</p>
              </div>
              <!-- flat search results -->
              <div v-else class="panel-list">
                <label v-for="cat in filteredCategories" :key="cat._id" class="panel-item" @click.prevent="toggleCategory(cat)">
                  <span class="panel-checkbox" :class="{ 'panel-checkbox--on': form.targetIds.includes(cat._id) }">
                    <svg v-if="form.targetIds.includes(cat._id)" width="9" height="9" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  </span>
                  <span class="panel-item-name">{{ cat.name }}</span>
                </label>
                <p v-if="!filteredCategories.length" class="hint-text p-2">موردی یافت نشد</p>
              </div>
            </div>

            <!-- divider -->
            <div class="panels-divider">
              <div class="divider-line"/>
              <span class="divider-label">و / یا</span>
              <div class="divider-line"/>
            </div>

            <!-- Panel: برندها -->
            <div class="target-panel">
              <div class="panel-head">
                <span class="panel-icon">🏷️</span>
                <span class="panel-title">برندها</span>
                <span v-if="form.brandIds.length" class="panel-badge">{{ form.brandIds.length }}</span>
              </div>
              <div class="panel-search">
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input v-model="brandSearch" type="text" dir="rtl" placeholder="جستجو..." class="panel-search-input"/>
              </div>
              <div v-if="loadingBrands" class="panel-loading">در حال بارگذاری...</div>
              <div v-else class="panel-list">
                <label v-for="brand in filteredBrands" :key="brand._id" class="panel-item">
                  <input type="checkbox" :value="brand._id" v-model="form.brandIds" class="sr-only"/>
                  <span class="panel-checkbox" :class="{ 'panel-checkbox--on': form.brandIds.includes(brand._id) }">
                    <svg v-if="form.brandIds.includes(brand._id)" width="9" height="9" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  </span>
                  <img v-if="brand.logo" :src="brand.logo" class="brand-logo"
                    @error="e => e.target.style.display='none'"/>
                  <span class="panel-item-name">{{ brand.name }}</span>
                </label>
                <p v-if="!filteredBrands.length" class="hint-text p-2">موردی یافت نشد</p>
              </div>
            </div>

          </div>

          <!-- خلاصه انتخاب -->
          <div v-if="!form.targetAll && (form.targetIds.length || form.brandIds.length)" class="target-summary">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>تخفیف روی</span>
            <template v-if="form.targetIds.length">
              <strong>{{ form.targetIds.length }} دسته‌بندی</strong>
            </template>
            <template v-if="form.targetIds.length && form.brandIds.length">
              <span>از</span>
            </template>
            <template v-if="form.brandIds.length">
              <strong>{{ form.brandIds.length }} برند</strong>
            </template>
            <span>اعمال می‌شود</span>
          </div>

          <!-- محصولات خاص -->
          <div class="specific-products-toggle" @click="showProductPicker = !showProductPicker">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M20 7H4a1 1 0 00-1 1v10a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1z"/>
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
            </svg>
            {{ showProductPicker ? 'بستن انتخاب محصولات خاص' : '+ یا محصولات خاص را انتخاب کنید' }}
            <span v-if="selectedProducts.length" class="panel-badge">{{ selectedProducts.length }}</span>
          </div>

          <div v-if="showProductPicker" class="product-picker-wrap">
            <div class="search-row">
              <div class="input-wrap flex-1">
                <span class="input-icon">
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </span>
                <input v-model="productSearch" type="text" dir="rtl"
                  placeholder="جستجوی محصول..." class="fi" @input="searchProducts"/>
              </div>
              <svg v-if="searchingProducts" class="spin flex-shrink-0" width="18" height="18" fill="none" viewBox="0 0 24 24">
                <circle class="op25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            </div>
            <div v-if="productResults.length" class="results-list">
              <div v-for="p in productResults" :key="p._id" class="result-item" @click="addProduct(p)">
                <img :src="p.thumbnail || p.images?.[0]" class="result-img"
                  @error="e => e.target.style.opacity='0'"/>
                <span class="result-name">{{ p.name }}</span>
                <svg v-if="selectedProductIds.has(p._id)" class="check-icon" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
            </div>
            <div v-if="selectedProducts.length" class="tags-wrap mt-2">
              <span v-for="p in selectedProducts" :key="p._id" class="tag">
                {{ p.name }}
                <button type="button" @click="removeProduct(p._id)" class="tag-remove">×</button>
              </span>
            </div>
          </div>

        </div>
      </div>

      <!-- ── Section 5: شرایط اختیاری ── -->
      <div class="section-card">
        <div class="section-head">
          <div class="section-num">۵</div>
          <div>
            <h2 class="section-title">شرایط <span class="opt">اختیاری</span></h2>
            <p class="section-desc">محدودیت‌های اعمال تخفیف</p>
          </div>
        </div>
        <div class="section-body">
          <div class="two-col">
            <div class="field-group">
              <label class="fl">حداقل مبلغ سبد (تومان)</label>
              <div class="input-wrap">
                <span class="input-icon">
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                  </svg>
                </span>
                <input v-model.number="form.minOrderAmount" type="number" min="0"
                  placeholder="بدون حداقل" class="fi" dir="ltr"/>
              </div>
            </div>
            <div class="field-group">
              <label class="fl">حداکثر تعداد استفاده</label>
              <div class="input-wrap">
                <span class="input-icon">
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                </span>
                <input v-model.number="form.maxUsageCount" type="number" min="1"
                  placeholder="نامحدود" class="fi" dir="ltr"/>
              </div>
            </div>
          </div>
          <div class="field-group mt-3">
            <label class="fl">حداقل تعداد سفارش <span class="opt">اختیاری</span></label>
            <div class="input-wrap" style="max-width:200px">
              <span class="input-icon">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
                </svg>
              </span>
              <input v-model.number="form.minQuantity" type="number" min="1"
                placeholder="مثال: 10" class="fi" dir="ltr"/>
            </div>
          </div>

          <div class="field-group mt-3">
            <label class="fl">اولویت <span class="opt">عدد بالاتر = اجرا اول</span></label>
            <div class="input-wrap" style="max-width:140px">
              <span class="input-icon">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M8 6l4-4 4 4"/><path d="M12 2v10.3"/><path d="M8 18l4 4 4-4"/><path d="M12 21.7V11.3"/>
                </svg>
              </span>
              <input v-model.number="form.priority" type="number" min="0"
                placeholder="0" class="fi" dir="ltr"/>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Submit ── -->
      <div class="submit-row">
        <RouterLink to="/discounts" class="cancel-btn">انصراف</RouterLink>
        <button type="submit" :disabled="saving" class="submit-btn">
          <svg v-if="saving" class="spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
            <circle class="op25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <svg v-else width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M5 13l4 4L19 7"/>
          </svg>
          {{ saving ? 'در حال ذخیره...' : isEdit ? 'ذخیره تغییرات' : 'ایجاد تخفیف' }}
        </button>
      </div>

    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { discountService } from '@/services/discount.service'
import { productService  } from '@/services/product.service'
import { categoryService } from '@/services/category.service.js'
import { brandService    } from '@/services/brand.service.js'
import { useUiStore } from '@/stores/ui.store'
import PersianDatePicker from '@/components/ui/PersianDatePicker.vue'
import CategoryTreeNode  from './components/CategoryTreeNode.vue'

const route  = useRoute()
const router = useRouter()
const ui     = useUiStore()

const isEdit      = computed(() => !!route.params.id)
const loadingForm = ref(false)
const saving      = ref(false)

const form = reactive({
  title:            '',
  description:      '',
  discountType:     'percentage',
  value:            0,
  maxDiscountAmount: null,
  startDate:        null,
  endDate:          null,
  targetAll:        true,
  targetIds:        [],
  brandIds:         [],
  minOrderAmount:   null,
  minQuantity:      null,
  maxUsageCount:    null,
  priority:         0,
})

const errors = reactive({
  title: '', value: '', startDate: '', endDate: '',
})

const dateRangeError = computed(() => {
  if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate))
    return 'تاریخ پایان باید بعد از تاریخ شروع باشد'
  return ''
})

const dateDuration = computed(() => {
  if (!form.startDate || !form.endDate) return ''
  const diff = new Date(form.endDate) - new Date(form.startDate)
  if (diff <= 0) return ''
  const totalMinutes = Math.floor(diff / 60000)
  const days    = Math.floor(totalMinutes / 1440)
  const hours   = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  const parts = []
  if (days)    parts.push(`${days} روز`)
  if (hours)   parts.push(`${hours} ساعت`)
  if (minutes && !days) parts.push(`${minutes} دقیقه`)
  return parts.join(' و ')
})

// Search filters
const categorySearch = ref('')
const brandSearch    = ref('')
const showProductPicker = ref(false)

const filteredCategories = computed(() =>
  categorySearch.value.trim()
    ? categoriesFlat.value.filter(c => c.name.includes(categorySearch.value))
    : []
)
const filteredBrands = computed(() =>
  brandSearch.value.trim()
    ? brands.value.filter(b => b.name.includes(brandSearch.value))
    : brands.value
)

// Products
const productSearch     = ref('')
const productResults    = ref([])
const searchingProducts = ref(false)
const selectedProducts  = ref([])
const selectedProductIds = computed(() => new Set(selectedProducts.value.map(p => p._id)))

let searchTimer = null
function searchProducts() {
  clearTimeout(searchTimer)
  if (!productSearch.value.trim()) { productResults.value = []; return }
  searchTimer = setTimeout(async () => {
    searchingProducts.value = true
    try {
      const { data } = await productService.getAll({ search: productSearch.value, limit: 20 })
      productResults.value = data?.products ?? []
    } finally { searchingProducts.value = false }
  }, 350)
}

function addProduct(p) {
  if (!selectedProductIds.value.has(p._id)) selectedProducts.value.push(p)
  form.targetIds = selectedProducts.value.map(x => x._id)
}

function removeProduct(id) {
  selectedProducts.value = selectedProducts.value.filter(p => p._id !== id)
  form.targetIds = selectedProducts.value.map(x => x._id)
}

// Categories
const categoryTree      = ref([])
const categoriesFlat    = ref([])
const loadingCategories = ref(false)

function flattenTree(nodes, acc = []) {
  for (const node of nodes) {
    acc.push(node)
    if (node.children?.length) flattenTree(node.children, acc)
  }
  return acc
}

function collectIds(node, acc = []) {
  acc.push(node._id)
  if (node.children?.length) node.children.forEach(c => collectIds(c, acc))
  return acc
}

function toggleCategory(node) {
  const ids = collectIds(node)
  const isOn = form.targetIds.includes(node._id)
  if (isOn) {
    const remove = new Set(ids)
    form.targetIds = form.targetIds.filter(id => !remove.has(id))
  } else {
    const existing = new Set(form.targetIds)
    ids.forEach(id => { if (!existing.has(id)) form.targetIds.push(id) })
  }
}

async function loadCategories() {
  loadingCategories.value = true
  try {
    const { data } = await categoryService.getTree()
    categoryTree.value   = Array.isArray(data) ? data : []
    categoriesFlat.value = flattenTree(categoryTree.value)
  } finally { loadingCategories.value = false }
}

// Brands
const brands        = ref([])
const loadingBrands = ref(false)

async function loadBrands() {
  loadingBrands.value = true
  try {
    const { data } = await brandService.getAll()
    brands.value = data?.brands ?? data ?? []
  } finally { loadingBrands.value = false }
}

const resolvedTargetType = computed(() => {
  if (form.targetAll) return 'all'
  const hasCats   = form.targetIds.length > 0
  const hasBrands = form.brandIds.length > 0
  const hasProds  = selectedProducts.value.length > 0
  if (hasProds) return 'products'
  if (hasCats && hasBrands) return 'brand_category'
  if (hasCats)   return 'categories'
  if (hasBrands) return 'brands'
  return 'all'
})

function validate() {
  let ok = true
  Object.keys(errors).forEach(k => errors[k] = '')
  if (!form.title.trim()) { errors.title = 'عنوان الزامی است'; ok = false }
  if (form.value == null || form.value < 0) { errors.value = 'مقدار الزامی است'; ok = false }
  if (dateRangeError.value) { errors.endDate = dateRangeError.value; ok = false }
  return ok
}

function buildPayload() {
  const tt = resolvedTargetType.value
  return {
    title:        form.title.trim(),
    description:  form.description.trim() || undefined,
    discountType: form.discountType,
    value:        Number(form.value),
    maxDiscountAmount: form.maxDiscountAmount || undefined,
    startDate:    form.startDate || undefined,
    endDate:      form.endDate   || undefined,
    targetType:   tt,
    targetIds:    (tt === 'categories' || tt === 'brand_category' || tt === 'products')
                    ? (tt === 'products' ? selectedProducts.value.map(p => p._id) : form.targetIds)
                    : undefined,
    brandIds:     (tt === 'brands' || tt === 'brand_category') ? form.brandIds : undefined,
    minOrderAmount: form.minOrderAmount || undefined,
    minQuantity:    form.minQuantity || undefined,
    maxUsageCount:  form.maxUsageCount || undefined,
    priority:       form.priority ?? 0,
  }
}

async function submit() {
  if (!validate()) return
  saving.value = true
  try {
    const payload = buildPayload()
    if (isEdit.value) {
      await discountService.update(route.params.id, payload)
      ui.addToast('تخفیف با موفقیت ویرایش شد', 'success')
    } else {
      await discountService.create(payload)
      ui.addToast('تخفیف با موفقیت ایجاد شد', 'success')
    }
    router.push('/discounts')
  } catch (err) {
    const msg = err.response?.data?.message
    if (Array.isArray(msg)) ui.addToast(msg.join(' | '), 'error')
    else ui.addToast(msg ?? 'خطا در ذخیره تخفیف', 'error')
  } finally {
    saving.value = false
  }
}

async function loadEdit() {
  if (!isEdit.value) return
  loadingForm.value = true
  try {
    const { data } = await discountService.getById(route.params.id)
    const tt = data.targetType ?? 'all'
    Object.assign(form, {
      title:            data.title,
      description:      data.description ?? '',
      discountType:     data.discountType,
      value:            data.value,
      maxDiscountAmount: data.maxDiscountAmount ?? null,
      startDate:        data.startDate ?? null,
      endDate:          data.endDate   ?? null,
      targetAll:        tt === 'all',
      targetIds:        (tt === 'categories' || tt === 'brand_category')
                          ? (data.targetIds ?? []).map(id => id.toString?.() ?? id)
                          : [],
      brandIds:         (tt === 'brands' || tt === 'brand_category')
                          ? (data.brandIds ?? []).map(id => id.toString?.() ?? id)
                          : [],
      minOrderAmount:   data.minOrderAmount ?? null,
      minQuantity:      data.minQuantity    ?? null,
      maxUsageCount:    data.maxUsageCount  ?? null,
      priority:         data.priority ?? 0,
    })
  } catch {
    ui.addToast('خطا در بارگذاری تخفیف', 'error')
    router.push('/discounts')
  } finally {
    loadingForm.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadEdit(), loadCategories(), loadBrands()])
})
</script>

<style scoped>
/* ── Page ── */
.dfp {
  max-width: 680px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
}

/* ── Header ── */
.dfp-header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 1.75rem;
}
.dfp-back {
  width: 36px; height: 36px;
  border-radius: 10px;
  border: 1.5px solid var(--color-border);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-secondary);
  transition: all 0.15s;
  flex-shrink: 0;
}
.dfp-back:hover { border-color: var(--color-primary); color: var(--color-primary); }
.dfp-header-text h1 {
  font-size: 1.2rem; font-weight: 800;
  color: var(--color-text-primary);
}
.dfp-header-text p {
  font-size: 0.75rem; color: var(--color-text-disabled); margin-top: 1px;
}

/* ── Loading ── */
.dfp-loading { display: flex; justify-content: center; padding: 5rem 0; }

/* ── Form ── */
.dfp-form { display: flex; flex-direction: column; gap: 1rem; }

/* ── Section cards ── */
.section-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  overflow: hidden;
}
.section-card--timed  { border-color: rgba(239,68,68,0.2); }

.section-head {
  display: flex; align-items: flex-start; gap: 0.875rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}
.section-num {
  width: 28px; height: 28px; border-radius: 8px;
  background: rgba(27,79,138,0.1); color: #1B4F8A;
  font-size: 0.78rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 1px;
}
.section-num--red  { background: rgba(239,68,68,0.1);  color: #ef4444; }
.section-num--blue { background: rgba(37,99,235,0.1);  color: #2563eb; }

.section-title { font-size: 0.88rem; font-weight: 700; color: var(--color-text-primary); }
.section-desc  { font-size: 0.72rem; color: var(--color-text-disabled); margin-top: 2px; }

.section-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0; }

/* ── Fields ── */
.field-group { margin-bottom: 1rem; }
.field-group:last-child { margin-bottom: 0; }

.fl {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.78rem; font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 0.45rem;
}
.req { color: #ef4444; }
.opt {
  font-size: 0.65rem; font-weight: 500;
  padding: 1px 7px; border-radius: 20px;
  background: var(--color-surface); color: var(--color-text-disabled);
  border: 1px solid var(--color-border);
}
.hint-text { font-size: 0.71rem; color: var(--color-text-disabled); margin-top: 0.3rem; }
.err-msg   { font-size: 0.74rem; color: #ef4444; margin-top: 0.3rem; }

.input-wrap { position: relative; display: flex; align-items: center; }
.input-icon {
  position: absolute; right: 10px;
  color: var(--color-text-disabled);
  display: flex; align-items: center; pointer-events: none;
}
.fi {
  width: 100%; height: 2.5rem; padding: 0 2rem 0 0.75rem;
  border: 1.5px solid var(--color-border); border-radius: 10px;
  background: var(--color-surface); color: var(--color-text-primary);
  font-size: 0.875rem; outline: none; font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.fi:focus {
  border-color: rgba(27,79,138,0.5);
  box-shadow: 0 0 0 3px rgba(27,79,138,0.08);
}
.fi--err { border-color: #ef4444; }
.fi--textarea { height: auto; padding: 0.6rem 2rem 0.6rem 0.75rem; resize: none; }
.fi--select { padding-right: 2rem; cursor: pointer; appearance: none; }

.opt-field {
  background: var(--color-surface);
  border: 1.5px dashed var(--color-border);
  border-radius: 10px; padding: 0.875rem;
  margin-top: 0.875rem;
}

/* ── Type toggle ── */
.type-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
.type-btn {
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  height: 2.4rem; border-radius: 9px; cursor: pointer;
  font-size: 0.82rem; font-weight: 700;
  border: 1.5px solid var(--color-border);
  color: var(--color-text-secondary);
  background: var(--color-surface);
  transition: all 0.15s;
}
.type-btn:hover { border-color: rgba(27,79,138,0.4); color: #1B4F8A; }
.type-btn--on { background: #1B4F8A; border-color: #1B4F8A; color: #fff; }
.type-symbol { font-size: 0.9rem; font-weight: 900; }

/* ── Value input ── */
.value-row { display: flex; align-items: stretch; }
.val-badge {
  display: flex; align-items: center; justify-content: center;
  padding: 0 0.7rem; flex-shrink: 0;
  font-size: 0.72rem; font-weight: 700;
  border-radius: 10px 0 0 10px;
  border: 1.5px solid;
}
.val-pct { background: rgba(99,102,241,0.1); color: #6366f1; border-color: rgba(99,102,241,0.3); }
.val-fix { background: rgba(245,158,11,0.1); color: #d97706; border-color: rgba(245,158,11,0.3); }
.val-input {
  border-radius: 0 10px 10px 0 !important;
  border-right: none !important;
  padding-right: 0.75rem !important;
}
.val-input.fi--err { border-color: #ef4444; }

/* ── Date ── */
.date-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.duration-bar {
  display: inline-flex; align-items: center; gap: 5px; flex-wrap: wrap;
  margin-top: 0.75rem; padding: 5px 12px; border-radius: 20px;
  font-size: 0.72rem; color: #16a34a;
  background: rgba(22,163,74,0.08); border: 1px solid rgba(22,163,74,0.2);
}
.duration-bar strong { font-weight: 700; }

/* ── Target: همه toggle ── */
.all-toggle {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.875rem 1rem; border-radius: 12px; cursor: pointer;
  border: 1.5px solid var(--color-border); background: var(--color-surface);
  transition: all 0.15s; margin-bottom: 0.875rem;
}
.all-toggle--on { border-color: rgba(22,163,74,0.3); background: rgba(22,163,74,0.05); }
.all-toggle-text { display: flex; flex-direction: column; gap: 2px; }
.all-toggle-title { font-size: 0.84rem; font-weight: 700; color: var(--color-text-primary); }
.all-toggle-sub   { font-size: 0.7rem; color: var(--color-text-disabled); }
.sw-track { position: relative; width: 40px; height: 22px; border-radius: 999px; transition: background 0.2s; flex-shrink: 0; }
.sw-on { background: #16a34a; }
.sw-off { background: #d1d5db; }
.sw-thumb { position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: transform 0.2s; display: block; }
.sw-thumb-on { transform: translateX(18px); }

/* ── Target panels ── */
.target-panels { display: grid; grid-template-columns: 1fr auto 1fr; gap: 0; }

.target-panel {
  border: 1.5px solid var(--color-border); border-radius: 12px; overflow: hidden;
}
.panel-head {
  display: flex; align-items: center; gap: 6px;
  padding: 0.6rem 0.875rem;
  background: var(--color-surface); border-bottom: 1px solid var(--color-border);
  font-size: 0.8rem; font-weight: 700; color: var(--color-text-primary);
}
.panel-icon { font-size: 0.95rem; line-height: 1; }
.panel-title { flex: 1; }
.panel-badge {
  font-size: 0.65rem; font-weight: 700;
  padding: 1px 7px; border-radius: 20px;
  background: #1B4F8A; color: white;
}
.panel-search {
  display: flex; align-items: center; gap: 6px;
  padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--color-border);
  color: var(--color-text-disabled);
}
.panel-search-input {
  flex: 1; font-size: 0.78rem; background: none; border: none;
  outline: none; color: var(--color-text-primary);
}
.panel-loading { padding: 0.75rem; font-size: 0.74rem; color: var(--color-text-disabled); }
.panel-list { max-height: 220px; overflow-y: auto; padding: 0.4rem; }

.panel-item {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.35rem 0.5rem; border-radius: 8px; cursor: pointer;
  font-size: 0.8rem; color: var(--color-text-secondary);
  transition: background 0.1s;
}
.panel-item:hover { background: var(--color-surface); color: var(--color-text-primary); }
.panel-checkbox {
  width: 16px; height: 16px; border-radius: 4px; flex-shrink: 0;
  border: 1.5px solid var(--color-border);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.panel-checkbox--on { background: #1B4F8A; border-color: #1B4F8A; }
.panel-item-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ── Divider ── */
.panels-divider {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; padding: 0 0.75rem; color: var(--color-text-disabled); font-size: 0.68rem;
}
.divider-line { width: 1px; flex: 1; background: var(--color-border); }
.divider-label { font-weight: 700; white-space: nowrap; }

/* ── Summary ── */
.target-summary {
  display: inline-flex; align-items: center; gap: 5px; flex-wrap: wrap;
  margin-top: 0.75rem; padding: 5px 12px; border-radius: 20px;
  font-size: 0.74rem; color: #1B4F8A;
  background: rgba(27,79,138,0.07); border: 1px solid rgba(27,79,138,0.2);
}
.target-summary strong { font-weight: 700; }

/* ── Specific products ── */
.specific-products-toggle {
  display: inline-flex; align-items: center; gap: 6px;
  margin-top: 0.875rem; padding: 5px 12px; border-radius: 20px; cursor: pointer;
  font-size: 0.74rem; font-weight: 600; color: var(--color-text-secondary);
  border: 1.5px dashed var(--color-border); transition: all 0.15s;
}
.specific-products-toggle:hover { border-color: rgba(27,79,138,0.4); color: #1B4F8A; }
.product-picker-wrap { margin-top: 0.75rem; }

.search-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
.results-list {
  border: 1px solid var(--color-border); border-radius: 10px;
  max-height: 160px; overflow-y: auto; margin-bottom: 0.75rem;
}
.result-item {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.5rem 0.75rem; cursor: pointer; font-size: 0.82rem;
  transition: background 0.1s;
}
.result-item:hover { background: var(--color-surface); }
.result-img { width: 28px; height: 28px; border-radius: 6px; object-fit: contain; border: 1px solid var(--color-border); }
.result-name { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.check-icon { width: 15px; height: 15px; color: #16a34a; flex-shrink: 0; }

.tags-wrap { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.tag {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.74rem; padding: 3px 10px; border-radius: 20px;
  background: rgba(27,79,138,0.1); color: #3B6FBE; border: 1px solid rgba(27,79,138,0.2);
}
.tag-remove { color: inherit; opacity: 0.6; font-size: 1rem; line-height: 1; cursor: pointer; }
.tag-remove:hover { opacity: 1; color: #ef4444; }
.brand-logo { width: 18px; height: 18px; object-fit: contain; border-radius: 3px; flex-shrink: 0; }

/* ── Two col ── */
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; }
.mt-3 { margin-top: 0.875rem; }

/* ── Submit ── */
.submit-row { display: flex; gap: 0.75rem; padding-top: 0.5rem; }
.submit-btn {
  flex: 1; height: 48px; border-radius: 13px;
  background: linear-gradient(135deg, #1B4F8A, #2563eb);
  color: white; font-size: 0.9rem; font-weight: 700;
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  box-shadow: 0 4px 16px rgba(27,79,138,0.35);
  transition: all 0.2s;
}
.submit-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(27,79,138,0.45); }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.cancel-btn {
  height: 48px; padding: 0 1.5rem; border-radius: 13px;
  border: 1.5px solid var(--color-border);
  color: var(--color-text-secondary); font-size: 0.875rem; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; background: var(--color-card);
}
.cancel-btn:hover { border-color: rgba(239,68,68,0.4); color: #ef4444; }

/* ── Utilities ── */
.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.op25 { opacity: 0.25; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }

@media (max-width: 540px) {
  .two-col     { grid-template-columns: 1fr; }
  .date-grid   { grid-template-columns: 1fr; }
  .target-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
