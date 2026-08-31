<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="modelValue && canAsk" class="fixed inset-0 z-modal flex items-end sm:items-center justify-center"
           @click.self="handleDismiss">
        <div class="fixed inset-0 bg-black/40" @click="handleDismiss" />

        <div class="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-modal p-6 space-y-5 ncm-panel">

          <!-- Progress bar (auto-dismiss timer) -->
          <div class="absolute top-0 left-0 right-0 h-0.5 rounded-full overflow-hidden">
            <div class="h-full bg-brand/30 origin-left" :style="{ transform: `scaleX(${timerProgress})`, transition: 'transform 1s linear' }" />
          </div>

          <!-- Handle on mobile -->
          <div class="w-10 h-1 rounded-full mx-auto sm:hidden" style="background: var(--glass-border);" />

          <div class="flex flex-col items-center text-center gap-3 pt-1">
            <div class="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center text-3xl">🔔</div>
            <div>
              <p class="font-bold text-glass-text-primary text-base">اطلاع‌رسانی‌های {{ settingsStore.siteName }}</p>
              <p class="text-glass-text-secondary text-sm mt-1 leading-relaxed">
                می‌خوای از جدیدترین تخفیف‌ها، پیشنهادهای ویژه و وضعیت سفارشت باخبر بشی؟
              </p>
            </div>
          </div>

          <div class="flex flex-col gap-2.5">
            <button class="btn-brand w-full py-3 rounded-xl text-sm font-medium" @click="handleYes">
              بله، موافقم
            </button>
            <button
              class="w-full py-3 rounded-xl text-sm text-glass-text-secondary border border-glass-border hover:border-brand/40 hover:text-glass-text-primary transition-colors"
              @click="handleDismiss">
              نه ممنون
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { useNotificationPermission } from '~/composables/useNotificationPermission'
import { logger } from '~/utils/logger'
const settingsStore = useSettingsStore()

const CTX = 'NotificationConsentModal'

const props  = defineProps({ modelValue: { type: Boolean, default: false } })
const emit   = defineEmits(['update:modelValue'])

const { canAsk, requestPermission, dismiss } = useNotificationPermission()

const timerProgress = ref(1)
let timerInterval   = null
let secondsLeft     = 15

function startTimer() {
  secondsLeft     = 15
  timerProgress.value = 1
  logger.info('notification consent modal shown — starting 15s auto-dismiss', {}, CTX)
  timerInterval = setInterval(() => {
    secondsLeft--
    timerProgress.value = secondsLeft / 15
    if (secondsLeft <= 0) {
      logger.debug('notification consent auto-dismissed after 15s', {}, CTX)
      close()
    }
  }, 1000)
}

function clearTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
}

function close() {
  clearTimer()
  emit('update:modelValue', false)
}

async function handleYes() {
  logger.info('user accepted notification consent', {}, CTX)
  clearTimer()
  await requestPermission()
  close()
}

function handleDismiss() {
  logger.debug('user dismissed notification consent', {}, CTX)
  dismiss()
  close()
}

watch(() => props.modelValue, (val) => {
  if (val) startTimer()
  else clearTimer()
}, { immediate: true })

onUnmounted(clearTimer)
</script>

<style scoped>
.ncm-panel {
  background: var(--glass-strong);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid var(--glass-border);
  border-bottom: none;
}
@media (min-width: 640px) {
  .ncm-panel { border-bottom: 1px solid var(--glass-border); }
}

.sheet-enter-active,
.sheet-leave-active { transition: opacity 0.25s ease; }
.sheet-enter-from,
.sheet-leave-to     { opacity: 0; }

.sheet-enter-active > div:last-child,
.sheet-leave-active > div:last-child { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-enter-from > div:last-child,
.sheet-leave-to > div:last-child     { transform: translateY(100%); }

@media (min-width: 640px) {
  .sheet-enter-from > div:last-child,
  .sheet-leave-to > div:last-child { transform: scale(0.96) translateY(-8px); }
}
</style>
