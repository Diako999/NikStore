<template>
  <div class="order-detail">
    <div class="order-detail__head">
      <div>
        <h1 class="order-detail__title">سفارش {{ order?.orderNumber || '' }}</h1>
        <AdminBadge v-if="order" :variant="ORDER_STATUS_BADGE[order.status] || 'neutral'">
          {{ ORDER_STATUS_LABELS[order.status] || order.status }}
        </AdminBadge>
        <AdminBadge v-if="order" :variant="PAYMENT_STATUS_BADGE[paymentStatus] || 'neutral'">
          {{ PAYMENT_STATUS_LABELS[paymentStatus] }}
        </AdminBadge>
      </div>
      <router-link to="/orders">
        <AdminButton variant="secondary" size="sm">بازگشت به فهرست</AdminButton>
      </router-link>
    </div>

    <div v-if="loadError" class="order-detail__error">{{ loadError }}</div>

    <div v-if="order" class="order-detail__grid">
      <div class="order-detail__main">
        <AdminCard title="اقلام سفارش" flush>
          <AdminTable :columns="itemColumns" :rows="order.items || []">
            <template #cell-name="{ row }">
              <div class="order-detail__item-cell">
                <img v-if="row.thumbnail" :src="row.thumbnail" class="order-detail__item-thumb" alt="">
                <div>
                  <div class="order-detail__item-name">{{ row.name }}</div>
                  <div v-if="row.attributes?.length" class="order-detail__item-attrs">
                    {{ row.attributes.map((a) => `${a.name}: ${a.value}`).join(' / ') }}
                  </div>
                </div>
              </div>
            </template>
            <template #cell-price="{ value }">{{ formatPrice(value) }}</template>
            <template #cell-quantity="{ value }">{{ value }}</template>
          </AdminTable>
        </AdminCard>

        <AdminCard v-if="order.isGuest" title="مشتری مهمان">
          <p class="order-detail__note">
            این سفارش بدون حساب کاربری ثبت شده است. برای هماهنگی با شماره
            <bdi>{{ order.shippingAddress?.recipientPhone }}</bdi> تماس بگیرید.
          </p>
        </AdminCard>

        <AdminCard title="آدرس ارسال">
          <div v-if="order.shippingAddress" class="order-detail__address">
            <p>{{ order.shippingAddress.recipientName }} — {{ order.shippingAddress.recipientPhone }}</p>
            <p>{{ order.shippingAddress.province }}، {{ order.shippingAddress.city }}</p>
            <p>{{ order.shippingAddress.street }}</p>
            <p>{{ order.shippingAddress.detail }}</p>
            <p>کد پستی: {{ order.shippingAddress.postalCode }}</p>
          </div>
        </AdminCard>
      </div>

      <div class="order-detail__side">
        <AdminCard title="خلاصه مالی">
          <div class="order-detail__summary-row">
            <span>جمع جزء</span>
            <span>{{ formatPrice(order.subtotal) }}</span>
          </div>
          <div class="order-detail__summary-row">
            <span>تخفیف</span>
            <span>{{ formatPrice(order.discount) }}</span>
          </div>
          <div class="order-detail__summary-row order-detail__summary-row--total">
            <span>مبلغ نهایی</span>
            <span>{{ formatPrice(order.total) }}</span>
          </div>
          <p v-if="order.couponCode" class="order-detail__coupon">کد تخفیف: {{ order.couponCode }}</p>
          <p v-if="order.note" class="order-detail__note">یادداشت مشتری: {{ order.note }}</p>
          <p v-if="order.cancelReason" class="order-detail__note">دلیل لغو: {{ order.cancelReason }}</p>
        </AdminCard>

        <AdminCard title="وضعیت پرداخت">
          <AdminBadge :variant="PAYMENT_STATUS_BADGE[paymentStatus] || 'neutral'">
            {{ PAYMENT_STATUS_LABELS[paymentStatus] }}
          </AdminBadge>
          <p v-if="order.paidAt" class="order-detail__note">زمان ثبت پرداخت: {{ formatDateTime(order.paidAt) }}</p>
          <p class="order-detail__note">
            مشتری پرداخت را در گفتگوی تلگرام/روبیکا با شماره سفارش <bdi>{{ order.orderNumber }}</bdi> انجام می‌دهد.
            پس از دریافت وجه، پرداخت را اینجا ثبت کنید.
          </p>
          <p v-if="paymentError" class="order-detail__error">{{ paymentError }}</p>

          <div v-if="order.status !== 'cancelled'" class="order-detail__transitions">
            <template v-if="paymentStatus === 'unpaid'">
              <AdminButton v-if="!confirmingPaid" size="sm" @click="confirmingPaid = true">
                ثبت پرداخت
              </AdminButton>
              <template v-else>
                <AdminButton size="sm" :loading="updating" @click="setPayment('paid')">
                  تایید: مبلغ {{ formatPrice(order.total) }} دریافت شد
                </AdminButton>
                <AdminButton variant="secondary" size="sm" @click="confirmingPaid = false">انصراف</AdminButton>
              </template>
            </template>
            <AdminButton
              v-else-if="['pending', 'confirmed'].includes(order.status)"
              variant="secondary"
              size="sm"
              :loading="updating"
              @click="setPayment('unpaid')"
            >
              بازگرداندن به «پرداخت نشده»
            </AdminButton>
          </div>
        </AdminCard>

        <AdminCard title="تغییر وضعیت">
          <div v-if="availableTransitions.length" class="order-detail__transitions">
            <AdminButton
              v-for="next in availableTransitions"
              :key="next"
              variant="secondary"
              size="sm"
              :loading="updating"
              @click="changeStatus(next)"
            >
              {{ ORDER_STATUS_LABELS[next] }}
            </AdminButton>
          </div>
          <p v-else class="order-detail__no-transitions">این سفارش در وضعیت نهایی است</p>
        </AdminCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AdminCard from '../../components/common/AdminCard.vue'
