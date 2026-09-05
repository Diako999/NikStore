<template>
  <label class="admin-field">
    <span v-if="label" class="admin-field__label">{{ label }}</span>
    <span class="admin-field__control" :class="{ 'admin-field__control--error': !!error }">
      <textarea
        v-model="model"
        class="admin-field__textarea"
        :rows="rows"
        :placeholder="placeholder"
        :disabled="disabled"
      />
    </span>
    <span v-if="error" class="admin-field__error">{{ error }}</span>
  </label>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  error: { type: String, default: '' },
  rows: { type: [Number, String], default: 4 },
})

const model = defineModel({ type: String, default: '' })
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
  border-radius: 10px;
  padding: 4px 12px;
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
.admin-field__textarea {
  width: 100%;
  resize: vertical;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 13.5px;
  font-family: inherit;
  padding: 9px 0;
}
.admin-field__textarea::placeholder {
  color: var(--text-disabled);
}
.admin-field__textarea:disabled {
  opacity: .55;
  cursor: not-allowed;
}
.admin-field__error {
  font-size: 11.5px;
  color: #D9534F;
}
</style>
