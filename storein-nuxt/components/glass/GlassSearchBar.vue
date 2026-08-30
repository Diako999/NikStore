<template>
  <form class="glass-search" @submit.prevent="onSubmit">
    <svg class="glass-search__icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
    </svg>
    <input
      class="glass-search__input"
      type="search"
      :value="modelValue"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
      @focus="$emit('focus', $event)"
    >
  </form>
</template>

<script setup>
// Matches the mockups' `.search` bar exactly. Later chunks own what
// "submit" does (typically navigateTo(`/search?q=...`)) — this component
// only reports the intent.
const props = defineProps({
  modelValue:  { type: String, default: '' },
  placeholder: { type: String, default: 'جستجوی محصول، برند یا دسته‌بندی...' },
})

const emit = defineEmits(['update:modelValue', 'submit', 'focus'])

function onSubmit() {
  emit('submit', props.modelValue)
}
</script>

<style scoped>
.glass-search {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--glass);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  padding: 13px 16px;
  color: var(--text-secondary);
}
[data-theme='light'] .glass-search { box-shadow: var(--glass-shadow); }

.glass-search__icon { flex-shrink: 0; color: var(--text-secondary); }

.glass-search__input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  font-family: inherit;
  font-size: 13px;
  color: var(--text-primary);
}
.glass-search__input::placeholder { color: var(--text-secondary); }
/* Hide native search-input decorations (clear/cancel button) so the field
   stays visually identical to the mockup across browsers. */
.glass-search__input::-webkit-search-decoration,
.glass-search__input::-webkit-search-cancel-button,
.glass-search__input::-webkit-search-results-button,
.glass-search__input::-webkit-search-results-decoration { -webkit-appearance: none; }
</style>
