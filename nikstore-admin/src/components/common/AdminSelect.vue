<template>
  <label class="admin-field">
    <span v-if="label" class="admin-field__label">{{ label }}</span>
    <span class="admin-field__control" :class="{ 'admin-field__control--error': !!error }">
      <select v-model="model" class="admin-field__select" :disabled="disabled">
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <AppIcon name="chevron-down" :size="15" class="admin-field__caret" />
    </span>
    <span v-if="error" class="admin-field__error">{{ error }}</span>
  </label>
</template>

<script setup>
import AppIcon from '../icons/AppIcon.vue'

defineProps({
  label: { type: String, default: '' },
  options: { type: Array, default: () => [] }, // [{ label, value }]
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const model = defineModel({ type: [String, Number], default: '' })
</script>

<style scoped>
.admin-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.admin-field__label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary);
}
.admin-field__control {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 10px;
  padding-inline: 12px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(12px) saturate(160%);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
  transition: border-color .15s ease;
}
.admin-field__control:focus-within {
  border-color: var(--brand-light);
}
.admin-field__control--error {
  border-color: #D9534F;
}
.admin-field__select {
  flex: 1;
  min-width: 0;
  appearance: none;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 13.5px;
  font-family: inherit;
  padding: 11px 0;
  padding-inline-end: 22px;
}
.admin-field__select:disabled {
  opacity: .55;
  cursor: not-allowed;
}
.admin-field__caret {
  position: absolute;
  inset-inline-end: 12px;
  color: var(--text-secondary);
  pointer-events: none;
}
.admin-field__error {
  font-size: 11.5px;
  color: #D9534F;
}
</style>
