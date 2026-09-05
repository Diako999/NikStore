<template>
  <div class="admin-pagination">
    <span class="admin-pagination__summary">
      نمایش {{ rangeStart }}–{{ rangeEnd }} از {{ total }}
    </span>
    <div class="admin-pagination__controls">
      <button
        type="button"
        class="admin-pagination__btn"
        :disabled="page <= 1"
        @click="go(page - 1)"
      >
        <AppIcon name="chevron-right" :size="15" />
      </button>
      <span class="admin-pagination__page">{{ page }} / {{ pageCount }}</span>
      <button
        type="button"
        class="admin-pagination__btn"
        :disabled="page >= pageCount"
        @click="go(page + 1)"
      >
        <AppIcon name="chevron-left" :size="15" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '../icons/AppIcon.vue'

const props = defineProps({
  page: { type: Number, required: true },
  pageSize: { type: Number, default: 20 },
  total: { type: Number, default: 0 },
})

const emit = defineEmits(['update:page'])

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const rangeStart = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1))
const rangeEnd = computed(() => Math.min(props.page * props.pageSize, props.total))

function go(next) {
  if (next < 1 || next > pageCount.value) return
  emit('update:page', next)
}
</script>

<style scoped>
.admin-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 4px;
  flex-wrap: wrap;
}
.admin-pagination__summary {
  font-size: 12px;
  color: var(--text-secondary);
}
.admin-pagination__controls {
  display: flex;
  align-items: center;
  gap: 10px;
}
.admin-pagination__page {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 52px;
  text-align: center;
}
.admin-pagination__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  color: var(--text-primary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  cursor: pointer;
}
.admin-pagination__btn:hover:not(:disabled) {
  background: var(--glass-strong);
}
.admin-pagination__btn:disabled {
  opacity: .4;
  cursor: not-allowed;
}
</style>
