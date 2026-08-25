<template>
  <AdminModal
    :modelValue="modelValue"
    :title="isEdit ? 'ویرایش کد تخفیف' : 'کد تخفیف جدید'"
    size="lg"
    @close="$emit('update:modelValue', false)"
  >
    <div class="modal-body">

      <!-- ── Preview badge ── -->
      <div class="preview-wrap">
        <div :class="['preview-badge', form.code ? 'preview-active' : '']">
          <code class="preview-code">{{ form.code || 'SUMMER20' }}</code>
          <span v-if="previewLabel" class="preview-pill"
                :style="{ background: form.discountType === 'percentage' ? '#16a34a' : '#2563eb' }">
            {{ previewLabel }}
          </span>
        </div>
      </div>

      <!-- ── Section: کد تخفیف ── -->
      <div class="modal-section">
        <div class="section-head">
          <span class="section-icon">🏷️</span>
          <span class="section-label">کد تخفیف</span>
        </div>

        <div class="form-group">
          <label class="field-label">کد تخفیف <span class="req">*</span></label>
          <div class="code-row">
            <input
              v-model="form.code"
              type="text" dir="ltr"
              placeholder="مثلاً: SUMMER20"
              @input="form.code = form.code.toUpperCase().replace(/[^A-Z0-9\-]/g, '')"
              :class="['code-input', errors.code ? 'input-error' : '']"
            />
            <button type="button" class="gen-btn" @click="generateCode">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              تولید خودکار
            </button>
          </div>
          <p v-if="errors.code" class="field-error">{{ errors.code }}</p>
          <p v-else class="field-hint">فقط حروف انگلیسی، اعداد و خط‌تیره</p>
        </div>

        <div class="form-group">
          <AdminInput v-model="form.description" label="توضیحات" placeholder="مثلاً: تخفیف ویژه تابستان" />
          <p class="field-hint">اختیاری — برای یادآوری داخلی</p>
        </div>
      </div>

      <!-- ── Section: میزان تخفیف ── -->
      <div class="modal-section">
        <div class="section-head">
          <span class="section-icon">💰</span>
          <span class="section-label">میزان تخفیف</span>
        </div>

        <!-- Type toggle -->
        <div class="form-group">
          <label class="field-label">نوع تخفیف <span class="req">*</span></label>
          <div class="type-toggle">
            <button
              type="button"
              :class="['toggle-btn', form.discountType === 'percentage' ? 'toggle-active' : '']"
              @click="form.discountType = 'percentage'"
            >
              <span class="toggle-symbol">٪</span>
              درصدی
            </button>
            <button
              type="button"
              :class="['toggle-btn', form.discountType === 'fixed' ? 'toggle-active' : '']"
              @click="form.discountType = 'fixed'"
            >
              <span class="toggle-symbol">₮</span>
              مبلغ ثابت
            </button>
          </div>
        </div>

        <!-- Value -->
        <div class="form-group">
          <label class="field-label">
            {{ form.discountType === 'percentage' ? 'درصد تخفیف' : 'مبلغ تخفیف (تومان)' }}
            <span class="req">*</span>
          </label>
          <div class="value-wrap">
            <span :class="['val-badge', form.discountType === 'percentage' ? 'val-pct' : 'val-fix']">
              {{ form.discountType === 'percentage' ? '٪' : 'تومان' }}
            </span>
            <input
              v-model.number="form.value"
              type="number" min="1" dir="ltr"
              :max="form.discountType === 'percentage' ? 100 : undefined"
              :placeholder="form.discountType === 'percentage' ? '20' : '500000'"
              :class="['val-input', errors.value ? 'input-error' : '']"
            />
          </div>
          <p v-if="errors.value" class="field-error">{{ errors.value }}</p>
          <p v-else-if="valueHint" class="field-hint hint-green">{{ valueHint }}</p>
        </div>

        <!-- Max cap -->
        <div v-if="form.discountType === 'percentage'" class="form-group optional-group">
          <label class="field-label">
            سقف تخفیف
            <span class="badge-opt">اختیاری</span>
          </label>
          <div class="value-wrap">
            <span class="val-badge val-fix">تومان</span>
            <input v-model.number="form.maxDiscountAmount" type="number" min="0" dir="ltr"
                   placeholder="بدون سقف" class="val-input" />
          </div>
          <p class="field-hint">حداکثر مبلغ تخفیف — اگر خالی باشد سقفی وجود ندارد</p>
        </div>
      </div>

      <!-- ── Section: بازه زمانی ── -->
      <div class="modal-section">
        <div class="section-head">
          <span class="section-icon">📅</span>
          <span class="section-label">بازه زمانی</span>
          <span class="badge-opt">اختیاری</span>
        </div>

        <div class="date-row">
          <div class="form-group">
            <AdminDatePicker v-model="form.startDate" label="تاریخ شروع" placeholder="از ابتدا" />
          </div>
          <div class="date-sep">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </div>
          <div class="form-group">
            <AdminDatePicker v-model="form.endDate" label="تاریخ انقضا" placeholder="بدون انقضا" :error="errors.endDate" />
          </div>
        </div>

        <div v-if="dateRangeText" class="duration-bar">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {{ dateRangeText }}
          <template v-if="!form.endDate">
            <span class="dur-sep">·</span>
            <span>بدون انقضا</span>
          </template>
        </div>
        <p v-if="errors.endDate" class="field-error">{{ errors.endDate }}</p>
      </div>

      <!-- ── Section: شرایط اعمال ── -->
      <div class="modal-section">
        <div class="section-head">
          <span class="section-icon">⚙️</span>
          <span class="section-label">شرایط اعمال</span>
          <span class="badge-opt">اختیاری</span>
        </div>

        <div class="two-col">
          <div class="form-group">
            <label class="field-label">حداقل مبلغ سبد</label>
            <div class="value-wrap">
              <span class="val-badge val-fix">تومان</span>
              <input v-model.number="form.minOrderAmount" type="number" min="0" dir="ltr"
                     placeholder="بدون محدودیت" class="val-input" />
            </div>
          </div>
          <div class="form-group">
            <label class="field-label">سقف تعداد استفاده</label>
            <input v-model.number="form.maxUsageCount" type="number" min="1" dir="ltr"
                   placeholder="نامحدود" class="field-input" />
          </div>
        </div>
        <div class="form-group">
          <label class="field-label">حداقل تعداد سفارش</label>
          <input v-model.number="form.minQuantity" type="number" min="1" dir="ltr"
                 placeholder="بدون محدودیت" class="field-input" />
        </div>
      </div>

      <!-- ── Status toggle ── -->
      <div :class="['status-toggle', form.isActive ? 'status-on' : 'status-off']"
           @click="form.isActive = !form.isActive">
        <div>
          <p class="status-title" :class="form.isActive ? 'status-title-on' : ''">
            {{ form.isActive ? 'کد تخفیف فعال است' : 'کد تخفیف غیرفعال است' }}
          </p>
          <p class="status-sub">
            {{ form.isActive ? 'مشتریان می‌توانند این کد را استفاده کنند' : 'این کد در حال حاضر قابل استفاده نیست' }}
          </p>
        </div>
        <div :class="['sw-track', form.isActive ? 'sw-on' : 'sw-off']">
          <span :class="['sw-thumb', form.isActive ? 'sw-thumb-on' : '']" />
        </div>
      </div>

    </div>

    <template #footer>
      <div class="modal-footer">
        <AdminButton variant="ghost" class="footer-btn" @click="$emit('update:modelValue', false)">
          انصراف
        </AdminButton>
        <AdminButton :loading="saving" class="footer-btn" @click="submit">
          {{ isEdit ? 'ذخیره تغییرات' : 'ایجاد کد تخفیف' }}
        </AdminButton>
      </div>
    </template>
  </AdminModal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { discountService } from '@/services/discount.service'
