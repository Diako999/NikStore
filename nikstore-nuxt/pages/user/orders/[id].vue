<template>
  <div class="order-detail">
    <div class="head">
      <NuxtLink to="/user/orders" class="back-link">
        <AppIcon name="chevron-right" :size="15" :stroke-width="2" />
        سفارش‌های من
      </NuxtLink>
    </div>

    <div v-if="loading" class="empty-hint">در حال بارگذاری...</div>
    <p v-else-if="!order" class="empty-hint">سفارش یافت نشد</p>

    <template v-else>
      <section class="panel summary">
        <div class="summary__top">
          <div>
            <p class="summary__num">{{ toPersianDigits(order.orderNumber) }}</p>
            <p class="summary__date">{{ formatDate(order.createdAt) }}</p>
          </div>
          <span class="status-badge" :class="`status-badge--${order.status}`">{{ statusLabel(order.status) }}</span>
        </div>
        <p v-if="order.status === 'cancelled' && order.cancelReason" class="summary__cancel-reason">
          دلیل لغو: {{ order.cancelReason }}
        </p>
      </section>

      <div class="section-gap" />

      <SectionHead title="اقلام سفارش" />
      <section class="panel">
        <div class="items">
          <div v-for="(item, i) in order.items" :key="i" class="item">
            <div class="item__thumb">
              <img v-if="item.thumbnail" :src="item.thumbnail" :alt="item.name" loading="lazy">
            </div>
            <div class="item__info">
              <p class="item__name">{{ item.name }}</p>
              <p v-if="item.attributes?.length" class="item__attrs">
                {{ item.attributes.map(a => `${a.key}: ${a.value}`).join(' · ') }}
              </p>
              <div class="item__bottom">
                <span class="item__qty">{{ toPersianDigits(item.quantity) }} عدد</span>
                <span class="item__price">{{ formatPrice(item.price) }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="section-gap" />

      <SectionHead title="آدرس ارسال" />
      <section class="panel">
        <div class="addr">
          <p class="addr__line addr__line--strong">{{ order.shippingAddress.recipientName }} · <bdi>{{ toPersianDigits(order.shippingAddress.recipientPhone) }}</bdi></p>
          <p class="addr__line">{{ order.shippingAddress.province }}، {{ order.shippingAddress.city }}، {{ order.shippingAddress.street }}</p>
          <p class="addr__line">{{ order.shippingAddress.detail }}</p>
          <p class="addr__line">کد پستی: <bdi>{{ toPersianDigits(order.shippingAddress.postalCode) }}</bdi></p>
        </div>
      </section>

      <div class="section-gap" />

      <SectionHead title="جزئیات پرداخت" />
      <section class="panel">
        <div class="totals">
          <div class="totals__row">
            <span>جمع کالاها</span>
            <span>{{ formatPrice(order.subtotal) }}</span>
          </div>
          <div v-if="order.discount" class="totals__row totals__row--discount">
            <span>تخفیف{{ order.couponCode ? ` (${order.couponCode})` : '' }}</span>
            <span>-{{ formatPrice(order.discount) }}</span>
          </div>
          <div class="totals__row totals__row--total">
            <span>مبلغ نهایی</span>
            <span>{{ formatPrice(order.total) }}</span>
          </div>
        </div>
        <p v-if="order.note" class="order-note">یادداشت: {{ order.note }}</p>
      </section>

      <div v-if="cancellable" class="section-gap" />

      <section v-if="cancellable" class="panel">
        <p v-if="cancelError" class="msg msg--error">{{ cancelError }}</p>

        <div v-if="!confirmingCancel" class="cancel-row">
          <button type="button" class="btn-danger-outline" @click="confirmingCancel = true">لغو سفارش</button>
        </div>
        <div v-else class="cancel-confirm">
          <p class="cancel-confirm__text">از لغو این سفارش مطمئن هستید؟</p>
          <div class="cancel-confirm__actions">
            <button type="button" class="btn-ghost" @click="confirmingCancel = false">انصراف</button>
            <button type="button" class="btn-danger" :disabled="cancelling" @click="onCancel">
              {{ cancelling ? 'در حال لغو...' : 'بله، لغو شود' }}
            </button>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '~/components/icons/AppIcon.vue'
import SectionHead from '~/components/ui/SectionHead.vue'
import { orderService } from '~/services/order.service'
import { formatPrice, toPersianDigits } from '~/utils/format'

definePageMeta({ layout: 'default', middleware: 'auth' })
useSeoMeta({ title: 'جزئیات سفارش | نیک' })

const route = useRoute()

const STATUS_LABELS = {
  pending: 'در انتظار تایید',
  confirmed: 'تایید شده',
  processing: 'در حال پردازش',
  shipped: 'ارسال شده',
  delivered: 'تحویل داده شده',
  cancelled: 'لغو شده',
}
function statusLabel(s) { return STATUS_LABELS[s] || s }

const CANCELLABLE_STATUSES = ['pending', 'confirmed', 'processing']

const order = ref(null)
const loading = ref(true)

async function loadOrder() {
  loading.value = true
  try {
    const { data } = await orderService.getMineById(route.params.id)
    order.value = data
  } catch {
    order.value = null
  } finally {
    loading.value = false
  }
}
onMounted(loadOrder)

const cancellable = computed(() => order.value && CANCELLABLE_STATUSES.includes(order.value.status))

const confirmingCancel = ref(false)
const cancelling = ref(false)
const cancelError = ref('')

async function onCancel() {
  cancelling.value = true
  cancelError.value = ''
  try {
    await orderService.cancelMine(route.params.id)
    await loadOrder()
    confirmingCancel.value = false
  } catch (e) {
    cancelError.value = e.response?.data?.message || 'لغو سفارش با خطا مواجه شد'
  } finally {
    cancelling.value = false
  }
}

function formatDate(value) {
  if (!value) return ''
  try {
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  } catch {
    return ''
  }
}
</script>

<style scoped>
.order-detail { padding: 20px 0 8px; }
.section-gap { height: 22px; }

.head { padding: 0 18px 16px; }
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text-secondary);
}

