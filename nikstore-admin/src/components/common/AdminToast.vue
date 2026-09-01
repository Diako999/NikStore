<template>
  <div
    class="fixed top-4 left-1/2 -translate-x-1/2 z-toast flex flex-col items-center gap-2 pointer-events-none"
    style="min-width:300px; max-width:90vw;"
  >
    <TransitionGroup name="toast">
      <div
        v-for="t in ui.toasts"
        :key="t.id"
        :class="['admin-toast', `admin-toast--${t.type}`, 'pointer-events-auto']"
      >
        <span class="flex-shrink-0">{{ typeIcon(t.type) }}</span>
        <span class="flex-1">{{ t.message }}</span>
        <button @click="ui.removeToast(t.id)" class="opacity-60 hover:opacity-100 flex-shrink-0 text-base leading-none">
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useUiStore } from '@/stores/ui.store'
const ui = useUiStore()

const typeIcon = (t) => ({ success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }[t] ?? 'ℹ️')
</script>

<style scoped>
.toast-enter-active { transition: all 0.3s ease; }
.toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from   { opacity: 0; transform: translateY(-16px) scale(0.95); }
.toast-leave-to     { opacity: 0; transform: scale(0.9); }

/* ── Glass toast — translucent + blur, colored accent border/icon per type ── */
.admin-toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  width: 100%;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  background: var(--glass-strong);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid var(--glass-border);
  border-inline-start: 3px solid var(--toast-accent, var(--brand));
  box-shadow: 0 12px 30px rgba(0,0,0,.22);
}
.admin-toast--success { --toast-accent: #10B981; }
.admin-toast--error   { --toast-accent: #EF4444; }
.admin-toast--warning { --toast-accent: #F59E0B; }
.admin-toast--info    { --toast-accent: #3B82F6; }
</style>
