<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue"
        class="fixed inset-0 z-[70] flex items-center justify-center p-4"
        style="background: rgba(2,8,23,0.82); backdrop-filter: blur(8px);"
        @click.self="close">

        <!-- ═══ Modal container ═══ -->
        <div class="bulk-modal relative bg-card rounded-2xl w-full max-w-3xl flex flex-col overflow-hidden"
          style="max-height: 88vh;">

          <!-- ── Header ─────────────────────────────────── -->
          <div class="flex items-center justify-between px-6 py-4 flex-shrink-0 relative">
            <div class="header-line absolute bottom-0 left-0 right-0 h-px" />

            <div class="flex items-center gap-3">
              <div class="icon-badge w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/>
                </svg>
              </div>

              <div>
                <div class="flex items-center gap-2">
                  <h2 class="font-bold text-text-primary text-base">تخفیف گروهی</h2>
                  <Transition name="badge-pop">
                    <span v-if="targetProducts.length" data-testid="count-badge"
                      class="count-badge text-xs font-bold font-fanum px-2 py-0.5 rounded-full text-white">
                      {{ targetProducts.length }}
                    </span>
                  </Transition>
                </div>
                <p class="text-xs text-text-disabled mt-0.5">محصولات را انتخاب کنید، تخفیف تعیین کنید و اعمال کنید</p>
              </div>
            </div>

            <button data-testid="close-btn" @click="close"
              class="close-btn w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- ── Body ───────────────────────────────────── -->
          <div class="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">

            <!-- ═══ Product selector ═══ -->
            <div class="flex-1 flex flex-col min-h-0 overflow-hidden">

              <!-- Filter strip -->
              <div class="px-5 py-4 border-b border-border flex-shrink-0 filter-strip">
                <div class="flex items-center gap-1.5 mb-3">
                  <svg class="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                  </svg>
                  <span class="text-xs font-semibold text-primary">افزودن بر اساس فیلتر</span>
                </div>

                <div class="flex gap-2">
                  <select v-model="filterCategory" class="field-input text-sm flex-1 h-9 py-0 min-w-0">
                    <option value="">همه دسته‌ها</option>
                    <option v-for="c in categories" :key="c._id" :value="c._id">{{ c.name }}</option>
                  </select>
                  <select v-model="filterBrand" class="field-input text-sm flex-1 h-9 py-0 min-w-0">
                    <option value="">همه برندها</option>
                    <option v-for="b in brands" :key="b._id" :value="b._id">{{ b.name }}</option>
                  </select>
                  <button data-testid="filter-search-btn" @click="fetchFiltered"
                    :disabled="filterLoading || (!filterCategory && !filterBrand)"
                    class="filter-search-btn h-9 px-3.5 rounded-xl text-sm font-medium flex-shrink-0 flex items-center gap-1.5 disabled:opacity-40 transition-all">
                    <svg v-if="filterLoading" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    جستجو
                  </button>
                </div>

                <!-- Filter results -->
                <Transition name="slide-down">
                  <div v-if="filterSearched || filterLoading" class="mt-3">
                    <div v-if="filterLoading" class="flex items-center gap-2 text-xs text-text-disabled">
                      <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      در حال جستجو...
                    </div>
                    <div v-else-if="!filterResults.length" class="text-xs text-text-disabled">
                      هیچ محصولی با این فیلتر یافت نشد
                    </div>
                    <div v-else>
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-xs text-text-secondary font-fanum">
                          {{ filterResults.length }} محصول یافت شد
                          <span v-if="newInResults.length < filterResults.length" class="text-primary font-medium">
                            · {{ newInResults.length }} جدید
                          </span>
                        </span>
                        <button v-if="newInResults.length" @click="addAllFiltered"
                          class="text-xs text-primary hover:text-primary-light font-semibold flex items-center gap-1 transition-colors">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                            <path stroke-linecap="round" d="M12 4v16m8-8H4"/>
                          </svg>
                          افزودن همه جدید
                        </button>
                      </div>
                      <div class="space-y-1 max-h-32 overflow-y-auto">
                        <div v-for="p in filterResults" :key="p._id"
                          class="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-surface/60 transition-colors group">
                          <img :src="p.thumbnail || p.images?.[0]"
                            class="w-7 h-7 rounded-md object-contain border border-border bg-surface flex-shrink-0"
                            @error="e => e.target.style.opacity='0'" />
                          <span class="flex-1 text-xs text-text-primary truncate">{{ p.name }}</span>
                          <span v-if="existingIds.has(p._id)"
                            class="text-xs text-success flex items-center gap-0.5 flex-shrink-0 font-medium">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                              <path stroke-linecap="round" d="M5 13l4 4L19 7"/>
                            </svg>
                            در لیست
                          </span>
                          <button v-else @click="addSingle(p)"
                            class="w-6 h-6 rounded-md bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center flex-shrink-0 transition-all opacity-0 group-hover:opacity-100">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                              <path stroke-linecap="round" d="M12 4v16m8-8H4"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- Selected products area -->
              <div class="flex-1 overflow-y-auto">
                <!-- Empty state -->
                <div v-if="!targetProducts.length"
                  class="flex flex-col items-center justify-center h-full text-center py-12 px-8">
                  <div class="empty-icon-wrap w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                    <svg class="w-7 h-7 text-primary/30" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                  </div>
                  <p class="text-sm font-semibold text-text-secondary">هنوز محصولی انتخاب نشده</p>
                  <p class="text-xs text-text-disabled mt-1.5 leading-relaxed max-w-48">از فیلتر بالا دسته‌بندی یا برند را جستجو و اضافه کنید</p>
                </div>

                <!-- Product list -->
                <div v-else>
                  <!-- Sticky bar -->
                  <div class="flex items-center justify-between px-5 py-2.5 sticky top-0 z-10 product-list-header">
                    <span class="text-xs font-semibold text-text-secondary">
                      <span class="text-text-primary font-bold font-fanum">{{ targetProducts.length }}</span>
                      محصول انتخابی
                    </span>
                    <button data-testid="clear-all-btn" @click="targetProducts = []"
                      class="clear-btn text-xs flex items-center gap-1 transition-all">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                      پاک کردن همه
                    </button>
                  </div>

                  <TransitionGroup name="list" tag="div" class="divide-y divide-border/40">
                    <div v-for="p in targetProducts" :key="p._id"
                      class="product-row flex items-center gap-3 px-5 py-3 transition-colors group">
                      <img :src="p.thumbnail || p.images?.[0]"
                        class="product-thumb w-10 h-10 rounded-xl object-contain border border-border p-1 flex-shrink-0"
                        @error="e => e.target.style.opacity = '0'" />
                      <div class="flex-1 min-w-0">
                        <p class="text-sm text-text-primary truncate leading-tight font-medium">{{ p.name }}</p>
                        <div v-if="validDiscount" class="flex items-center gap-2 mt-1">
                          <span class="price-new text-xs font-fanum font-bold px-2 py-0.5 rounded-md">
                            {{ formatPrice(Math.round(p.minPrice * (1 - discountPct / 100))) }}
                          </span>
                          <span class="text-xs line-through text-text-disabled font-fanum">
                            {{ formatPrice(p.minPrice) }}
                          </span>
                        </div>
                        <p v-else class="text-xs text-text-disabled font-fanum mt-0.5">{{ formatPrice(p.minPrice) }}</p>
                      </div>
                      <button @click="removeProduct(p._id)"
                        class="remove-btn w-7 h-7 flex items-center justify-center rounded-lg transition-all opacity-0 group-hover:opacity-100 flex-shrink-0">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                          <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  </TransitionGroup>
                </div>
              </div>
            </div>

            <!-- ═══ Discount config panel ═══ -->
            <div class="discount-panel w-full md:w-64 flex-shrink-0 flex flex-col border-r border-border">
              <div class="flex-1 p-5 space-y-5 overflow-y-auto">

                <!-- Percentage display -->
                <div>
                  <p class="text-xs font-semibold text-text-secondary mb-3 flex items-center gap-1.5">
                    <span class="w-1 h-3 rounded-full bg-primary inline-block"></span>
                    درصد تخفیف
                  </p>

                  <div class="flex justify-center mb-5">
                    <div class="pct-box" :class="{ 'pct-box--active': discountPct > 0 }">
                      <input
                        v-model.number="discountPct"
                        data-testid="pct-input"
                        type="number" min="0" max="90" step="1" dir="ltr"
                        class="pct-input font-bold font-fanum text-center bg-transparent focus:outline-none w-full"
                      />
                      <span class="pct-symbol absolute left-3 top-1/2 -translate-y-1/2 text-xl font-bold select-none">٪</span>
                    </div>
                  </div>

                  <!-- Gradient slider -->
                  <input type="range" dir="ltr"
                    v-model.number="discountPct" min="0" max="90" step="1"
                    data-testid="pct-slider"
                    class="discount-slider w-full"
                    :style="{ '--fill': sliderFillPct }" />
                  <div class="flex justify-between text-xs text-text-disabled mt-1.5 font-fanum px-0.5">
                    <span>90</span><span>60</span><span>30</span><span>0</span>
                  </div>
                </div>

                <!-- Quick presets -->
                <div>
                  <p class="text-xs text-text-disabled mb-2.5">انتخاب سریع</p>
                  <div class="flex flex-wrap gap-2">
                    <button v-for="pct in [10, 20, 30, 50]" :key="pct"
                      @click="discountPct = pct"
                      class="preset-btn px-3.5 py-1.5 rounded-full text-xs font-fanum font-semibold transition-all"
                      :class="discountPct === pct ? 'preset-btn--active' : 'preset-btn--idle'">
                      {{ pct }}٪
                    </button>
                  </div>
                </div>

                <!-- Timed-mode toggle -->
                <div>
                  <div class="flex items-center justify-between mb-3">
                    <p class="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                      <span class="w-1 h-3 rounded-full bg-primary inline-block"></span>
                      تخفیف زمان‌دار
                    </p>
                    <button
                      data-testid="timed-toggle"
                      @click="timedMode = !timedMode"
                      class="timed-toggle-btn relative w-10 h-5 rounded-full transition-all flex-shrink-0"
                      :class="timedMode ? 'timed-toggle-btn--on' : 'timed-toggle-btn--off'">
                      <span class="timed-toggle-thumb absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                        :class="timedMode ? 'right-0.5' : 'left-0.5'" />
                    </button>
                  </div>

                  <Transition name="slide-down">
                    <div v-if="timedMode" class="timed-section space-y-3 rounded-xl p-3">
                      <!-- Title -->
                      <div>
                        <p class="text-xs text-text-disabled mb-1.5">عنوان تخفیف</p>
                        <input
                          v-model="discountTitle"
                          data-testid="timed-title"
                          type="text"
                          dir="rtl"
                          :placeholder="`تخفیف گروهی ${discountPct}٪`"
                          class="field-input text-sm w-full h-9 px-3 rounded-lg"
                        />
                      </div>
                      <!-- Start date -->
                      <div>
                        <p class="text-xs text-text-disabled mb-1.5">
                          تاریخ شروع <span class="text-danger">*</span>
                        </p>
                        <PersianDatePicker
                          v-model="startDate"
                          data-testid="timed-start"
                          placeholder="انتخاب تاریخ شروع"
                          :show-time="true"
                          class="w-full"
                        />
                      </div>
                      <!-- End date -->
                      <div>
                        <p class="text-xs text-text-disabled mb-1.5">
                          تاریخ پایان <span class="text-danger">*</span>
                        </p>
                        <PersianDatePicker
                          v-model="endDate"
                          data-testid="timed-end"
                          placeholder="انتخاب تاریخ پایان"
                          :show-time="true"
                          class="w-full"
                        />
                        <p v-if="endDate && startDate && new Date(endDate) <= new Date(startDate)"
                          class="text-xs text-danger mt-1">
                          تاریخ پایان باید بعد از تاریخ شروع باشد
                        </p>
                      </div>
                    </div>
                  </Transition>
                </div>

                <!-- Summary card -->
                <div class="summary-card rounded-xl p-4 space-y-3"
                  :class="{ 'summary-card--ready': targetProducts.length && discountPct > 0 }">
                  <div class="flex justify-between items-center">
                    <span class="text-xs text-text-secondary">محصولات</span>
                    <span class="summary-val text-sm font-fanum font-bold"
                      :class="targetProducts.length ? 'text-text-primary' : 'text-text-disabled'">
                      {{ targetProducts.length || '—' }}
                    </span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-xs text-text-secondary">تخفیف</span>
                    <span class="text-sm font-fanum font-bold transition-colors"
                      :class="discountPct > 0 ? 'text-primary' : 'text-text-disabled'">
                      {{ discountPct > 0 ? discountPct + '٪' : '—' }}
                    </span>
                  </div>
                  <div v-if="timedMode" class="flex justify-between items-center">
                    <span class="text-xs text-text-secondary">نوع</span>
                    <span class="text-xs font-semibold timed-badge px-2 py-0.5 rounded-full">زمان‌دار</span>
                  </div>

                  <template v-if="targetProducts.length && discountPct > 0">
                    <div class="summary-note pt-2.5 border-t border-border">
                      <p v-if="timedMode" class="text-xs text-primary leading-relaxed">
                        تخفیف زمان‌دار ثبت می‌شود و قیمت‌ها تغییر نمی‌کنند
                      </p>
                      <p v-else class="text-xs text-text-secondary leading-relaxed">
                        قیمت نهایی
                        <span class="text-success font-bold font-fanum">{{ discountPct }}٪</span>
                        پایین‌تر خواهد بود
                      </p>
                    </div>
                  </template>
                  <template v-else-if="targetProducts.length && discountPct === 0">
                    <div class="pt-2.5 border-t border-border">
                      <p class="text-xs text-warning leading-relaxed">تخفیف فعلی محصولات حذف می‌شود</p>
                    </div>
                  </template>
                </div>

              </div>

              <!-- Actions -->
              <div class="p-4 border-t border-border space-y-2.5 flex-shrink-0">
                <button data-testid="apply-btn"
                  @click="apply"
                  :disabled="!targetProducts.length || saving"
                  class="apply-btn w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                  :class="targetProducts.length && !saving ? 'apply-btn--ready' : 'apply-btn--disabled'">
                  <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  <svg v-else-if="targetProducts.length" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span>
                    {{ saving ? 'در حال اعمال...' : targetProducts.length ? `اعمال روی ${targetProducts.length} محصول` : 'محصولی انتخاب نشده' }}
                  </span>
                </button>

                <button @click="close"
                  class="cancel-btn w-full h-9 rounded-xl text-sm text-text-secondary transition-all">
                  انصراف
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter }            from 'vue-router'
import { productService } from '@/services/product.service'
import { useUiStore }     from '@/stores/ui.store'
import { formatPrice }    from '@/utils/formatters'
import { logger }         from '@/utils/logger'
import PersianDatePicker  from '@/components/ui/PersianDatePicker.vue'

