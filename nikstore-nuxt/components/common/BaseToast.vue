<template>
  <div class="fixed top-4 inset-x-0 flex flex-col items-center z-toast pointer-events-none px-4">
    <TransitionGroup name="toast" tag="div" class="flex flex-col items-center gap-2 w-full max-w-sm">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-item flex items-center gap-3 px-4 py-3 rounded-xl shadow-dropdown pointer-events-auto w-full"
        :style="accentStyle(toast.type)"
      >
        <span class="shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-white text-xs font-bold" :class="iconBg(toast.type)">
          {{ typeIcon(toast.type) }}
        </span>
        <span class="flex-1 text-sm font-medium">{{ toast.message }}</span>
        <button class="shrink-0 opacity-50 hover:opacity-100 transition-opacity" @click="uiStore.removeToast(toast.id)">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useUiStore } from '~/stores/ui.store'

const uiStore = useUiStore()
const { toasts } = storeToRefs(uiStore)

// Token-driven glass toast: translucent --glass-strong body + a colored
// accent border on the leading (RTL-logical) edge per type — readable in
// both themes instead of the old hardcoded light-mode pastels.
const accentColor = {
  success: '#10B981',
  error:   '#EF4444',
  warning: '#F59E0B',
  info:    '#3B82F6',
}

function accentStyle(type) {
  const color = accentColor[type] || 'var(--text-secondary)'
  return {
    background: 'var(--glass-strong)',
    border: '1px solid var(--glass-border)',
    borderInlineStart: `3px solid ${color}`,
    color: 'var(--text-primary)',
    backdropFilter: 'blur(20px) saturate(150%)',
    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
  }
}

function iconBg(type) {
  return {
    success: 'bg-green-500',
    error:   'bg-red-500',
    warning: 'bg-yellow-500',
    info:    'bg-blue-500',
  }[type] || 'bg-gray-400'
}

function typeIcon(type) {
  return { success: '✓', error: '✕', warning: '!', info: 'i' }[type] || 'i'
}
</script>

<style scoped>
.toast-move,
.toast-enter-active,
.toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from { opacity: 0; transform: translateY(-16px) scale(0.95); }
.toast-leave-to   { opacity: 0; transform: translateY(-8px) scale(0.95); }
.toast-leave-active { position: absolute; }
</style>
