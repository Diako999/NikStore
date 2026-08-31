<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" :for="uid" class="text-sm font-semibold text-glass-text-primary">{{ label }}</label>
    <div class="relative flex items-center">
      <!-- Prepend slot: right side in RTL (reading start) -->
      <div
        v-if="$slots.prepend || prepend"
        class="absolute inset-y-0 right-0 flex items-center pr-3 text-glass-text-secondary pointer-events-none"
      >
        <slot name="prepend"><span>{{ prepend }}</span></slot>
      </div>
      <input
        v-bind="$attrs"
        :id="uid"
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :dir="dir"
        :class="[
          'base-input',
          $slots.prepend || prepend ? 'pr-10' : '',
          $slots.append || append ? 'pl-10' : '',
          error ? '!border-error focus:!ring-error/20' : '',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
        ]"
        @input="$emit('update:modelValue', $event.target.value)"
        @focus="$emit('focus', $event)"
        @blur="$emit('blur', $event)"
        @keydown.enter="$emit('enter', $event)"
      />
      <!-- Append slot: left side in RTL (reading end) -->
      <div
        v-if="$slots.append || append"
        class="absolute inset-y-0 left-0 flex items-center pl-3 text-glass-text-secondary pointer-events-none"
      >
        <slot name="append"><span>{{ append }}</span></slot>
      </div>
    </div>
    <p v-if="error" class="text-xs text-error">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-glass-text-secondary">{{ hint }}</p>
  </div>
</template>

<script setup>
defineProps({
  modelValue:  { type: [String, Number], default: '' },
  label:       { type: String, default: '' },
  placeholder: { type: String, default: '' },
  type:        { type: String, default: 'text' },
  error:       { type: String, default: '' },
  hint:        { type: String, default: '' },
  disabled:    { type: Boolean, default: false },
  prepend:     { type: String, default: '' },
  append:      { type: String, default: '' },
  dir:         { type: String, default: 'rtl' },
})

defineEmits(['update:modelValue', 'focus', 'blur', 'enter'])

// useId() (Vue 3.5+) generates a stable id that matches between SSR and
// client hydration — a random-string id mismatches on hydration because
// Math.random() produces a different value server- vs client-side.
const uid = `input-${useId()}`
</script>

<style scoped>
.base-input {
  width: 100%;
  border-radius: 14px;
  padding: 12px 16px;
  font-size: 13.5px;
  font-family: inherit;
  background: var(--glass);
  backdrop-filter: blur(8px) saturate(140%);
  -webkit-backdrop-filter: blur(8px) saturate(140%);
  border: 1.5px solid var(--glass-border);
  color: var(--text-primary);
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.base-input::placeholder { color: var(--text-disabled); }
.base-input:focus {
  outline: none;
  border-color: var(--brand-light);
  box-shadow: 0 0 0 3px rgb(var(--brand-rgb) / 0.18);
}
</style>
