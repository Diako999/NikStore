<template>
  <form class="search-bar" @submit.prevent="onSubmit">
    <AppIcon name="search" :size="15" :stroke-width="2" />
    <input
      v-model="query"
      class="search-bar__input"
      type="search"
      :placeholder="placeholder"
    >
  </form>
</template>

<script setup>
import { ref } from 'vue'
import AppIcon from '~/components/icons/AppIcon.vue'

defineProps({
  placeholder: { type: String, default: 'جستجوی محصول، برند یا دسته‌بندی...' },
})

const query = ref('')

function onSubmit() {
  if (!query.value.trim()) return
  navigateTo({ path: '/search', query: { q: query.value.trim() } })
}
</script>

<style scoped>
.search-bar {
  margin: 0 18px 22px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 18px;
  padding: 13px 16px;
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
}
[data-theme='light'] .search-bar {
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  box-shadow: var(--glass-shadow);
}

.search-bar__input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  font-family: inherit;
  font-size: 13px;
  color: var(--text-primary);
}
.search-bar__input::placeholder { color: var(--text-secondary); }
.search-bar__input::-webkit-search-decoration,
.search-bar__input::-webkit-search-cancel-button,
.search-bar__input::-webkit-search-results-button,
.search-bar__input::-webkit-search-results-decoration { -webkit-appearance: none; }
</style>
