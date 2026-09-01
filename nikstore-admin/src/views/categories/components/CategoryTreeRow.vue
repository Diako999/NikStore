<template>
  <tr :class="[
    'border-b border-border transition-colors duration-100',
    depth === 0
      ? 'bg-card hover:bg-surface/60 dark:hover:bg-slate-700/50'
      : 'bg-surface/40 dark:bg-slate-800/50 hover:bg-surface dark:hover:bg-slate-700/80',
  ]">

    <!-- Name + indent -->
    <td class="px-4 py-3">
      <div class="flex items-center" :style="{ paddingRight: `${depth * 24}px` }">

        <!-- Expand toggle or indent spacer -->
        <button
          v-if="category.children?.length"
          @click="$emit('toggle-expand', category._id)"
          class="w-6 h-6 flex items-center justify-center text-text-secondary hover:text-primary transition-colors ml-1 flex-shrink-0"
        >
          <svg
            :class="['w-3.5 h-3.5 transition-transform duration-200', expanded ? 'rotate-90' : '']"
            fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
        <span v-else class="w-6 ml-1 flex-shrink-0 text-center text-text-disabled text-xs">
          {{ depth > 0 ? '↳' : '' }}
        </span>

        <!-- Icon -->
        <div :class="[
          'w-8 h-8 rounded-lg flex items-center justify-center ml-3 flex-shrink-0 overflow-hidden',
          depth === 0 ? 'bg-primary/10' : 'bg-border',
        ]">
          <img v-if="category.image?.thumbnail"
               :src="category.image.thumbnail"
               class="w-full h-full object-cover" />
          <span v-else class="text-sm">{{ depth === 0 ? '📁' : '📂' }}</span>
        </div>

        <!-- Name + slug -->
        <div class="min-w-0">
          <p class="font-medium text-text-primary text-sm truncate">{{ category.name }}</p>
          <p class="text-text-disabled text-xs font-mono" dir="ltr">{{ category.slug }}</p>
        </div>
      </div>
    </td>

    <!-- Parent -->
    <td class="px-4 py-3 text-sm text-text-secondary">
      {{ category.parent?.name ?? '—' }}
    </td>

    <!-- Products count -->
    <td class="px-4 py-3 text-center">
      <span class="font-fanum text-sm font-medium text-text-primary">
        {{ category.productsCount ?? 0 }}
      </span>
    </td>

    <!-- Order -->
    <td class="px-4 py-3 text-center">
      <span class="font-fanum text-sm text-text-secondary">{{ category.sortOrder ?? 0 }}</span>
    </td>

    <!-- Status -->
    <td class="px-4 py-3 text-center">
      <AdminBadge :variant="category.isActive ? 'success' : 'error'" size="sm">
        {{ category.isActive ? 'فعال' : 'غیرفعال' }}
      </AdminBadge>
    </td>

    <!-- Actions -->
    <td class="px-4 py-3 text-center">
      <div class="flex items-center justify-center gap-1">
        <button @click="$emit('edit', category)"
          class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </button>

        <button
          @click="$emit('delete', category)"
          :disabled="!!(category.children?.length || category.productsCount)"
          :title="category.children?.length ? 'ابتدا زیردسته‌ها را حذف کنید' : category.productsCount ? 'این دسته محصول دارد' : 'حذف'"
          class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary transition-colors hover:bg-red-50 hover:text-error disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
    </td>
  </tr>
</template>

<script setup>
import AdminBadge from '@/components/common/AdminBadge.vue'
defineProps({
  category: { type: Object,  required: true },
  depth:    { type: Number,  default: 0 },
  expanded: { type: Boolean, default: true },
})
defineEmits(['toggle-expand', 'edit', 'delete'])
</script>
