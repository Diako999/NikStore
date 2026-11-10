<template>
  <div>
    <button type="button" class="pay-btn" @click="open = true">
      <AppIcon name="phone" :size="16" :stroke-width="2" />
      تماس با ادمین برای پرداخت
    </button>

    <Teleport to="body">
      <div v-if="open" class="pay-overlay" @click.self="close">
        <div
          class="pay-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pay-dialog-title"
          @keydown.esc="close"
        >
          <button type="button" class="pay-dialog__close" aria-label="بستن" @click="close">
            <AppIcon name="close" :size="16" :stroke-width="2" />
          </button>

          <h2 id="pay-dialog-title" class="pay-dialog__title">پرداخت از طریق ادمین</h2>
          <p class="pay-dialog__sub">
            از کدام پیام‌رسان می‌خواهید با ادمین گفتگو کنید؟ شماره سفارش به‌صورت خودکار همراه پیام ارسال می‌شود.
          </p>

          <p class="pay-dialog__msg" dir="rtl">{{ message }}</p>

          <div class="pay-dialog__actions">
            <button type="button" class="pay-choice pay-choice--telegram" @click="goTelegram">
              تلگرام
            </button>
            <button type="button" class="pay-choice pay-choice--rubika" @click="goRubika">
              روبیکا
            </button>
          </div>

          <p v-if="copied" class="pay-dialog__note" role="status">
            متن پیام کپی شد. در روبیکا آن را در گفتگو الصاق (Paste) کنید.
          </p>
          <p v-else-if="copyFailed" class="pay-dialog__note" role="status">
            شماره سفارش: <bdi>{{ orderNumber }}</bdi> — لطفاً آن را در پیام خود بنویسید.
          </p>

          <button type="button" class="pay-dialog__cancel" @click="close">انصراف</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import AppIcon from '~/components/icons/AppIcon.vue'
import {
  buildPaymentMessage,
  resolveAdminIds,
  rubikaLink,
  telegramLink,
} from '~/utils/orderContact'

const props = defineProps({
  orderNumber: { type: String, required: true },
  total: { type: Number, default: 0 },
})

const { settings } = useSiteSettings()
const ids = computed(() => resolveAdminIds(settings.value?.orderContact))
const message = computed(() => buildPaymentMessage({ orderNumber: props.orderNumber, total: props.total }))

const open = ref(false)
const copied = ref(false)
const copyFailed = ref(false)

function close() {
  open.value = false
  copied.value = false
  copyFailed.value = false
}

function onKey(e) {
  if (e.key === 'Escape') close()
}
watch(open, (v) => {
  if (typeof window === 'undefined') return
  if (v) window.addEventListener('keydown', onKey)
  else window.removeEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('keydown', onKey)
})

function goTelegram() {
  window.open(telegramLink(ids.value.telegram, message.value), '_blank', 'noopener')
  close()
}

async function goRubika() {
  copied.value = false
  copyFailed.value = false
  try {
    await navigator.clipboard.writeText(message.value)
    copied.value = true
  } catch {
    copyFailed.value = true
  }
  window.open(rubikaLink(ids.value.rubika), '_blank', 'noopener')
}
</script>

<style scoped>
.pay-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 13px 20px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, .25);
  background: linear-gradient(135deg, #6EB082 0%, #3D8B52 55%, #2D6B3E 100%);
  box-shadow: 0 8px 22px rgba(0, 0, 0, .35), inset 0 1px 0 rgba(255, 255, 255, .30);
}

.pay-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, .55);
}
@media (min-width: 520px) { .pay-overlay { align-items: center; } }

.pay-dialog {
  position: relative;
  width: 100%;
  max-width: 360px;
  padding: 26px 20px 18px;
  border-radius: 22px;
  background: rgb(var(--bg-rgb));
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  color: var(--text-primary);
}
.pay-dialog__close {
  position: absolute;
  inset-block-start: 12px;
  inset-inline-start: 12px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid var(--glass-border);
  background: var(--glass);
  color: var(--text-primary);
  cursor: pointer;
}
.pay-dialog__title { font-size: 15px; font-weight: 800; margin-bottom: 8px; text-align: center; }
.pay-dialog__sub { font-size: 12.5px; line-height: 1.8; color: var(--text-secondary); text-align: center; margin-bottom: 12px; }
.pay-dialog__msg {
  font-size: 12px;
  line-height: 1.8;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--glass);
  border: 1px dashed var(--glass-border);
  color: var(--text-primary);
  margin-bottom: 14px;
}
.pay-dialog__actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.pay-choice {
  padding: 13px 10px;
  border-radius: 14px;
  font-size: 13.5px;
  font-weight: 800;
  color: #fff;
  cursor: pointer;
  border: 0;
}
.pay-choice--telegram { background: linear-gradient(135deg, #37AEE2, #1E96C8); }
.pay-choice--rubika { background: linear-gradient(135deg, #B03AC4, #7B2D94); }
.pay-dialog__note { margin-top: 12px; font-size: 12px; line-height: 1.8; color: var(--text-secondary); text-align: center; }
.pay-dialog__cancel {
  display: block;
  margin: 14px auto 0;
  padding: 6px 14px;
  font-size: 12.5px;
  color: var(--text-secondary);
  background: none;
  border: 0;
  cursor: pointer;
}
</style>
