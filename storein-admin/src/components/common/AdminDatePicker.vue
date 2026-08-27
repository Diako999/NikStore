<template>
  <div>
    <label v-if="label" class="field-label">
      {{ label }}
      <span v-if="required" class="text-error">*</span>
    </label>
    <DatePicker
      v-model="internalValue"
      :placeholder="placeholder || 'انتخاب تاریخ'"
      :clearable="clearable"
      :min="min"
      :max="max"
      :disabled="disabled"
      format="YYYY-MM-DD"
      display-format="jYYYY/jMM/jDD"
      :input-class="inputClass"
      :color="'#1B4F8A'"
      :auto-submit="true"
    />
    <p v-if="error" class="field-error mt-1">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import DatePicker from 'vue3-persian-datetime-picker'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label:      { type: String, default: '' },
  placeholder:{ type: String, default: '' },
  required:   { type: Boolean, default: false },
  clearable:  { type: Boolean, default: true },
  disabled:   { type: Boolean, default: false },
  min:        { type: String, default: '' },
  max:        { type: String, default: '' },
  error:      { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const internalValue = computed({
  get: () => props.modelValue ?? '',
  set: (val) => emit('update:modelValue', val ?? ''),
})

const inputClass = computed(() =>
  ['field-input w-full', props.error ? 'border-error' : ''].filter(Boolean).join(' ')
)
</script>

<style>
/* hide calendar icon button — clicking the input opens the picker */
.vpd-icon-btn { display: none !important; }
/* make the input group block so it takes full width */
.vpd-input-group { display: block !important; position: relative; }
/* clear button positioning */
.vpd-clear-btn { left: 8px; top: 50%; transform: translateY(-50%); line-height: 1; width: 20px; opacity: 0.5; }
.vpd-clear-btn:hover { opacity: 1; }

/* ── Force input text to be always visible ── */
.vpd-input-group input {
  color: var(--color-text-primary, #0f172a) !important;
  background-color: var(--color-card, #ffffff) !important;
}
.vpd-input-group input::placeholder {
  color: var(--color-text-disabled, #94a3b8) !important;
}

</style>
