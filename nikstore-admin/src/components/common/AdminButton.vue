<template>
  <button
    class="admin-btn"
    :class="[`admin-btn--${variant}`, `admin-btn--${size}`]"
    :type="type"
    :disabled="disabled || loading"
  >
    <AppIcon v-if="icon && !loading" :name="icon" :size="iconSize" />
    <span v-if="loading" class="admin-btn__spinner" aria-hidden="true" />
    <span v-if="$slots.default"><slot /></span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '../icons/AppIcon.vue'

const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | danger | ghost
  size: { type: String, default: 'md' }, // sm | md
  type: { type: String, default: 'button' },
  icon: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})

const iconSize = computed(() => (props.size === 'sm' ? 15 : 17))
</script>

<style scoped>
.admin-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  font-family: inherit;
  border-radius: 10px;
  cursor: pointer;
  white-space: nowrap;
  transition: filter .15s ease, opacity .15s ease, transform .1s ease;
}
.admin-btn:active:not(:disabled) {
  transform: translateY(1px);
}
.admin-btn:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.admin-btn--md {
  font-size: 13.5px;
  padding: 10px 18px;
}
.admin-btn--sm {
  font-size: 12.5px;
  padding: 7px 13px;
}

.admin-btn--primary {
  color: #fff;
  background: linear-gradient(135deg, #6EB082 0%, #3D8B52 55%, #2D6B3E 100%);
  border: 1px solid rgba(255, 255, 255, .25);
  box-shadow: 0 8px 22px rgba(0, 0, 0, .25), inset 0 1px 0 rgba(255, 255, 255, .30);
}
[data-theme='light'] .admin-btn--primary {
  border: 1px solid rgba(255, 255, 255, .3);
  box-shadow: 0 10px 22px rgba(40, 55, 46, .22), inset 0 1px 0 rgba(255, 255, 255, .35);
}
.admin-btn--primary:hover:not(:disabled) {
  filter: brightness(1.06);
}

.admin-btn--secondary {
  color: var(--text-primary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
}
[data-theme='light'] .admin-btn--secondary {
  box-shadow: var(--glass-shadow);
}
.admin-btn--secondary:hover:not(:disabled) {
  background: var(--glass-strong);
}

.admin-btn--danger {
  color: #fff;
  background: linear-gradient(135deg, #E27C79 0%, #D9534F 60%, #B84440 100%);
  border: 1px solid rgba(255, 255, 255, .22);
  box-shadow: 0 8px 20px rgba(217, 83, 79, .28);
}
.admin-btn--danger:hover:not(:disabled) {
  filter: brightness(1.06);
}

.admin-btn--ghost {
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid transparent;
}
.admin-btn--ghost:hover:not(:disabled) {
  background: var(--glass);
  color: var(--text-primary);
}

.admin-btn__spinner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-inline-end-color: transparent;
  animation: admin-btn-spin .6s linear infinite;
}
@keyframes admin-btn-spin {
  to { transform: rotate(360deg); }
}
</style>
