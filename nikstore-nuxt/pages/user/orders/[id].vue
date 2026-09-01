<template>
  <div class="container-main py-8">

    <!-- Back -->
    <button
      @click="$router.back()"
      class="flex items-center gap-2 text-sm text-text-secondary hover:text-brand transition-colors mb-6"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
      </svg>
      بازگشت به سفارش‌ها
    </button>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col gap-4">
      <div class="h-24 rounded-2xl skeleton" />
      <div class="h-48 rounded-2xl skeleton" />
      <div class="h-32 rounded-2xl skeleton" />
    </div>

    <!-- Not found -->
    <BaseEmpty
      v-else-if="!order"
      icon="🔍"
      title="سفارش یافت نشد"
      subtitle="این سفارش وجود ندارد یا متعلق به شما نیست"
      action="بازگشت به سفارشات"
      :to="'/user/orders'"
    />

    <!-- Order detail -->
    <div v-else class="flex flex-col gap-6">

      <!-- ── Header card ── -->
      <GlassCard padding="lg">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-xs text-glass-text-secondary mb-1">شماره سفارش</p>
            <div class="flex items-center gap-2">
              <p class="text-xl font-black text-glass-text-primary font-fanum dir-ltr">
                {{ order.orderNumber }}
              </p>
              <button
                @click="copyOrderNumber(order.orderNumber)"
                :title="copied ? 'کپی شد!' : 'کپی کد سفارش'"
                :class="[
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0',
                  copied
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-surface text-text-secondary hover:bg-primary/10 hover:text-primary border border-border',
                ]"
              >
                <svg v-if="!copied" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </button>
            </div>
            <p class="text-sm text-glass-text-secondary mt-1">
              ثبت شده در {{ formatDate(order.createdAt) }}
            </p>
          </div>
          <span :class="['text-sm px-4 py-1.5 rounded-full font-medium', statusColor(order.status).badge]">
            {{ statusLabel(order.status) }}
          </span>
        </div>

        <!-- Status stepper (non-cancelled) -->
        <div v-if="order.status !== 'cancelled'" class="mt-6">
          <div class="flex items-center gap-0" role="list" aria-label="مراحل پردازش سفارش">
            <template v-for="(step, i) in statusSteps" :key="step.value">
              <div class="flex flex-col items-center gap-1.5 flex-shrink-0" role="listitem" :aria-label="`${step.label}: ${stepState(step.value) === 'done' ? 'انجام شده' : stepState(step.value) === 'current' ? 'در حال انجام' : 'در انتظار'}`">
                <div
                  :class="[
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                    stepState(step.value) === 'done'    ? 'bg-brand text-white' :
                    stepState(step.value) === 'current' ? 'bg-brand text-white ring-4 ring-brand/20' :
                                                          'bg-surface border-2 border-surface-border text-text-disabled',
                  ]"
                >
                  <svg v-if="stepState(step.value) === 'done'" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span v-else class="font-fanum">{{ i + 1 }}</span>
                </div>
                <p :class="['text-xs text-center leading-tight max-w-14', stepState(step.value) === 'upcoming' ? 'text-glass-text-disabled' : 'text-glass-text-primary font-medium']">
                  {{ step.label }}
                </p>
              </div>
              <div
                v-if="i < statusSteps.length - 1"
                :class="[
                  'flex-1 h-0.5 mb-4 transition-all',
                  stepIndex(order.status) > i ? 'bg-brand' : 'bg-surface-border',
                ]"
              />
            </template>
          </div>
        </div>

        <!-- Cancelled banner -->
        <div v-else class="mt-4 flex items-center gap-2 p-3 rounded-xl bg-error/5 border border-error/20 text-error text-sm">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          این سفارش لغو شده است
        </div>
      </GlassCard>

      <!-- ── Items ── -->
      <GlassCard padding="lg">
        <h2 class="font-bold text-glass-text-primary mb-4 pb-3 border-b border-glass-border">
          کالاهای سفارش
          <span class="text-glass-text-secondary font-normal text-sm font-fanum">({{ order.items.length }} کالا)</span>
        </h2>

        <div class="flex flex-col divide-y divide-surface-border">
          <div
            v-for="item in order.items" :key="item.variantId"
            class="flex gap-3 py-4 first:pt-0 last:pb-0"
          >
            <img
              :src="item.thumbnail || PLACEHOLDER"
              :alt="item.name"
              class="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              @error="e => e.target.src = PLACEHOLDER"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-glass-text-primary line-clamp-2">{{ item.name }}</p>
              <div v-if="item.attributes?.length" class="flex flex-wrap gap-1 mt-1">
                <span
                  v-for="attr in item.attributes" :key="attr.key"
                  class="text-xs text-glass-text-secondary bg-glass px-2 py-0.5 rounded-md"
                >
                  {{ attr.key }}: {{ attr.value }}
                </span>
              </div>
              <div class="flex items-center justify-between mt-2">
                <span class="text-xs text-glass-text-secondary font-fanum">
                  {{ formatNumber(item.quantity) }} عدد × {{ formatPrice(item.price) }}
                </span>
                <span class="text-sm font-bold text-glass-text-primary font-fanum">
                  {{ formatPrice(item.price * item.quantity) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      <!-- ── Grid: Summary + Address ── -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

        <!-- Financial summary -->
        <GlassCard padding="lg">
          <h2 class="font-bold text-glass-text-primary mb-4 pb-3 border-b border-glass-border">
            خلاصه مالی
          </h2>
          <div class="flex flex-col gap-3 text-sm">
            <div class="flex justify-between">
              <span class="text-glass-text-secondary">جمع کالاها</span>
              <span class="font-fanum text-glass-text-primary">{{ formatPrice(order.subtotal) }}</span>
            </div>
            <div v-if="order.discount > 0" class="flex justify-between text-success">
              <span>
                تخفیف
                <span v-if="order.couponCode" class="font-fanum text-xs">({{ order.couponCode }})</span>
              </span>
              <span class="font-fanum">− {{ formatPrice(order.discount) }}</span>
            </div>
            <div class="flex justify-between font-bold text-base pt-3 border-t border-glass-border">
              <span class="text-glass-text-primary">مبلغ پرداخت شده</span>
              <span class="text-brand font-fanum">{{ formatPrice(order.total) }}</span>
            </div>
          </div>
        </GlassCard>

        <!-- Shipping address -->
        <GlassCard padding="lg">
          <h2 class="font-bold text-glass-text-primary mb-4 pb-3 border-b border-glass-border">
            آدرس تحویل
          </h2>
          <div class="flex flex-col gap-2 text-sm text-glass-text-secondary leading-6">
            <div class="flex items-center gap-2">
              <span class="text-glass-text-primary font-medium">{{ order.shippingAddress.recipientName }}</span>
              <span class="text-glass-text-disabled">|</span>
              <span class="font-fanum dir-ltr">{{ order.shippingAddress.recipientPhone }}</span>
            </div>
            <p>
              {{ order.shippingAddress.province }}،
              {{ order.shippingAddress.city }}،
              {{ order.shippingAddress.street }}،
              {{ order.shippingAddress.detail }}
            </p>
            <p class="font-fanum text-xs">
              کد پستی: {{ order.shippingAddress.postalCode }}
            </p>
          </div>
        </GlassCard>
      </div>

      <!-- ── Cancel button ── -->
      <div v-if="canCancel(order.status)" class="flex justify-end">
        <button
          v-if="!confirmingCancel"
          @click="confirmingCancel = true"
          class="text-sm text-error border border-error/40 px-5 py-2.5 rounded-xl hover:bg-error/5 transition-colors"
        >
          لغو سفارش
        </button>
        <div v-else class="flex items-center gap-3 text-sm">
          <span class="text-text-secondary">از لغو مطمئن هستید؟</span>
          <button
            @click="handleCancel"
            :disabled="cancelling"
            class="text-error font-medium hover:underline disabled:opacity-50"
          >
            {{ cancelling ? 'در حال لغو...' : 'بله، لغو شود' }}
          </button>
          <button @click="confirmingCancel = false" class="text-text-secondary hover:underline">
            خیر
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>

definePageMeta({ layout: 'default', middleware: ['auth'] })
useSeoMeta({ title: 'جزئیات سفارش', robots: 'noindex,nofollow' })


import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter }      from 'vue-router'
import { orderService }             from '~/services/order.service'
import { useUiStore }        from '~/stores/ui.store'
import { useSettingsStore } from '~/stores/settings.store'
import { formatPrice, formatNumber, formatDate } from '~/utils/formatters'
import BaseEmpty from '~/components/common/BaseEmpty.vue'
import GlassCard from '~/components/glass/GlassCard.vue'

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="%23334155"%3E%3Crect width="64" height="64" rx="8"/%3E%3C/svg%3E'

const route         = useRoute()
const router        = useRouter()
const ui            = useUiStore()
const settingsStore = useSettingsStore()

const order            = ref(null)
const copied           = ref(false)

function copyOrderNumber(text) {
  navigator.clipboard.writeText(text).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  })
}
const loading          = ref(true)
const confirmingCancel = ref(false)
const cancelling       = ref(false)

