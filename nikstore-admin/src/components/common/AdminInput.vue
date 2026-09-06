<template>
  <label class="admin-field">
    <span v-if="label" class="admin-field__label">{{ label }}</span>
    <span class="admin-field__control" :class="{ 'admin-field__control--error': !!error }">
      <AppIcon v-if="icon" :name="icon" :size="16" class="admin-field__icon" />
      <input
        v-model="model"
        class="admin-field__input"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :autocomplete="autocomplete"
      >
    </span>
    <span v-if="error" class="admin-field__error">{{ error }}</span>
  </label>
</template>

<script setup>
import AppIcon from '../icons/AppIcon.vue'

defineProps({
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  error: { type: String, default: '' },
  icon: { type: String, default: '' },
  autocomplete: { type: String, default: 'off' },
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
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 10px;
  padding: 0 12px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  transition: border-color .15s ease;
}
.admin-field__control:focus-within {
  border-color: var(--brand-light);
}
.admin-field__control--error {
  border-color: #D9534F;
}
.admin-field__icon {
  flex-shrink: 0;
  color: var(--text-secondary);
}
.admin-field__input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 13.5px;
  padding: 11px 0;
}
.admin-field__input::placeholder {
  color: var(--text-disabled);
}
.admin-field__input:disabled {
  opacity: .55;
  cursor: not-allowed;
}
.admin-field__error {
  font-size: 11.5px;
  color: #D9534F;
}
</style>