const props = defineProps({
  modelValue:      { type: Boolean, default: false },
  initialProducts: { type: Array,   default: () => [] },
  categories:      { type: Array,   default: () => [] },
  brands:          { type: Array,   default: () => [] },
})
const emit   = defineEmits(['update:modelValue', 'applied'])
const ui     = useUiStore()
const router = useRouter()

const targetProducts = ref([])
const discountPct    = ref(10)
const filterCategory = ref('')
const filterBrand    = ref('')
const filterResults  = ref([])
const filterSearched = ref(false)
const filterLoading  = ref(false)
const saving         = ref(false)

// ── Timed-mode state ──────────────────────────────────────────────
const timedMode     = ref(false)
const discountTitle = ref('')
const startDate     = ref('')
const endDate       = ref('')

const timedValid = computed(() =>
  !timedMode.value || (!!startDate.value && !!endDate.value),
)

const validDiscount  = computed(() => discountPct.value > 0 && discountPct.value <= 90)
const existingIds    = computed(() => new Set(targetProducts.value.map(p => p._id)))
const newInResults   = computed(() => filterResults.value.filter(p => !existingIds.value.has(p._id)))
const sliderFillPct  = computed(() => `${Math.round((discountPct.value / 90) * 100)}%`)

watch(() => props.modelValue, (open) => {
  if (!open) return
  targetProducts.value = [...props.initialProducts]
  discountPct.value    = 10
  filterCategory.value = ''
  filterBrand.value    = ''
  filterResults.value  = []
  filterSearched.value = false
  timedMode.value      = false
  discountTitle.value  = ''
  startDate.value      = ''
  endDate.value        = ''
  logger.info('BulkDiscountModal opened', { initialCount: props.initialProducts.length }, 'BulkDiscountModal')
}, { immediate: true })

