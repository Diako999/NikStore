<template>
  <div class="placed-page">
    <div v-if="loading" class="placed-card">
      <p class="placed-title">در حال بارگذاری...</p>
    </div>

    <div v-else-if="!order" class="placed-card">
      <p class="placed-title">سفارش یافت نشد</p>
      <div class="placed-actions">
        <NuxtLink to="/user/orders" class="btn-secondary">سفارش‌های من</NuxtLink>
      </div>
    </div>

    <div v-else class="placed-card">
      <div class="placed-icon">
        <AppIcon name="check" :size="26" :stroke-width="2.4" />
      </div>

      <p class="placed-title">سفارش شما ثبت شد</p>
      <p class="placed-order">شماره سفارش: <bdi>{{ order.orderNumber }}</bdi></p>
      <p class="placed-total">مبلغ قابل پرداخت: {{ formatPrice(order.total) }}</p>
      <p class="placed-sub">
        برای نهایی شدن سفارش، پرداخت را از طریق گفتگو با ادمین در تلگرام یا روبیکا انجام دهید.
        پس از تایید پرداخت توسط ادمین، وضعیت سفارش شما به‌روزرسانی می‌شود.
      </p>

      <div class="placed-actions">
        <PayWithAdmin :order-number="order.orderNumber" :total="order.total" />
        <NuxtLink :to="detailLink" class="btn-secondary">مشاهده سفارش</NuxtLink>
        <p v-if="isGuestOrder" class="placed-local">
          اطلاعات این سفارش در همین مرورگر ذخیره شد. بعداً از بخش «پیگیری سفارش‌ها» می‌توانید آن را ببینید؛ اگر حافظه مرورگر را پاک کنید دسترسی به آن از بین می‌رود، پس شماره سفارش را نگه دارید.
        </p>
        <NuxtLink to="/" class="btn-secondary">بازگشت به فروشگاه</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '~/components/icons/AppIcon.vue'
import PayWithAdmin from '~/components/order/PayWithAdmin.vue'
import { orderService } from '~/services/order.service'
import { formatPrice } from '~/utils/format'
import { useAuthStore } from '~/stores/auth.store'
import { findGuestOrder } from '~/utils/guestStore'

definePageMeta({ layout: 'auth' })
useSeoMeta({ title: 'ثبت سفارش | نیک', robots: 'noindex' })

const route = useRoute()
const auth = useAuthStore()
const order = ref(null)
const isGuestOrder = ref(false)
const detailLink = computed(() =>
  isGuestOrder.value ? `/my-orders/${order.value._id}` : `/user/orders/${order.value._id}`)
const loading = ref(true)

onMounted(async () => {
  try {
    const orderId = route.query.orderId ? String(route.query.orderId) : ''
    if (orderId) {
      // A guest order is opened with the secret saved in this browser at checkout;
      // an account order is opened with the login session.
      const saved = findGuestOrder(orderId)
      if (saved) {
        const { data } = await orderService.lookupGuest(orderId, saved.token)
        order.value = data
        isGuestOrder.value = true
      } else if (auth.isLoggedIn) {
        const { data } = await orderService.getMineById(orderId)
        order.value = data
      }
    }
  } catch {
    order.value = null
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.placed-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
.placed-card {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px 22px;
  border-radius: 22px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
}
[data-theme='light'] .placed-card { box-shadow: var(--glass-shadow); }
.placed-icon {
  width: 68px; height: 68px; border-radius: 50%; margin-bottom: 18px; color: #fff;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #6EB082 0%, #3D8B52 55%, #2D6B3E 100%);
}
.placed-title { font-size: 15.5px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; }
.placed-order { font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.placed-total { font-size: 13px; color: var(--text-primary); margin-bottom: 10px; }
.placed-local { font-size: 12px; line-height: 1.9; color: var(--text-secondary); margin-top: 6px; }
.placed-sub { font-size: 12.5px; line-height: 1.9; color: var(--text-secondary); }
.placed-actions { display: flex; flex-direction: column; gap: 10px; width: 100%; margin-top: 24px; }
.btn-secondary {
  display: flex; align-items: center; justify-content: center; width: 100%;
  font-weight: 700; font-size: 13px; padding: 12px 20px; border-radius: 999px; cursor: pointer;
  color: var(--text-primary); background: transparent; border: 1px solid var(--glass-border);
}
</style>