import { useUiStore }      from '@/stores/ui.store'
import { formatPrice }     from '@/utils/formatters'
import AdminModal      from '@/components/common/AdminModal.vue'
import AdminInput      from '@/components/common/AdminInput.vue'
import AdminButton     from '@/components/common/AdminButton.vue'
import AdminDatePicker from '@/components/common/AdminDatePicker.vue'

const props = defineProps({
  modelValue: Boolean,
  discount:   { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'saved'])
const ui   = useUiStore()

const isEdit = computed(() => !!props.discount)
const saving = ref(false)

const form = reactive({
  code: '', description: '',
  discountType: 'percentage', value: null,
  maxDiscountAmount: null, minOrderAmount: null,
  minQuantity: null, maxUsageCount: null,
  startDate: '', endDate: '',
  isActive: true,
})
const errors = reactive({ code: '', value: '', endDate: '' })

// ── Jalali date conversion ──
const _jalaliFmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
  year: 'numeric', month: '2-digit', day: '2-digit',
})
function toJalali(isoStr) {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return ''
    return _jalaliFmt.format(d)
  } catch { return '' }
}

// ── Computeds ──
const previewLabel = computed(() => {
  if (!form.value) return ''
  return form.discountType === 'percentage'
    ? `${form.value}٪ تخفیف`
    : `${formatPrice(form.value)} تومان`
})

