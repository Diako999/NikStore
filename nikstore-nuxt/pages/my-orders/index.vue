<template>
  <div class="mo">
    <SectionHead title="پیگیری سفارش‌ها" />
    <p class="mo__hint">
      سفارش‌هایی که بدون حساب کاربری ثبت کرده‌اید، در همین مرورگر ذخیره شده‌اند.
    </p>

    <div class="mo__panel">
      <div v-if="loading" class="mo__list">
        <div v-for="i in 2" :key="i" class="mo__skel" />
      </div>

      <p v-else-if="!rows.length" class="mo__empty">
        سفارشی در این مرورگر پیدا نشد. اگر با حساب کاربری سفارش داده‌اید، وارد حساب خود شوید.
      </p>

      <div v-else class="mo__list">
        <NuxtLink v-for="row in rows" :key="row.orderId" :to="`/my-orders/${row.orderId}`" class="mo__card">
          <div class="mo__top">
            <span class="mo__num">{{ row.orderNumber }}</span>
            <span v-if="row.live" class="mo__badge">{{ statusLabel(row.live.status) }}</span>
            <span v-else class="mo__badge mo__badge--muted">{{ row.failed ? 'نامشخص' : '...' }}</span>
          </div>
          <div class="mo__meta">
            <span>{{ formatDate(row.createdAt) }}</span>
            <span>{{ formatPrice(row.live?.total ?? row.total) }}</span>
          </div>
          <p v-if="row.live" class="mo__pay" :class="row.live.paymentStatus === 'paid' ? 'mo__pay--ok' : 'mo__pay--wait'">
            {{ row.live.paymentStatus === 'paid' ? 'پرداخت شده' : 'پرداخت نشده' }}
          </p>
        </NuxtLink>
      </div>
    </div>

    <NuxtLink to="/auth/login" class="mo__login">ورود به حساب کاربری</NuxtLink>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import SectionHead from '~/components/ui/SectionHead.vue'
import { orderService } from '~/services/order.service'
import { formatPrice } from '~/utils/format'
import { loadGuestOrders } from '~/utils/guestStore'

definePageMeta({ layout: 'default' })
useSeoMeta({ title: 'پیگیری سفارش‌ها | نیک', robots: 'noindex' })

const STATUS = {
  pending: 'در انتظار تایید',
  confirmed: 'تایید شده',
  processing: 'در حال پردازش',
  shipped: 'ارسال شده',
  delivered: 'تحویل داده شده',
  cancelled: 'لغو شده',
}
const statusLabel = (s) => STATUS[s] || s

const rows = ref([])
const loading = ref(true)

function formatDate(v) {
  try {
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(v))
  } catch {
    return ''
  }
}

onMounted(async () => {
  rows.value = loadGuestOrders().map((o) => ({ ...o, live: null, failed: false }))
  loading.value = false
  // Refresh each order's live status from the server using its saved secret.
  await Promise.all(rows.value.map(async (row) => {
    try {
      const { data } = await orderService.lookupGuest(row.orderId, row.token)
      row.live = data
    } catch {
      row.failed = true
    }
  }))
})
</script>

<style scoped>
.mo__hint { font-size: 12.5px; line-height: 1.9; color: var(--text-secondary); margin: 0 18px 12px; }
.mo__panel { margin: 0 18px; }
.mo__list { display: flex; flex-direction: column; gap: 10px; }
.mo__skel { height: 78px; border-radius: 16px; background: var(--glass); }
.mo__empty { padding: 36px 8px; text-align: center; font-size: 12.5px; line-height: 1.9; color: var(--text-secondary); }
.mo__card {
  display: block; padding: 14px; border-radius: 16px;
  background: var(--glass); border: 1px solid var(--glass-border); color: var(--text-primary);
}
.mo__top { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; }
.mo__num { font-size: 13px; font-weight: 800; }
.mo__badge { font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 999px; background: var(--glass-strong); }
.mo__badge--muted { color: var(--text-disabled); }
.mo__meta { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary); }
.mo__pay { margin-top: 8px; font-size: 12px; font-weight: 700; }
.mo__pay--ok { color: #3D8B52; }
.mo__pay--wait { color: #D9A441; }
.mo__login { display: block; text-align: center; margin: 18px; font-size: 12.5px; color: var(--text-secondary); text-decoration: underline; }
</style>
