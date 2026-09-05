<template>
  <div class="result-page">
    <div v-if="verifying" class="result-card">
      <div class="result-icon result-icon--pending">
        <AppIcon name="card" :size="26" :stroke-width="1.6" />
      </div>
      <p class="result-title">در حال بررسی پرداخت...</p>
      <p class="result-sub">لطفا چند لحظه صبر کنید</p>
    </div>

    <div v-else class="result-card">
      <div class="result-icon" :class="success ? 'result-icon--success' : 'result-icon--fail'">
        <AppIcon :name="success ? 'check' : 'close'" :size="26" :stroke-width="2.4" />
      </div>

      <p class="result-title">{{ success ? 'پرداخت با موفقیت انجام شد' : 'پرداخت ناموفق بود' }}</p>
      <p class="result-sub">{{ message }}</p>
      <p v-if="refId" class="result-ref">کد پیگیری: {{ toPersianDigits(refId) }}</p>

      <div class="result-actions">
        <NuxtLink v-if="success && orderId" :to="`/user/orders/${orderId}`" class="btn-primary">
          مشاهده سفارش
        </NuxtLink>
        <NuxtLink v-else-if="!success" to="/cart" class="btn-primary">
          بازگشت به سبد خرید
        </NuxtLink>
        <NuxtLink to="/" class="btn-secondary">
          بازگشت به فروشگاه
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '~/components/icons/AppIcon.vue'
import { toPersianDigits } from '~/utils/format'
import { paymentService } from '~/services/payment.service'

definePageMeta({ layout: 'auth', middleware: 'auth' })

const route = useRoute()

const orderId = route.query.orderId || null
const authority = route.query.authority || route.query.Authority || null
const status = route.query.status || route.query.Status || ''

const verifying = ref(true)
const success = ref(false)
const message = ref('')
const refId = ref('')

async function run() {
  if (!authority) {
    verifying.value = false
    success.value = !!orderId
    message.value = orderId
      ? 'سفارش شما ثبت شد'
      : 'اطلاعات پرداخت یافت نشد'
    return
  }

  try {
    const { data } = await paymentService.verify(authority, status)
    success.value = !!data.success
    message.value = data.message || (success.value ? 'پرداخت با موفقیت تایید شد' : 'پرداخت تایید نشد')
    refId.value = data.refId || ''
  } catch {
    success.value = false
    message.value = 'خطا در بررسی وضعیت پرداخت'
  } finally {
    verifying.value = false
  }
}

run()
</script>

<style scoped>
.result-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.result-card {
  width: 100%;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px 24px;
  border-radius: 22px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
}
[data-theme='light'] .result-card {
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  box-shadow: var(--glass-shadow);
}

.result-icon {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  color: #fff;
}
.result-icon--pending { background: var(--glass-strong); color: var(--text-secondary); }
.result-icon--success { background: linear-gradient(135deg, #6EB082 0%, #3D8B52 55%, #2D6B3E 100%); }
.result-icon--fail { background: linear-gradient(135deg, #E8848C 0%, #C24C55 100%); }

.result-title { font-size: 15.5px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px; }
.result-sub { font-size: 12.5px; color: var(--text-secondary); line-height: 1.6; }
.result-ref { font-size: 11.5px; color: var(--text-disabled); margin-top: 8px; }

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  margin-top: 26px;
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  font-weight: 700;
  font-size: 13px;
  padding: 12px 20px;
  border-radius: 999px;
  cursor: pointer;
}
.btn-primary {
  color: #fff;
  border: 1px solid rgba(255, 255, 255, .25);
  background: linear-gradient(135deg, #6EB082 0%, #3D8B52 55%, #2D6B3E 100%);
  box-shadow: 0 8px 22px rgba(0, 0, 0, .35), inset 0 1px 0 rgba(255, 255, 255, .30);
}
[data-theme='light'] .btn-primary {
  border-color: rgba(255, 255, 255, .3);
  box-shadow: 0 10px 22px rgba(40, 55, 46, .30), inset 0 1px 0 rgba(255, 255, 255, .35);
}
.btn-secondary {
  color: var(--text-primary);
  background: transparent;
  border: 1px solid var(--glass-border);
}
</style>
