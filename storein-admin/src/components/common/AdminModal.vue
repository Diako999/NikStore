<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue"
           class="fixed inset-0 z-modal flex items-center justify-center p-4"
           @keydown.esc="!persistent && close()">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50" @click="!persistent && close()" />

        <!-- Panel -->
        <div :class="[
          'glass-surface relative rounded-2xl w-full flex flex-col max-h-[90vh]',
          sizeClass,
        ]">
          <!-- Header -->
          <div class="relative flex items-center justify-between px-6 py-4 border-b border-glass-border flex-shrink-0">
            <h3 class="font-bold text-glass-text-primary text-base">{{ title }}</h3>
            <button
              @click="close"
              class="text-glass-text-secondary hover:text-glass-text-primary p-1 rounded-lg hover:bg-glass transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="relative px-6 py-5 overflow-y-auto flex-1 text-glass-text-primary">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="relative px-6 py-4 border-t border-glass-border flex-shrink-0">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title:      { type: String,  default: '' },
  size:       { type: String,  default: 'md' },
  persistent: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'close'])

function close() {
  emit('update:modelValue', false)
  emit('close')
}

const sizeClass = computed(() => ({
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-3xl',
}[props.size] ?? 'max-w-lg'))

watch(() => props.modelValue, (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active { transition: opacity 0.25s ease; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }

.modal-enter-active .relative,
.modal-leave-active .relative { transition: transform 0.25s ease, opacity 0.25s ease; }
.modal-enter-from .relative,
.modal-leave-to .relative { transform: scale(0.95); opacity: 0; }
</style>