const valueHint = computed(() => {
  const v = form.value
  if (!v || v <= 0) return ''
  if (form.discountType === 'percentage') {
    if (v > 100) return ''
    return `تخفیف ${v}٪ اعمال خواهد شد`
  }
  return `${Number(v).toLocaleString('fa-IR')} تومان از قیمت کسر می‌شود`
})

const dateRangeText = computed(() => {
  const s = toJalali(form.startDate)
  const e = toJalali(form.endDate)
  if (!s && !e) return ''
  if (s && !e) return `از ${s}`
  if (!s && e) return `تا ${e}`
  return `از ${s} تا ${e}`
})

// ── Watchers ──
watch(() => props.modelValue, (open) => {
  if (!open) return
  Object.keys(errors).forEach(k => (errors[k] = ''))
  if (props.discount) {
    const d = props.discount
    form.code              = d.code              ?? ''
    form.description       = d.description       ?? ''
    form.discountType      = d.discountType      ?? 'percentage'
    form.value             = d.value             ?? null
    form.maxDiscountAmount = d.maxDiscountAmount ?? null
    form.minOrderAmount    = d.minOrderAmount    ?? null
    form.minQuantity       = d.minQuantity       ?? null
    form.maxUsageCount     = d.maxUsageCount     ?? null
    form.startDate         = d.startDate ? d.startDate.slice(0, 10) : ''
    form.endDate           = d.endDate   ? d.endDate.slice(0, 10)   : ''
    form.isActive          = d.isActive  ?? true
  } else {
    form.code = form.description = form.startDate = form.endDate = ''
    form.discountType = 'percentage'
    form.value = null
    form.maxDiscountAmount = form.minOrderAmount = form.minQuantity = form.maxUsageCount = null
    form.isActive = true
  }
})

// ── Helpers ──
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  form.code = Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

function validate() {
  Object.keys(errors).forEach(k => (errors[k] = ''))
  let ok = true
  if (!form.code.trim() || form.code.length < 3) {
    errors.code = 'کد حداقل ۳ کاراکتر باشد'
    ok = false
  }
  if (!form.value || form.value <= 0) {
    errors.value = 'مقدار تخفیف الزامی است'
    ok = false
  }
  if (form.discountType === 'percentage' && form.value > 100) {
    errors.value = 'درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد'
    ok = false
  }
  if (form.startDate && form.endDate && form.endDate <= form.startDate) {
    errors.endDate = 'تاریخ انقضا باید بعد از تاریخ شروع باشد'
    ok = false
  }
  return ok
}

