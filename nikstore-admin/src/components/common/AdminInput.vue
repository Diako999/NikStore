<template>
  <div>
    <label v-if="label" class="field-label">
      {{ label }}
      <span v-if="required" class="text-error">*</span>
    </label>
    <div :class="[
      'flex items-center border rounded-lg bg-card overflow-hidden transition-all duration-150',
      error
        ? 'border-error ring-2 ring-error/15'
        : focused
          ? 'border-primary ring-2 ring-primary/15'
          : 'border-border',
      disabled ? 'bg-surface opacity-60' : '',
    ]">
      <div v-if="prepend"
           class="px-3 text-text-secondary bg-surface border-l border-border flex-shrink-0 self-stretch flex items-center text-sm">
        {{ prepend }}
      </div>
      <input
        v-model="model"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :dir="dir"
        :autocomplete="autocomplete"
        class="flex-1 px-3 py-2.5 text-sm text-text-primary bg-transparent outline-none placeholder:text-text-disabled"
        @focus="focused = true"
        @blur="focused = false"
        @keydown.enter="$emit('enter')"
      />
      <div v-if="append"
           class="px-3 text-text-secondary bg-surface border-r border-border flex-shrink-0 self-stretch flex items-center text-sm">
        {{ append }}
      </div>
    </div>
    <p v-if="error" class="field-error">{{ error }}</p>
    <p v-else-if="hint" class="text-text-disabled text-xs mt-1">{{ hint }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue:  { default: '' },
  label:       String,
  placeholder: String,
  type:        { default: 'text' },
  error:       String,
  hint:        String,
  disabled:    Boolean,
  required:    Boolean,
  dir:          { default: 'rtl' },
  prepend:      String,
  append:       String,
  autocomplete: { default: 'off' },
})
const emit = defineEmits(['update:modelValue', 'enter'])

const focused = ref(false)
const model   = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
</script>
