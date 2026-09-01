<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm text-right">

      <!-- Head -->
      <thead class="bg-surface border-b border-border">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :style="col.width ? `width:${col.width}` : ''"
            :class="[
              'px-4 py-3 font-medium text-text-secondary whitespace-nowrap',
              col.sortable ? 'cursor-pointer hover:text-text-primary select-none' : '',
              col.align === 'center' ? 'text-center' : 'text-right',
            ]"
            @click="col.sortable && emitSort(col.key)"
          >
            <span
              class="inline-flex items-center gap-1"
              :class="col.align === 'center' ? 'justify-center' : 'justify-end'"
            >
              {{ col.label }}
              <span v-if="col.sortable" class="text-text-disabled text-xs">
                {{ sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}
              </span>
            </span>
          </th>
        </tr>
      </thead>

      <!-- Body: skeleton -->
      <tbody v-if="loading">
        <tr v-for="i in skeletonRows" :key="i" class="border-b border-border">
          <td v-for="col in columns" :key="col.key" class="px-4 py-3">
            <AdminSkeleton
              height="1.25rem"
              :width="col.align === 'center' ? '60%' : '80%'"
              :class="col.align === 'center' ? 'mx-auto' : 'mr-auto'"
            />
          </td>
        </tr>
      </tbody>

      <!-- Body: empty -->
      <tbody v-else-if="rows.length === 0">
        <tr>
          <td :colspan="columns.length" class="py-16 text-center text-text-disabled">
            <div class="text-4xl mb-2">📭</div>
            {{ emptyText }}
          </td>
        </tr>
      </tbody>

      <!-- Body: data -->
      <tbody v-else>
        <tr
          v-for="row in rows"
          :key="row[rowKey]"
          class="border-b border-border hover:bg-surface/60 transition-colors duration-100"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            :class="['px-4 py-3 text-text-primary', col.align === 'center' ? 'text-center' : '']"
          >
            <slot :name="'cell-' + col.key" :row="row" :value="row[col.key]">
              {{ row[col.key] ?? '—' }}
            </slot>
          </td>
        </tr>
      </tbody>

    </table>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AdminSkeleton from './AdminSkeleton.vue'

defineProps({
  columns:      { type: Array,   default: () => [] },
  rows:         { type: Array,   default: () => [] },
  loading:      { type: Boolean, default: false },
  rowKey:       { type: String,  default: '_id' },
  skeletonRows: { type: Number,  default: 8 },
  emptyText:    { type: String,  default: 'داده‌ای یافت نشد' },
})
const emit    = defineEmits(['sort'])
const sortKey = ref('')
const sortDir = ref('asc')

function emitSort(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
  emit('sort', { key: sortKey.value, dir: sortDir.value })
}
</script>
