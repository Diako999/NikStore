<template>
  <div class="admin-card">
    <h3 class="section-title mb-4">دسترسی سریع</h3>

    <div class="grid grid-cols-2 sm:grid-cols-6 gap-3">
      <RouterLink
        v-for="action in actions"
        :key="action.label"
        :to="action.to"
        :class="[
          'flex flex-col items-center gap-2 p-4 rounded-xl border-2',
          'transition-all duration-200 text-center group',
          action.highlight
            ? 'border-amber-400/60 bg-amber-50/10 hover:border-amber-400 hover:bg-amber-500/10'
            : 'border-border hover:border-primary/40 hover:bg-primary/5',
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
</style>