.panel { margin: 0 18px; }
.empty-hint { font-size: 12.5px; color: var(--text-secondary); padding: 0 18px; }

.summary {
  padding: 16px;
  border-radius: 16px;
  border: 1px solid transparent;
  background:
    linear-gradient(120deg, rgba(61, 139, 82, .38), rgba(122, 90, 220, .20)) padding-box,
    linear-gradient(120deg, rgba(255, 255, 255, .4), rgba(255, 255, 255, .03) 60%) border-box;
  backdrop-filter: blur(16px) saturate(160%);
}
[data-theme='light'] .summary {
  border-width: 1.5px;
  box-shadow: var(--glass-shadow);
  background:
    linear-gradient(120deg, rgba(110, 176, 130, .50), rgba(122, 90, 220, .22)) padding-box,
    linear-gradient(120deg, rgba(255, 255, 255, 1), rgba(255, 255, 255, .2) 60%) border-box;
}
.summary__top { display: flex; align-items: flex-start; justify-content: space-between; }
.summary__num { font-size: 14px; font-weight: 700; color: var(--text-primary); unicode-bidi: plaintext; margin-bottom: 3px; }
.summary__date { font-size: 11.5px; color: var(--text-secondary); }
.summary__cancel-reason { margin-top: 10px; font-size: 12px; color: #E8837F; }

.status-badge {
  font-size: 10.5px;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 999px;
  color: #fff;
  white-space: nowrap;
}
.status-badge--pending { background: linear-gradient(135deg, rgba(231, 175, 66, .95), rgba(180, 130, 40, .9)); }
.status-badge--confirmed,
.status-badge--processing { background: linear-gradient(135deg, rgba(122, 90, 220, .9), rgba(90, 60, 190, .9)); }
.status-badge--shipped { background: linear-gradient(135deg, rgba(110, 176, 130, .95), rgba(61, 139, 82, .9)); }
.status-badge--delivered { background: linear-gradient(135deg, rgba(61, 139, 82, .95), rgba(45, 107, 62, .92)); }
.status-badge--cancelled { background: linear-gradient(135deg, rgba(232, 131, 127, .95), rgba(180, 70, 65, .9)); }

.items { display: flex; flex-direction: column; gap: 14px; }
.item { display: flex; gap: 12px; }
.item__thumb {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--glass);
}
.item__thumb img { width: 100%; height: 100%; object-fit: cover; }
.item__info { flex: 1; min-width: 0; }
.item__name { font-size: 12.5px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; line-height: 1.4; }
.item__attrs { font-size: 11px; color: var(--text-secondary); margin-bottom: 6px; }
.item__bottom { display: flex; align-items: center; justify-content: space-between; }
.item__qty { font-size: 11px; color: var(--text-secondary); }
.item__price { font-size: 12.5px; font-weight: 700; color: var(--brand-light); }
[data-theme='light'] .item__price { color: var(--brand-dark); }

.addr { display: flex; flex-direction: column; gap: 6px; }
.addr__line { font-size: 12.5px; color: var(--text-secondary); line-height: 1.6; }
.addr__line--strong { color: var(--text-primary); font-weight: 600; }

.totals { display: flex; flex-direction: column; gap: 8px; }
.totals__row { display: flex; align-items: center; justify-content: space-between; font-size: 12.5px; color: var(--text-secondary); }
.totals__row--discount { color: var(--brand-light); }
[data-theme='light'] .totals__row--discount { color: var(--brand-dark); }
.totals__row--total {
  padding-top: 10px;
  margin-top: 4px;
  border-top: 1px solid var(--glass-border);
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}
.order-note { margin-top: 12px; font-size: 11.5px; color: var(--text-secondary); }

.msg { font-size: 12px; margin: 0 0 10px; }
.msg--error { color: #E8837F; }

.cancel-row { display: flex; }
.btn-danger-outline {
  width: 100%;
  padding: 13px;
  border-radius: 999px;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 700;
  color: #E8837F;
  background: transparent;
  border: 1px solid rgba(232, 131, 127, .5);
  cursor: pointer;
}

.cancel-confirm { text-align: center; }
.cancel-confirm__text { font-size: 12.5px; color: var(--text-primary); margin-bottom: 12px; }
.cancel-confirm__actions { display: flex; gap: 10px; }
.btn-ghost {
  flex: 1;
  padding: 12px;
  border-radius: 999px;
  border: 1px solid var(--glass-border);
  color: var(--text-secondary);
  font-weight: 700;
  font-size: 13px;
  font-family: inherit;
  background: transparent;
  cursor: pointer;
}
.btn-danger {
  flex: 1;
  padding: 12px;
  border-radius: 999px;
  border: none;
  color: #fff;
  font-weight: 700;
  font-size: 13px;
  font-family: inherit;
  background: linear-gradient(135deg, #E8837F, #C4544E);
  cursor: pointer;
}
.btn-danger:disabled { opacity: .6; cursor: not-allowed; }
</style>