const statusSteps = [
  { value: 'pending',    label: 'ثبت سفارش' },
  { value: 'confirmed',  label: 'تأیید' },
  { value: 'processing', label: 'پردازش' },
  { value: 'shipped',    label: 'ارسال' },
  { value: 'delivered',  label: 'تحویل' },
]

const ORDER_IDX = { pending: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4 }

const STATUS_MAP = {
  pending:    { label: 'در انتظار تأیید', badge: 'bg-warning/10 text-warning' },
  confirmed:  { label: 'تأیید شده',       badge: 'bg-brand/10 text-brand' },
  processing: { label: 'در حال پردازش',  badge: 'bg-blue-400/10 text-blue-400' },
  shipped:    { label: 'ارسال شده',       badge: 'bg-purple-400/10 text-purple-400' },
  delivered:  { label: 'تحویل داده شده', badge: 'bg-success/10 text-success' },
  cancelled:  { label: 'لغو شده',        badge: 'bg-error/10 text-error' },
}

function statusLabel(s) { return STATUS_MAP[s]?.label ?? s }
function statusColor(s) { return STATUS_MAP[s] ?? { badge: 'bg-gray-400/10 text-gray-400' } }
function canCancel(s)   { return s === 'pending' || s === 'confirmed' }
function stepIndex(s)   { return ORDER_IDX[s] ?? -1 }
function stepState(stepValue) {
  const cur = stepIndex(order.value?.status)
  const idx = ORDER_IDX[stepValue] ?? -1
  if (idx < cur)  return 'done'
  if (idx === cur) return 'current'
  return 'upcoming'
}

async function fetchOrder() {
  loading.value = true
  try {
    const { data } = await orderService.getMyOrder(route.params.id)
    order.value = data
  } catch {
    order.value = null
  } finally {
    loading.value = false
  }
}

async function handleCancel() {
  cancelling.value = true
  try {
    const { data } = await orderService.cancelOrder(order.value._id)
    order.value = data
    confirmingCancel.value = false
    ui.addToast('سفارش با موفقیت لغو شد', 'success')
  } catch (err) {
    const msg = err?.response?.data?.message
    ui.addToast(msg || 'خطا در لغو سفارش', 'error')
  } finally {
    cancelling.value = false
  }
}

onMounted(fetchOrder)
</script>

<style scoped>
.dir-ltr { direction: ltr; unicode-bidi: embed; }
</style>
