<template>
  <div>
    <label v-if="label" class="field-label">
      {{ label }}
      <span v-if="required" class="text-error">*</span>
    </label>
    <textarea
      v-model="model"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      :dir="dir"
      :class="[
        'field-input resize-none',
        error ? '!border-error !ring-error/15' : '',
        disabled ? 'opacity-60 bg-surface' : '',
      ]"
    />
    <p v-if="error" class="field-error">{{ error }}</p>
    <p v-else-if="hint" class="text-text-disabled text-xs mt-1">{{ hint }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue:  { default: '' },
  label:       String,
  placeholder: String,
  rows:        { type: Number, default: 4 },
  error:       String,
  hint:        String,
  disabled:    Boolean,
  required:    Boolean,
  dir:         { default: 'rtl' },
})
const emit = defineEmits(['update:modelValue'])
const model = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
</script>
