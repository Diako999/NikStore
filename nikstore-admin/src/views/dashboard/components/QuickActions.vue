<template>
  <div class="glass-card">
    <h3 class="relative section-title mb-4">دسترسی سریع</h3>

    <div class="relative grid grid-cols-2 sm:grid-cols-6 gap-3">
      <RouterLink
        v-for="action in actions"
        :key="action.label"
        :to="action.to"
        :class="[
          'quick-action-tile flex flex-col items-center gap-2 p-4 rounded-xl',
          'transition-all duration-200 text-center group',
          action.highlight ? 'quick-action-tile--highlight' : '',
        ]"
      >
        <div class="relative">
          <span class="text-2xl">{{ action.icon }}</span>
          <Transition name="badge-pop">
            <span
              v-if="action.badge"
              :key="action.badge"
              :class="[
                'absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1',
                'text-white text-[10px] font-bold rounded-full',
                'flex items-center justify-center font-fanum',
                action.highlight ? 'bg-amber-500' : 'bg-error',
              ]"
            >
              {{ action.badge > 99 ? '99+' : action.badge }}
            </span>
          </Transition>
        </div>
        <span
          :class="[
            'text-xs font-medium transition-colors',
            action.highlight
              ? 'text-amber-600 dark:text-amber-400 group-hover:text-amber-500'
              : 'text-text-secondary group-hover:text-primary',
          ]"
        >
          {{ action.label }}
        </span>
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  pendingOrders:  { type: Number, default: 0 },
  pendingReviews: { type: Number, default: 0 },
})

const actions = computed(() => [
  {
    icon:      '➕',
    label:     'محصول جدید',
    to:        { name: 'product-create' },
    badge:     null,
    highlight: false,
  },
  {
    icon:      '🛒',
    label:     'سفارشات جدید',
    to:        { name: 'orders' },
    badge:     props.pendingOrders || null,
    highlight: false,
  },
  {
    icon:      '⭐',
    label:     'نظرات در انتظار',
    to:        { name: 'reviews' },
    badge:     props.pendingReviews || null,
    highlight: false,
  },
  {
    icon:      '🏷️',
    label:     'دسته‌بندی‌ها',
    to:        { name: 'categories' },
    badge:     null,
    highlight: false,
  },
])
</script>

<style scoped>
.badge-pop-enter-active { transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.15s ease; }
.badge-pop-enter-from   { transform: scale(0.4); opacity: 0; }
.badge-pop-leave-active { transition: transform 0.15s ease, opacity 0.15s ease; }
.badge-pop-leave-to     { transform: scale(0); opacity: 0; }

/* Glass action tile */
.quick-action-tile {
  position: relative;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(14px) saturate(150%);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
}
.quick-action-tile:hover {
  background: var(--glass-strong);
  border-color: rgb(var(--brand-rgb) / 0.4);
}
.quick-action-tile--highlight {
  border-color: rgba(245, 158, 11, 0.4);
}
.quick-action-tile--highlight:hover {
  border-color: rgba(245, 158, 11, 0.65);
  background: rgba(245, 158, 11, 0.08);
}
</style>
