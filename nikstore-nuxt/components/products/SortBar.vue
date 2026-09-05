<template>
  <div class="sort-bar">
    <span v-if="resultCount !== null" class="sort-bar__count">{{ toPersianDigits(resultCount) }} محصول</span>
    <span v-else class="sort-bar__count">&nbsp;</span>

    <div class="sort-bar__actions">
      <button type="button" class="sort-bar__filter" :class="{ 'sort-bar__filter--active': activeFilterCount > 0 }" @click="$emit('open-filter')">
        <AppIcon name="filter" :size="15" :stroke-width="1.8" />
        <span>فیلتر</span>
        <span v-if="activeFilterCount > 0" class="sort-bar__filter-badge">{{ toPersianDigits(activeFilterCount) }}</span>
      </button>

      <div class="sort-bar__select">
        <select :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
          <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <AppIcon name="chevron-down" :size="13" :stroke-width="2" />
      </div>
    </div>
  </div>
</template>

<script setup>
import AppIcon from '~/components/icons/AppIcon.vue'
import { toPersianDigits } from '~/utils/format'

defineProps({
  modelValue: { type: String, default: 'newest' },
  resultCount: { type: Number, default: null },
  activeFilterCount: { type: Number, default: 0 },
  options: {
    type: Array,
    default: () => [
      { value: 'newest', label: 'جدیدترین' },
      { value: 'popular', label: 'پرفروش‌ترین' },
      { value: 'price_asc', label: 'ارزان‌ترین' },
      { value: 'price_desc', label: 'گران‌ترین' },
      { value: 'mostViewed', label: 'پربازدیدترین' },
    ],
  },
})

defineEmits(['update:modelValue', 'open-filter'])
</script>

<style scoped>
.sort-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 0 18px 14px;
}

.sort-bar__count {
  font-size: 12px;
  color: var(--text-secondary);
}

.sort-bar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-bar__filter,
.sort-bar__select {
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  cursor: pointer;
}
[data-theme='light'] .sort-bar__filter,
[data-theme='light'] .sort-bar__select {
  box-shadow: var(--glass-shadow);
}

.sort-bar__filter {
  position: relative;
}
.sort-bar__filter--active { color: var(--brand-light); }
[data-theme='light'] .sort-bar__filter--active { color: var(--brand-dark); }

.sort-bar__filter-badge {
  min-width: 15px;
  height: 15px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--brand);
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sort-bar__select { position: relative; }
.sort-bar__select select {
  appearance: none;
  background: transparent;
  border: none;
  outline: none;
  color: inherit;
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 600;
  padding-inline-end: 2px;
}
.sort-bar__select option { color: #000; }
</style>
