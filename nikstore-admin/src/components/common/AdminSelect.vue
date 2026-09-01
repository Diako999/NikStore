<template>
  <div>
    <label v-if="label" class="field-label">{{ label }}</label>
    <select
      v-model="model"
      :disabled="disabled"
      :class="[
        'field-input appearance-none cursor-pointer',
        error ? '!border-error !ring-error/15' : '',
      ]"
    >
      <option v-if="placeholder" value="">{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <p v-if="error" class="field-error">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue:  { default: '' },
  label:       String,
  placeholder: String,
  options:     { type: Array, default: () => [] },
  error:       String,
  disabled:    Boolean,
})
const emit = defineEmits(['update:modelValue'])
const model = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
</script>
