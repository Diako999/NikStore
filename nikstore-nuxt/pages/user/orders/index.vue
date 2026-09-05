<template>
  <div class="orders">
    <SectionHead title="سفارش‌های من" />

    <div class="filters">
      <button
        v-for="f in filters"
        :key="f.value || 'all'"
        type="button"
        class="filter-chip"
        :class="{ 'filter-chip--active': status === f.value }"
        @click="setStatus(f.value)"
      >
        {{ f.label }}
      </button>
    </div>

    <div class="panel">
      <div v-if="loading" class="list">
        <div v-for="i in 3" :key="i" class="skel" />
      </div>

      <p v-else-if="!orders.length" class="empty-hint">سفارشی در این وضعیت یافت نشد</p>

      <div v-else class="list">
        <NuxtLink v-for="order in orders" :key="order._id" :to="`/user/orders/${order._id}`" class="order-card">
          <div class="order-card__top">
            <span class="order-card__num">{{ toPersianDigits(order.orderNumber) }}</span>
            <span class="status-badge" :class="`status-badge--${order.status}`">{{ statusLabel(order.status) }}</span>
          </div>
          <p class="order-card__date">{{ formatDate(order.createdAt) }}</p>
          <div class="order-card__bottom">
            <span class="order-card__count">{{ toPersianDigits(order.items?.length || 0) }} کالا</span>
            <span class="order-card__price">{{ formatPrice(order.total) }}</span>
          </div>
        </NuxtLink>
      </div>

      <div v-if="totalPages > 1" class="pager">
        <button type="button" class="pager__btn" :disabled="page <= 1" @click="page--">
          <AppIcon name="chevron-right" :size="14" :stroke-width="2" />
        </button>
        <span class="pager__label">{{ toPersianDigits(page) }} از {{ toPersianDigits(totalPages) }}</span>
        <button type="button" class="pager__btn" :disabled="page >= totalPages" @click="page++">
          <AppIcon name="chevron-left" :size="14" :stroke-width="2" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import AppIcon from '~/components/icons/AppIcon.vue'
import SectionHead from '~/components/ui/SectionHead.vue'
import { orderService } from '~/services/order.service'
import { formatPrice, toPersianDigits } from '~/utils/format'

definePageMeta({ layout: 'default', middleware: 'auth' })
useSeoMeta({ title: 'سفارش‌های من | نیک' })

const STATUS_LABELS = {
  pending: 'در انتظار تایید',
  confirmed: 'تایید شده',
  processing: 'در حال پردازش',
  shipped: 'ارسال شده',
  delivered: 'تحویل داده شده',
  cancelled: 'لغو شده',
}
function statusLabel(s) { return STATUS_LABELS[s] || s }

const filters = [
  { label: 'همه', value: '' },
  { label: 'در انتظار', value: 'pending' },
  { label: 'در حال پردازش', value: 'processing' },
  { label: 'ارسال شده', value: 'shipped' },
  { label: 'تحویل شده', value: 'delivered' },
  { label: 'لغو شده', value: 'cancelled' },
]

const status = ref('')
const page = ref(1)
const orders = ref([])
const totalPages = ref(1)
const loading = ref(false)

function setStatus(value) {
  status.value = value
  page.value = 1
}

async function loadOrders() {
  loading.value = true
  try {
    const { data } = await orderService.getMine({
      page: page.value,
      limit: 10,
      ...(status.value ? { status: status.value } : {}),
    })
    orders.value = data.orders || []
    totalPages.value = data.totalPages || 1
  } finally {
    loading.value = false
  }
}

onMounted(loadOrders)
watch([status, page], loadOrders)

function formatDate(value) {
  if (!value) return ''
  try {
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value))
  } catch {
    return ''
  }
}
</script>

<style scoped>
.orders { padding: 24px 0 8px; }

.filters {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 0 18px 16px;
  scrollbar-width: none;
}
.filters::-webkit-scrollbar { display: none; }
.filter-chip {
  flex: 0 0 auto;
  padding: 8px 14px;
  border-radius: 999px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  color: var(--text-secondary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  cursor: pointer;
}
.filter-chip--active {
  color: #fff;
  background: linear-gradient(135deg, #6EB082 0%, #3D8B52 55%, #2D6B3E 100%);
  border-color: transparent;
}

.panel { margin: 0 18px; }

.list { display: flex; flex-direction: column; gap: 12px; }
.skel { height: 92px; border-radius: 16px; background: var(--glass); animation: pulse 1.6s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .6; } }

.empty-hint { font-size: 12.5px; color: var(--text-secondary); padding: 8px 2px; }

.order-card {
  display: block;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid transparent;
  background:
    linear-gradient(var(--glass), var(--glass)) padding-box,
    linear-gradient(150deg, rgba(255, 255, 255, .42), rgba(255, 255, 255, .03) 55%, rgba(231, 175, 66, .28)) border-box;
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
}
[data-theme='light'] .order-card {
  border-width: 1.5px;
  box-shadow: var(--glass-shadow);
  background:
    linear-gradient(var(--glass), var(--glass)) padding-box,
    linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(231, 175, 66, .5) 55%, rgba(122, 90, 220, .4) 100%) border-box;
}

.order-card__top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.order-card__num { font-size: 12.5px; font-weight: 700; color: var(--text-primary); unicode-bidi: plaintext; }
.order-card__date { font-size: 11px; color: var(--text-secondary); margin-bottom: 10px; }

.order-card__bottom { display: flex; align-items: center; justify-content: space-between; }
.order-card__count { font-size: 11.5px; color: var(--text-secondary); }
.order-card__price { font-size: 13px; font-weight: 700; color: var(--brand-light); }
[data-theme='light'] .order-card__price { color: var(--brand-dark); }

.status-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 4px 9px;
  border-radius: 999px;
  color: #fff;
  background: rgba(158, 158, 158, .35);
}
.status-badge--pending { background: linear-gradient(135deg, rgba(231, 175, 66, .95), rgba(180, 130, 40, .9)); }
.status-badge--confirmed,
.status-badge--processing { background: linear-gradient(135deg, rgba(122, 90, 220, .9), rgba(90, 60, 190, .9)); }
.status-badge--shipped { background: linear-gradient(135deg, rgba(110, 176, 130, .95), rgba(61, 139, 82, .9)); }
.status-badge--delivered { background: linear-gradient(135deg, rgba(61, 139, 82, .95), rgba(45, 107, 62, .92)); }
.status-badge--cancelled { background: linear-gradient(135deg, rgba(232, 131, 127, .95), rgba(180, 70, 65, .9)); }

.pager { display: flex; align-items: center; justify-content: center; gap: 14px; padding-top: 18px; }
.pager__btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  cursor: pointer;
}
.pager__btn:disabled { opacity: .4; cursor: not-allowed; }
.pager__label { font-size: 12px; color: var(--text-secondary); }
</style>
