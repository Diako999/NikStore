<template>
  <div class="admin-table-wrap">
    <table class="admin-table">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :style="{ width: column.width, textAlign: column.align || 'start' }"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length" class="admin-table__state">
            <span class="admin-table__spinner" aria-hidden="true" />
            در حال بارگذاری...
          </td>
        </tr>
        <tr v-else-if="!rows.length">
          <td :colspan="columns.length" class="admin-table__state">
            <slot name="empty">{{ emptyText }}</slot>
          </td>
        </tr>
        <template v-else>
          <tr v-for="(row, index) in rows" :key="row.id ?? index">
            <td
              v-for="column in columns"
              :key="column.key"
              :style="{ textAlign: column.align || 'start' }"
            >
              <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]" :index="index">
                {{ row[column.key] }}
              </slot>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  columns: { type: Array, required: true }, // [{ key, label, width?, align? }]
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: 'داده‌ای برای نمایش وجود ندارد' },
})
</script>

<style scoped>
.admin-table-wrap {
  overflow-x: auto;
}
.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.admin-table thead th {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  padding: 14px 16px;
  border-bottom: 1px solid var(--glass-border);
  white-space: nowrap;
}
.admin-table tbody td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--glass-border);
  color: var(--text-primary);
}
.admin-table tbody tr:last-child td {
  border-bottom: none;
}
.admin-table tbody tr:hover td {
  background: var(--glass);
}
.admin-table__state {
  text-align: center;
  padding: 40px 16px;
  color: var(--text-secondary);
  font-size: 13px;
}
.admin-table__spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-inline-end: 8px;
  vertical-align: middle;
  border-radius: 50%;
  border: 2px solid var(--text-secondary);
  border-inline-end-color: transparent;
  animation: admin-table-spin .6s linear infinite;
}
@keyframes admin-table-spin {
  to { transform: rotate(360deg); }
}
</style>