import AdminTable from '../../components/common/AdminTable.vue'
import AdminButton from '../../components/common/AdminButton.vue'
import AdminBadge from '../../components/common/AdminBadge.vue'
import { orderService } from '../../services/order.service'
import { formatPrice, formatDateTime } from '../../utils/format'
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_BADGE,
  ORDER_TRANSITIONS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_BADGE,
} from '../../constants/orderStatus'

const route = useRoute()
const order = ref(null)
const loadError = ref('')
const updating = ref(false)
const confirmingPaid = ref(false)
const paymentError = ref('')

const itemColumns = [
  { key: 'name', label: 'کالا' },
  { key: 'price', label: 'قیمت واحد', align: 'end' },
  { key: 'quantity', label: 'تعداد', align: 'center', width: '90px' },
]

const paymentStatus = computed(() => order.value?.paymentStatus || 'unpaid')
const availableTransitions = computed(() => ORDER_TRANSITIONS[order.value?.status] || [])

async function load() {
  loadError.value = ''
  try {
    const { data } = await orderService.adminGet(route.params.id)
    order.value = data
  } catch (error) {
    loadError.value = error.response?.data?.message || 'دریافت سفارش با خطا مواجه شد'
  }
}

async function changeStatus(status) {
  updating.value = true
  try {
    await orderService.updateStatus(route.params.id, { status })
    await load()
  } finally {
    updating.value = false
  }
}

async function setPayment(next) {
  updating.value = true
  paymentError.value = ''
  try {
    await orderService.updatePaymentStatus(route.params.id, { paymentStatus: next })
    confirmingPaid.value = false
    await load()
  } catch (error) {
    paymentError.value = error.response?.data?.message || 'ثبت وضعیت پرداخت با خطا مواجه شد'
  } finally {
    updating.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.order-detail { display: flex; flex-direction: column; gap: 20px; }
.order-detail__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.order-detail__title { font-size: 20px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
.order-detail__error { padding: 12px 16px; border-radius: 12px; background: rgba(214, 87, 87, .12); color: #d65757; font-size: 13px; }
.order-detail__grid { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start; }
@media (max-width: 960px) { .order-detail__grid { grid-template-columns: 1fr; } }
.order-detail__main, .order-detail__side { display: flex; flex-direction: column; gap: 16px; }
.order-detail__item-cell { display: flex; align-items: center; gap: 10px; }
.order-detail__item-thumb { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; background: var(--glass); }
.order-detail__item-name { font-weight: 600; color: var(--text-primary); font-size: 13px; }
.order-detail__item-attrs { font-size: 11px; color: var(--text-secondary); }
.order-detail__address { font-size: 13px; color: var(--text-primary); line-height: 2; }
.order-detail__summary-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-secondary); padding: 6px 0; }
.order-detail__summary-row--total { font-weight: 700; color: var(--text-primary); border-top: 1px solid var(--glass-border); margin-top: 4px; padding-top: 10px; }
.order-detail__coupon, .order-detail__note { font-size: 12px; color: var(--text-secondary); margin-top: 10px; }
.order-detail__transitions { display: flex; flex-wrap: wrap; gap: 8px; }
.order-detail__no-transitions { font-size: 12.5px; color: var(--text-secondary); }
</style>
