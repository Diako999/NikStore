<template>
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div v-if="modelValue" class="fixed inset-0 z-modal flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="handleBackdrop" />
        <Transition name="modal-panel" appear>
          <div
            v-if="modelValue"
            :class="['relative rounded-2xl shadow-modal w-full flex flex-col max-h-[90vh] base-modal-panel', sizeClass[size] || sizeClass.md]"
          >
            <!-- Header -->
            <div v-if="title || $slots.header" class="flex items-center justify-between px-5 py-4 border-b border-glass-border shrink-0">
              <slot name="header">
                <h3 class="font-bold text-lg text-glass-text-primary">{{ title }}</h3>
              </slot>
              <button class="text-glass-text-secondary hover:text-glass-text-primary transition-colors ms-3" @click="close">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <!-- Content -->
            <div class="p-5 overflow-y-auto flex-1">
              <slot />
            </div>
            <!-- Footer -->
            <div v-if="$slots.footer" class="px-5 py-4 border-t border-glass-border shrink-0 flex gap-3 justify-end">
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { watch, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title:      { type: String, default: '' },
  size:       { type: String, default: 'md' },
  persistent: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'close'])

const sizeClass = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-2xl',
  full: 'max-w-none w-full h-full rounded-none',
}

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function handleBackdrop() {
  if (!props.persistent) close()
}

function onKeydown(e) {
  if (e.key === 'Escape' && props.modelValue) close()
}

watch(() => props.modelValue, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
}, { immediate: true })

onUnmounted(() => {
  document.body.style.overflow = ''
})

window.addEventListener('keydown', onKeydown)
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.base-modal-panel {
  background: var(--glass-strong);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid var(--glass-border);
}

.modal-backdrop-enter-active,
.modal-backdrop-leave-active { transition: opacity 0.25s ease; }
.modal-backdrop-enter-from,
.modal-backdrop-leave-to { opacity: 0; }

.modal-panel-enter-active,
.modal-panel-leave-active { transition: all 0.25s ease; }
.modal-panel-enter-from,
.modal-panel-leave-to { opacity: 0; transform: scale(0.96) translateY(-8px); }
</style>
