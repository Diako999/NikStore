<template>
  <div class="persian-date-wrapper">
    <label v-if="label" class="block text-xs font-semibold text-text-secondary mb-1.5 text-right">
      {{ label }}
      <span v-if="required" class="text-danger mr-0.5">*</span>
    </label>
    <DatePicker
      v-model="internalValue"
      format="YYYY-MM-DDTHH:mm:ss.000Z"
      display-format="jYYYY/jMM/jDD HH:mm"
      type="datetime"
      locale="fa"
      :min="minDate"
      :clearable="clearable"
      :placeholder="placeholder || 'انتخاب تاریخ'"
      :auto-submit="true"
      :input-class="'field-input text-sm w-full h-9 px-3 rounded-lg'"
      @change="onDateChange"
    />
    <div v-if="internalValue" class="date-value-display">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <span dir="ltr">{{ formattedDisplay }}</span>
      <button type="button" class="date-clear-btn" @click="clearValue" title="پاک کردن تاریخ">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <p v-if="error" class="text-danger text-xs mt-1 text-right">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: null },
  label:      { type: String, default: '' },
  placeholder: { type: String, default: '' },
  required:   { type: Boolean, default: false },
  clearable:  { type: Boolean, default: true },
  minDate:    { type: String, default: '' },
  error:      { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const internalValue = ref(props.modelValue ?? null)

watch(() => props.modelValue, (val) => { internalValue.value = val ?? null })

function onDateChange(val) {
  emit('update:modelValue', val || null)
}

function clearValue() {
  internalValue.value = null
  emit('update:modelValue', null)
}

const _jalaliDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
  year: 'numeric', month: '2-digit', day: '2-digit',
})
const _time = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
  hour: '2-digit', minute: '2-digit', hour12: false,
})

const formattedDisplay = computed(() => {
  if (!internalValue.value) return ''
  try {
    const d = new Date(internalValue.value)
    if (isNaN(d.getTime())) return ''
    return `${_jalaliDate.format(d)}  |  ${_time.format(d)}`
  } catch { return '' }
})
</script>

<style>
.vpd-icon-btn { display: none !important; }
.vpd-input-group { display: block !important; position: relative; }
.vpd-clear-btn { left: 8px; top: 50%; transform: translateY(-50%); line-height: 1; width: 20px; opacity: 0.5; }
.vpd-clear-btn:hover { opacity: 1; }

/* input text color is handled globally in main.css */
</style>

<style scoped>
.date-value-display {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
  padding: 3px 8px 3px 4px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #2563eb;
  background: rgba(37,99,235,0.08);
  border: 1px solid rgba(37,99,235,0.2);
}
.date-clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: none;
  background: rgba(37,99,235,0.15);
  color: #2563eb;
  cursor: pointer;
  padding: 0;
  margin-right: 2px;
  transition: background 0.15s;
}
.date-clear-btn:hover { background: rgba(239,68,68,0.15); color: #ef4444; }
</style>
