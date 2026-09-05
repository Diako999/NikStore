<template>
  <Teleport to="body">
    <Transition name="admin-modal-fade">
      <div v-if="open" class="admin-modal-overlay" @mousedown.self="handleBackdrop">
        <div class="admin-modal" :style="{ maxWidth: width }" role="dialog" aria-modal="true">
          <header v-if="$slots.header || title" class="admin-modal__header">
            <slot name="header">
              <h3 class="admin-modal__title">{{ title }}</h3>
            </slot>
            <button type="button" class="admin-modal__close" aria-label="بستن" @click="close">
              <AppIcon name="close" :size="16" />
            </button>
          </header>
          <div class="admin-modal__body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="admin-modal__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { onBeforeUnmount, onMounted, watch } from 'vue'
import AppIcon from '../icons/AppIcon.vue'

const props = defineProps({
  title: { type: String, default: '' },
  width: { type: String, default: '480px' },
  closeOnBackdrop: { type: Boolean, default: true },
})

const open = defineModel({ type: Boolean, default: false })

function close() {
  open.value = false
}

function handleBackdrop() {
  if (props.closeOnBackdrop) close()
}

function handleKeydown(event) {
  if (event.key === 'Escape' && open.value) close()
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', handleKeydown))

watch(open, (value) => {
  document.body.style.overflow = value ? 'hidden' : ''
})
</script>

<style scoped>
.admin-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(9, 15, 12, .5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.admin-modal {
  width: 100%;
  max-height: 88vh;
  overflow-y: auto;
  border-radius: 18px;
  background:
    linear-gradient(var(--glass-strong), var(--glass-strong)) padding-box,
    linear-gradient(150deg, rgba(255, 255, 255, .42), rgba(255, 255, 255, .03) 55%, rgba(231, 175, 66, .28)) border-box;
  backdrop-filter: blur(22px) saturate(160%);
  -webkit-backdrop-filter: blur(22px) saturate(160%);
  border: 1px solid transparent;
  box-shadow: 0 30px 70px rgba(0, 0, 0, .35);
}
[data-theme='light'] .admin-modal {
  background:
    linear-gradient(var(--glass-strong), var(--glass-strong)) padding-box,
    linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(231, 175, 66, .5) 55%, rgba(122, 90, 220, .4) 100%) border-box;
  border: 1.5px solid transparent;
  box-shadow: 0 30px 70px rgba(40, 55, 46, .22);
}

.admin-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid var(--glass-border);
}
.admin-modal__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}
.admin-modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
}
.admin-modal__close:hover {
  background: var(--glass);
  color: var(--text-primary);
}
.admin-modal__body {
  padding: 20px;
}
.admin-modal__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid var(--glass-border);
}

.admin-modal-fade-enter-active,
.admin-modal-fade-leave-active {
  transition: opacity .15s ease;
}
.admin-modal-fade-enter-from,
.admin-modal-fade-leave-to {
  opacity: 0;
}
</style>
