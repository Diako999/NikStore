<template>
  <div class="mo">
    <NuxtLink to="/my-orders" class="mo__back">
      <AppIcon name="chevron-right" :size="15" :stroke-width="2" />
      پیگیری سفارش‌ها
    </NuxtLink>

    <p v-if="loading" class="mo__state">در حال بارگذاری...</p>
    <p v-else-if="!order" class="mo__state">
      این سفارش در این مرورگر پیدا نشد یا دیگر معتبر نیست.
    </p>

    <template v-else>
      <section class="mo__panel">
        <div class="mo__row">
          <div>
            <p class="mo__num">{{ order.orderNumber }}</p>
            <p class="mo__date">{{ formatDate(order.createdAt) }}</p>
          </div>
          <span class="mo__badge">{{ statusLabel(order.status) }}</span>
        </div>
        <p class="mo__pay" :class="order.paymentStatus === 'paid' ? 'mo__pay--ok' : 'mo__pay--wait'">
          {{ order.paymentStatus === 'paid' ? 'پرداخت شده' : 'پرداخت نشده' }}
        </p>
        <p v-if="order.status === 'cancelled' && order.cancelReason" class="mo__text">دلیل لغو: {{ order.cancelReason }}</p>
      </section>

      <section v-if="awaitingPayment" class="mo__panel">
        <p class="mo__text">پرداخت این سفارش هنوز انجام نشده است. برای پرداخت با ادمین در تلگرام یا روبیکا گفتگو کنید.</p>
        <PayWithAdmin :order-number="order.orderNumber" :total="order.total" />
      </section>

      <section class="mo__panel">
        <h2 class="mo__h">اقلام سفارش</h2>
        <div v-for="(item, i) in order.items" :key="i" class="mo__item">
          <img v-if="item.thumbnail" :src="item.thumbnail" :alt="item.name" loading="lazy" class="mo__thumb">
          <div class="mo__item-info">
            <p class="mo__item-name">{{ item.name }}</p>
            <p v-if="item.attributes?.length" class="mo__text">{{ item.attributes.map(a => `${a.key}: ${a.value}`).join(' · ') }}</p>
            <p class="mo__text">{{ toPersianDigits(item.quantity) }} عدد · {{ formatPrice(item.price) }}</p>
          </div>
        </div>
        <div class="mo__total"><span>مبلغ نهایی</span><span>{{ formatPrice(order.total) }}</span></div>
      </section>

      <section class="mo__panel">
        <h2 class="mo__h">آدرس ارسال</h2>
        <p class="mo__text">{{ order.shippingAddress.recipientName }} · <bdi>{{ order.shippingAddress.recipientPhone }}</bdi></p>
        <p class="mo__text">{{ order.shippingAddress.province }}، {{ order.shippingAddress.city }}، {{ order.shippingAddress.street }}</p>
        <p class="mo__text">{{ order.shippingAddress.detail }}</p>
        <p class="mo__text">کد پستی: <bdi>{{ order.shippingAddress.postalCode }}</bdi></p>
      </section>

      <button type="button" class="mo__forget" @click="forget">حذف این سفارش از این دستگاه</button>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '~/components/icons/AppIcon.vue'
import PayWithAdmin from '~/components/order/PayWithAdmin.vue'
import { orderService } from '~/services/order.service'
import { formatPrice, toPersianDigits } from '~/utils/format'
import { findGuestOrder, removeGuestOrder } from '~/utils/guestStore'

definePageMeta({ layout: 'default' })
useSeoMeta({ title: 'جزئیات سفارش | نیک', robots: 'noindex' })

const route = useRoute()
const router = useRouter()
const order = ref(null)
const loading = ref(true)

const STATUS = {
  pending: 'در انتظار تایید',
  confirmed: 'تایید شده',
  processing: 'در حال پردازش',
  shipped: 'ارسال شده',
  delivered: 'تحویل داده شده',
  cancelled: 'لغو شده',
}
const statusLabel = (s) => STATUS[s] || s
const awaitingPayment = computed(() => order.value?.status === 'pending' && order.value?.paymentStatus !== 'paid')

function formatDate(v) {
  try {
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(v))
  } catch {
    return ''
  }
}

onMounted(async () => {
  const saved = findGuestOrder(String(route.params.id))
  if (saved) {
    try {
      const { data } = await orderService.lookupGuest(saved.orderId, saved.token)
      order.value = data
    } catch {
      order.value = null
    }
  }
  loading.value = false
})

function forget() {
  removeGuestOrder(String(route.params.id))
  router.replace('/my-orders')
}
</script>

<style scoped>
.mo { padding-bottom: 24px; }
.mo__back { display: inline-flex; align-items: center; gap: 4px; margin: 18px 18px 12px; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); }
.mo__state { padding: 50px 24px; text-align: center; font-size: 13px; color: var(--text-secondary); }
.mo__panel { margin: 0 18px 12px; padding: 14px; border-radius: 16px; background: var(--glass); border: 1px solid var(--glass-border); }
.mo__row { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.mo__num { font-size: 14px; font-weight: 800; color: var(--text-primary); }
.mo__date { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
.mo__badge { font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 999px; background: var(--glass-strong); color: var(--text-primary); }
.mo__pay { margin-top: 8px; font-size: 12px; font-weight: 700; }
.mo__pay--ok { color: #3D8B52; }
.mo__pay--wait { color: #D9A441; }
.mo__h { font-size: 13px; font-weight: 800; color: var(--text-primary); margin-bottom: 10px; }
.mo__text { font-size: 12.5px; line-height: 1.9; color: var(--text-secondary); margin-bottom: 6px; }
.mo__item { display: flex; gap: 10px; margin-bottom: 10px; }
.mo__thumb { width: 52px; height: 52px; border-radius: 10px; object-fit: cover; }
.mo__item-name { font-size: 12.5px; font-weight: 700; color: var(--text-primary); }
.mo__total { display: flex; justify-content: space-between; font-size: 13px; font-weight: 800; color: var(--text-primary); border-top: 1px solid var(--glass-border); padding-top: 10px; }
.mo__forget { display: block; margin: 14px auto 0; font-size: 12px; color: var(--text-secondary); text-decoration: underline; background: none; border: 0; cursor: pointer; }
</style>