function close() {
  emit('update:modelValue', false)
}

async function fetchFiltered() {
  filterLoading.value  = true
  filterSearched.value = false
  try {
    const params = { limit: 200 }
    if (filterCategory.value) params.category = filterCategory.value
    if (filterBrand.value)    params.brand     = filterBrand.value
    const { data } = await productService.getAll(params)
    filterResults.value  = data?.products ?? []
    filterSearched.value = true
  } catch (err) {
    logger.error('BulkDiscountModal: fetchFiltered failed', err, {
      category: filterCategory.value,
      brand: filterBrand.value,
    }, 'BulkDiscountModal')
    ui.addToast('خطا در بارگذاری محصولات', 'error')
  } finally {
    filterLoading.value = false
  }
}

function addSingle(p) {
  if (!existingIds.value.has(p._id)) targetProducts.value.push(p)
}

function addAllFiltered() {
  targetProducts.value.push(...newInResults.value)
  filterResults.value  = []
  filterSearched.value = false
  filterCategory.value = ''
  filterBrand.value    = ''
}

function removeProduct(id) {
  targetProducts.value = targetProducts.value.filter(p => p._id !== id)
}

// datetime-local returns 'YYYY-MM-DDTHH:mm' — backend @IsDateString requires seconds
function toISOWithSeconds(dt) {
  return dt.length === 16 ? dt + ':00' : dt
}