async function submit() {
  if (!validate()) return
  saving.value = true
  try {
    const dto = {
      title:             form.code.trim(),
      code:              form.code.trim(),
      description:       form.description.trim() || undefined,
      discountType:      form.discountType,
      value:             Number(form.value),
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
      minOrderAmount:    form.minOrderAmount    ? Number(form.minOrderAmount)    : undefined,
      minQuantity:       form.minQuantity       ? Number(form.minQuantity)       : undefined,
      maxUsageCount:     form.maxUsageCount     ? Number(form.maxUsageCount)     : undefined,
      targetType:        'all',
      startDate:         form.startDate || undefined,
      endDate:           form.endDate   || undefined,
      isActive:          form.isActive,
    }
    let result
    if (isEdit.value) {
      const { data } = await discountService.update(props.discount._id, dto)
      result = data
      ui.addToast('کد تخفیف ویرایش شد', 'success')
    } else {
      const { data } = await discountService.create(dto)
      result = data
      ui.addToast('کد تخفیف ایجاد شد', 'success')
    }
    emit('saved', result)
    emit('update:modelValue', false)
  } catch (err) {
    const msg = err.response?.data?.message
    ui.addToast(Array.isArray(msg) ? msg[0] : (msg ?? 'خطا در ذخیره'), 'error')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
/* ── Modal body ── */
.modal-body { display: flex; flex-direction: column; gap: 0.875rem; }

/* ── Preview badge ── */
.preview-wrap { display: flex; justify-content: center; padding: 0.25rem 0 0.5rem; }
.preview-badge {
  display: inline-flex; align-items: center; gap: 0.75rem;
  padding: 0.6rem 1.25rem; border-radius: 14px;
  border: 2px dashed var(--color-border);
  background: var(--color-surface);
  transition: all 0.2s;
}
.preview-active {
  border-color: rgba(27,79,138,0.4) !important;
  background: rgba(27,79,138,0.05) !important;
}
.preview-code {
  font-family: monospace; font-weight: 900; letter-spacing: 0.12em;
  font-size: 1rem; color: var(--color-text-primary);
}
.preview-active .preview-code { color: var(--color-primary); }
.preview-pill {
  font-size: 0.7rem; font-weight: 700;
  padding: 0.15rem 0.5rem; border-radius: 20px; color: #fff;
}

/* ── Sections ── */
.modal-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1rem 1rem 0.5rem;
}

.section-head {
  display: flex; align-items: center; gap: 0.45rem;
  margin-bottom: 0.875rem;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid var(--color-border);
}
.section-icon  { font-size: 0.95rem; line-height: 1; }
.section-label { font-size: 0.82rem; font-weight: 700; color: var(--color-text-primary); }

.form-group { margin-bottom: 0.75rem; }

.field-label {
  display: flex; align-items: center; gap: 0.3rem;
  font-size: 0.78rem; font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.35rem;
}
.req        { color: #ef4444; }
.field-hint { font-size: 0.72rem; color: var(--color-text-secondary); margin-top: 0.25rem; }
.hint-green { color: #16a34a !important; }
.field-error { font-size: 0.72rem; color: #ef4444; margin-top: 0.2rem; }

.badge-opt {
  font-size: 0.65rem; font-weight: 500;
  padding: 1px 6px; border-radius: 20px;
  background: var(--color-card); color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  margin-right: auto;
}

.optional-group {
  background: var(--color-card);
  border: 1px dashed var(--color-border);
  border-radius: 8px; padding: 0.65rem;
  margin-bottom: 0.5rem;
}

/* ── Code input ── */
.code-row { display: flex; gap: 0.5rem; }
.code-input {
  flex: 1; padding: 0.5rem 0.75rem;
  border: 1.5px solid var(--color-border); border-radius: 8px;
  font-family: monospace; font-weight: 700; letter-spacing: 0.1em;
  font-size: 0.9rem; text-transform: uppercase;
  background: var(--color-card); color: var(--color-text-primary);
  outline: none; transition: border-color 0.15s;
}
.code-input:focus { border-color: var(--color-primary); }
.gen-btn {
  display: flex; align-items: center; gap: 0.35rem;
  padding: 0.5rem 0.75rem; border-radius: 8px; white-space: nowrap;
  font-size: 0.78rem; font-weight: 600; cursor: pointer;
  background: var(--color-card); color: var(--color-text-secondary);
  border: 1.5px solid var(--color-border); transition: all 0.15s;
}
.gen-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: rgba(27,79,138,0.05);
}

.field-input {
  width: 100%; padding: 0.5rem 0.75rem;
  border: 1.5px solid var(--color-border); border-radius: 8px;
  font-size: 0.875rem; background: var(--color-card);
  color: var(--color-text-primary); outline: none; font-family: inherit;
  transition: border-color 0.15s;
}
.field-input:focus { border-color: var(--color-primary); }

.input-error { border-color: #ef4444 !important; }

/* ── Type toggle ── */
.type-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; }
.toggle-btn {
  display: flex; align-items: center; justify-content: center; gap: 0.35rem;
  padding: 0.55rem 0.75rem; border-radius: 8px;
  font-size: 0.82rem; font-weight: 600; cursor: pointer;
  transition: all 0.15s;
  background: var(--color-card); color: var(--color-text-secondary);
  border: 1.5px solid var(--color-border);
}
.toggle-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.toggle-active {
  background: var(--color-primary) !important;
  color: #fff !important;
  border-color: var(--color-primary) !important;
}
.toggle-symbol { font-size: 0.95rem; font-weight: 700; line-height: 1; }

/* ── Value input with prefix ── */
.value-wrap { display: flex; align-items: stretch; }
.val-badge {
  display: flex; align-items: center; justify-content: center;
  padding: 0 0.6rem; flex-shrink: 0;
  font-size: 0.72rem; font-weight: 700;
  border-radius: 8px 0 0 8px; border: 1.5px solid; border-left: none;
}
.val-pct { background: rgba(99,102,241,0.1); color: #6366f1; border-color: rgba(99,102,241,0.3); }
.val-fix { background: rgba(245,158,11,0.1); color: #d97706; border-color: rgba(245,158,11,0.3); }
.val-input {
  flex: 1; padding: 0.5rem 0.75rem;
  border: 1.5px solid var(--color-border);
  border-radius: 0 8px 8px 0; border-right: none;
  font-size: 0.875rem; background: var(--color-card);
  color: var(--color-text-primary); outline: none; font-family: inherit;
  transition: border-color 0.15s;
}
.val-input:focus { border-color: var(--color-primary); }
.val-input.input-error { border-color: #ef4444; }

/* ── Date range ── */
.date-row {
  display: grid; grid-template-columns: 1fr auto 1fr;
  gap: 0.5rem; align-items: end;
}
.date-sep {
  display: flex; align-items: center; justify-content: center;
  padding-bottom: 0.4rem; color: var(--color-text-secondary);
}

.duration-bar {
  display: inline-flex; align-items: center; gap: 0.35rem;
  flex-wrap: wrap;
  margin-top: 0.5rem; margin-bottom: 0.25rem;
  font-size: 0.72rem; font-weight: 500;
  color: #2563eb;
  background: rgba(37,99,235,0.07);
  border: 1px solid rgba(37,99,235,0.18);
  padding: 0.25rem 0.6rem; border-radius: 20px;
}
.dur-sep { color: rgba(37,99,235,0.4); margin: 0 0.1rem; }

/* ── Two columns ── */
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
@media (max-width: 480px) {
  .two-col  { grid-template-columns: 1fr; }
  .date-row { grid-template-columns: 1fr; }
  .date-sep { display: none; }
}

/* ── Status toggle ── */
.status-toggle {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.85rem 1rem; border-radius: 12px; cursor: pointer;
  border: 1.5px solid var(--color-border);
  transition: all 0.15s;
}
.status-on  { background: rgba(22,163,74,0.07); border-color: rgba(22,163,74,0.25); }
.status-off { background: var(--color-surface); }
.status-title     { font-size: 0.82rem; font-weight: 700; color: var(--color-text-secondary); }
.status-title-on  { color: #16a34a; }
.status-sub       { font-size: 0.72rem; color: var(--color-text-disabled); margin-top: 0.15rem; }

.sw-track {
  position: relative; width: 44px; height: 24px;
  border-radius: 999px; transition: background 0.2s; flex-shrink: 0;
}
.sw-on  { background: #16a34a; }
.sw-off { background: #d1d5db; }

.sw-thumb {
  position: absolute; top: 2px; left: 2px;
  width: 20px; height: 20px; border-radius: 50%;
  background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}
.sw-thumb-on { transform: translateX(20px); }

/* ── Footer ── */
.modal-footer { display: flex; gap: 0.75rem; }
.footer-btn   { flex: 1; }
</style>