async function apply() {
  if (!targetProducts.value.length) return
  const pct = Number(discountPct.value)
  if (pct < 0 || pct > 90) {
    ui.addToast('درصد تخفیف باید بین ۰ تا ۹۰ باشد', 'error')
    return
  }

  if (timedMode.value) {
    if (!startDate.value || !endDate.value) {
      ui.addToast('تاریخ شروع و پایان الزامی است', 'error')
      return
    }
    if (new Date(endDate.value) <= new Date(startDate.value)) {
      ui.addToast('تاریخ پایان باید بعد از تاریخ شروع باشد', 'error')
      return
    }
  }

  saving.value = true
  const mode = timedMode.value ? 'timed' : 'permanent'
  logger.info('BulkDiscountModal: applying discount', {
    productCount: targetProducts.value.length,
    discountPct:  pct,
    mode,
    ...(timedMode.value && { startDate: startDate.value, endDate: endDate.value }),
  }, 'BulkDiscountModal')

  try {
    const payload = {
      productIds:  targetProducts.value.map(p => p._id),
      discountPct: pct,
      ...(timedMode.value && {
        title:     discountTitle.value.trim() || `تخفیف گروهی ${pct}٪`,
        startDate: toISOWithSeconds(startDate.value),
        endDate:   toISOWithSeconds(endDate.value),
      }),
    }

    const { data } = await productService.bulkDiscount(payload)

    const msg = data.mode === 'timed'
      ? `تخفیف زمان‌دار ${pct}٪ برای ${data.updated} محصول ثبت شد`
      : pct === 0
        ? `تخفیف ${data.updated} محصول حذف شد`
        : `تخفیف ${pct}٪ روی ${data.updated} محصول اعمال شد`

    ui.addToast(msg, 'success')
    emit('applied', { productIds: targetProducts.value.map(p => p._id), discountPct: pct, mode: data.mode })
    close()

    // After timed discount, navigate to discounts list
    if (data.mode === 'timed') {
      router.push('/discounts')
    }
  } catch (err) {
    logger.error('BulkDiscountModal: apply failed', err, {
      productCount: targetProducts.value.length,
      discountPct:  pct,
      mode,
    }, 'BulkDiscountModal')
    ui.addToast(err.response?.data?.message ?? 'خطا در اعمال تخفیف', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
/* ── Modal enter/leave ────────────────────────────── */
.modal-enter-active { transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-leave-active { transition: all 0.18s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.96) translateY(8px); }

/* ── Badge pop ────────────────────────────────────── */
.badge-pop-enter-active { transition: all 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.4); }
.badge-pop-leave-active { transition: all 0.15s ease; }
.badge-pop-enter-from, .badge-pop-leave-to { opacity: 0; transform: scale(0.4); }

/* ── Filter slide ─────────────────────────────────── */
.slide-down-enter-active { transition: all 0.22s ease; }
.slide-down-leave-active { transition: all 0.15s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }

/* ── List items ───────────────────────────────────── */
.list-enter-active { transition: all 0.2s ease; }
.list-leave-active { transition: all 0.15s ease; position: absolute; width: 100%; }
.list-enter-from   { opacity: 0; transform: translateY(-10px); }
.list-leave-to     { opacity: 0; transform: translateX(16px); }
.list-move         { transition: transform 0.2s ease; }

/* ── Container glow ───────────────────────────────── */
.bulk-modal {
  box-shadow:
    0 0 0 1px rgba(27,79,138,0.18),
    0 24px 48px rgba(0,0,0,0.55),
    0 0 80px rgba(27,79,138,0.07);
}

/* ── Header accents ───────────────────────────────── */
.header-line {
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(27,79,138,0.5) 30%,
    rgba(59,111,190,0.5) 70%,
    transparent 100%
  );
}

.icon-badge {
  background: linear-gradient(135deg, #1B4F8A 0%, #3B6FBE 100%);
  box-shadow: 0 4px 12px rgba(27,79,138,0.4), 0 0 0 1px rgba(59,111,190,0.2);
}

.count-badge {
  background: linear-gradient(135deg, #1B4F8A, #3B6FBE);
  box-shadow: 0 2px 8px rgba(27,79,138,0.4);
}

.close-btn:hover {
  background: rgba(255,255,255,0.06);
  color: var(--color-text-primary);
}

/* ── Filter strip ─────────────────────────────────── */
.filter-strip {
  background: rgba(27,79,138,0.03);
}

.filter-search-btn {
  background: rgba(27,79,138,0.1);
  color: #3B6FBE;
  border: 1px solid rgba(27,79,138,0.2);
}
.filter-search-btn:hover:not(:disabled) {
  background: rgba(27,79,138,0.18);
  border-color: rgba(27,79,138,0.35);
}

/* ── Empty state ──────────────────────────────────── */
.empty-icon-wrap {
  background: rgba(27,79,138,0.07);
  border: 1px dashed rgba(27,79,138,0.2);
}

/* ── Product list sticky header ───────────────────── */
.product-list-header {
  background: color-mix(in srgb, var(--color-card) 95%, transparent);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--color-border);
}

.clear-btn {
  color: rgba(239,68,68,0.65);
}
.clear-btn:hover {
  color: rgb(239,68,68);
}

/* ── Product rows ─────────────────────────────────── */
.product-row:hover {
  background: rgba(27,79,138,0.04);
}

.product-thumb {
  background: rgba(255,255,255,0.04);
}

.price-new {
  background: rgba(16,185,129,0.12);
  color: #10B981;
}

.remove-btn {
  color: var(--color-text-disabled);
}
.remove-btn:hover {
  color: rgb(239,68,68);
  background: rgba(239,68,68,0.08);
}

/* ── Discount panel ───────────────────────────────── */
.discount-panel {
  background: linear-gradient(
    180deg,
    rgba(27,79,138,0.07) 0%,
    rgba(27,79,138,0.03) 45%,
    transparent 100%
  );
}

/* ── Percentage box ───────────────────────────────── */
.pct-box {
  position: relative;
  width: 7.5rem;
  height: 5rem;
  border-radius: 1rem;
  border: 2px solid var(--color-border);
  background: var(--color-card);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.25s, box-shadow 0.25s;
}
.pct-box--active {
  border-color: rgba(27,79,138,0.5);
  box-shadow:
    0 0 0 4px rgba(27,79,138,0.08),
    0 4px 20px rgba(27,79,138,0.18);
}

.pct-input {
  font-size: 2.5rem;
  line-height: 1;
  color: var(--color-text-primary);
  transition: color 0.2s;
  caret-color: #3B6FBE;
}
.pct-box--active .pct-input {
  background: linear-gradient(135deg, #1B4F8A, #60A5FA);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.pct-symbol {
  color: var(--color-text-disabled);
  transition: color 0.2s;
  font-size: 1.25rem;
}
.pct-box--active .pct-symbol {
  color: #3B6FBE;
}

/* ── Custom range slider ──────────────────────────── */
.discount-slider {
  appearance: none;
  -webkit-appearance: none;
  height: 6px;
  border-radius: 9999px;
  background: linear-gradient(
    to right,
    #1B4F8A 0%,
    #3B6FBE var(--fill, 11%),
    rgba(27,79,138,0.15) var(--fill, 11%),
    rgba(27,79,138,0.15) 100%
  );
  cursor: pointer;
  outline: none;
  transition: background 0.1s;
}
.discount-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1B4F8A 0%, #3B6FBE 100%);
  cursor: pointer;
  box-shadow: 0 0 0 3px rgba(27,79,138,0.2), 0 2px 6px rgba(0,0,0,0.4);
  transition: box-shadow 0.15s ease, transform 0.1s ease;
}
.discount-slider::-webkit-slider-thumb:hover {
  box-shadow: 0 0 0 5px rgba(27,79,138,0.25), 0 2px 10px rgba(0,0,0,0.5);
  transform: scale(1.12);
}
.discount-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #1B4F8A, #3B6FBE);
  cursor: pointer;
  box-shadow: 0 0 0 3px rgba(27,79,138,0.2);
}

/* ── Preset buttons ───────────────────────────────── */
.preset-btn {
  transition: all 0.15s ease;
}
.preset-btn--idle {
  border: 1.5px solid var(--color-border);
  color: var(--color-text-secondary);
  background: transparent;
}
.preset-btn--idle:hover {
  border-color: rgba(27,79,138,0.4);
  color: #3B6FBE;
  background: rgba(27,79,138,0.06);
}
.preset-btn--active {
  background: linear-gradient(135deg, #1B4F8A 0%, #3B6FBE 100%);
  border: 1.5px solid transparent;
  color: white;
  box-shadow: 0 3px 10px rgba(27,79,138,0.4);
  transform: translateY(-1px);
}

/* ── Summary card ─────────────────────────────────── */
.summary-card {
  border: 1px solid var(--color-border);
  background: rgba(255,255,255,0.015);
  transition: border-color 0.25s, box-shadow 0.25s;
}
.summary-card--ready {
  border-color: rgba(27,79,138,0.25);
  box-shadow: 0 0 20px rgba(27,79,138,0.07), inset 0 0 20px rgba(27,79,138,0.03);
}
.summary-note {
  border-top-color: rgba(27,79,138,0.15) !important;
}

/* ── Apply button ─────────────────────────────────── */
.apply-btn {
  transition: all 0.18s ease;
}
.apply-btn--disabled {
  background: rgba(255,255,255,0.04);
  color: var(--color-text-disabled);
  border: 1px solid var(--color-border);
  cursor: not-allowed;
}
.apply-btn--ready {
  background: linear-gradient(135deg, #1B4F8A 0%, #3B6FBE 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 16px rgba(27,79,138,0.4), 0 1px 0 rgba(255,255,255,0.1) inset;
}
.apply-btn--ready:hover {
  background: linear-gradient(135deg, #0F3D73 0%, #2A5FAA 100%);
  box-shadow: 0 6px 22px rgba(27,79,138,0.5);
  transform: translateY(-1px);
}
.apply-btn--ready:active {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(27,79,138,0.3);
}

/* ── Cancel button ────────────────────────────────── */
.cancel-btn {
  border: 1px solid var(--color-border);
  background: transparent;
}
.cancel-btn:hover {
  background: rgba(255,255,255,0.04);
  color: var(--color-text-primary);
  border-color: rgba(255,255,255,0.12);
}

/* ── Timed-mode toggle ────────────────────────────── */
.timed-toggle-btn--on  { background: linear-gradient(135deg, #1B4F8A, #3B6FBE); }
.timed-toggle-btn--off { background: rgba(255,255,255,0.1); }
.timed-toggle-thumb    { transition: left 0.18s ease, right 0.18s ease; }

/* ── Timed section ────────────────────────────────── */
.timed-section {
  border: 1px solid rgba(27,79,138,0.25);
  background: rgba(27,79,138,0.06);
}

.datetime-input {
  color-scheme: dark;
}
.datetime-input:focus {
  border-color: rgba(27,79,138,0.5);
  outline: none;
  box-shadow: 0 0 0 3px rgba(27,79,138,0.12);
}

/* ── Timed badge in summary ───────────────────────── */
.timed-badge {
  background: rgba(27,79,138,0.15);
  color: #3B6FBE;
  border: 1px solid rgba(27,79,138,0.25);
}

/* ── Danger color helper ──────────────────────────── */
.text-danger { color: #ef4444; }
</style>
