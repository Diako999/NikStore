<template>
  <div class="container-main py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-text-primary">سفارش‌های من</h1>
      <NuxtLink :to="'/products'" class="flex items-center gap-1 text-sm text-brand hover:underline">
        خرید جدید
        <svg class="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
        </svg>
      </NuxtLink>
    </div>

    <!-- Status filter tabs -->
    <div class="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide" role="tablist" aria-label="فیلتر وضعیت سفارش">
      <button
        v-for="tab in statusTabs" :key="tab.value"
        @click="activeStatus = tab.value; fetchOrders()"
        role="tab"
        :aria-selected="activeStatus === tab.value"
        :class="[
          'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all border',
          activeStatus === tab.value
            ? 'bg-brand text-white border-brand'
            : 'border-surface-border text-text-secondary hover:text-text-primary',
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col gap-4">
      <div v-for="i in 4" :key="i" class="h-32 rounded-2xl skeleton" />
    </div>

    <!-- Empty -->
    <BaseEmpty
      v-else-if="!orders.length"
      icon="📦"
      title="سفارشی یافت نشد"
      subtitle="هنوز سفارشی ثبت نکرده‌اید یا در این وضعیت سفارشی ندارید"
      action="شروع خرید"
      :to="'/products'"
    />

    <!-- Order cards -->
    <div v-else ref="ordersGridRef" class="flex flex-col gap-4">
      <GlassCard
        v-for="order in orders" :key="order._id"
        padding="lg"
        class="transition-all hover:border-brand/30 relative"
      >
        <!-- Stretched link — covers the whole card for pointer/keyboard navigation -->
        <NuxtLink
          :to="`/user/orders/${order._id}`"
          class="absolute inset-0 rounded-2xl focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          :aria-label="`سفارش ${order.orderNumber}، وضعیت: ${statusLabel(order.status)}`"
        />

        <!-- Order header -->
        <div class="mb-4 pb-4 border-b border-surface-border">
          <!-- Row 1: badge + date -->
          <div class="flex items-center justify-between mb-2">
            <span :class="['text-xs px-3 py-1 rounded-full font-medium flex-shrink-0', statusColor(order.status).badge]">
              {{ statusLabel(order.status) }}
            </span>
            <p class="text-xs text-text-secondary">{{ formatDate(order.createdAt) }}</p>
          </div>
          <!-- Row 2: dot + order number + copy -->
          <div class="flex items-center gap-2">
            <span :class="['w-2 h-2 rounded-full flex-shrink-0', statusColor(order.status).dot]" />
            <p class="text-xs font-bold text-text-primary font-mono tracking-wide flex-1 min-w-0 truncate dir-ltr">
              {{ order.orderNumber }}
            </p>
            <button
              @click.stop="copyOrderNumber(order._id, order.orderNumber)"
              :aria-label="copiedId === order._id ? 'کپی شد' : 'کپی شماره سفارش'"
              :class="[
                'relative z-10 w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0',
                copiedId === order._id
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-surface text-text-secondary hover:text-brand border border-surface-border',
              ]"
            >
              <svg v-if="copiedId !== order._id" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Items preview -->
        <div class="flex gap-3 mb-4">
          <div class="flex -space-x-2 space-x-reverse">
            <img
              v-for="(item, i) in order.items.slice(0, 4)" :key="i"
              :src="item.thumbnail || PLACEHOLDER"
              :alt="item.name"
              class="w-12 h-12 rounded-xl object-cover border-2 border-surface-border"
              :style="{ zIndex: 4 - i }"
              @error="e => e.target.src = PLACEHOLDER"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-text-primary line-clamp-1">
              {{ order.items[0]?.name }}
              <span v-if="order.items.length > 1" class="text-text-secondary">
                و {{ order.items.length - 1 }} کالای دیگر
              </span>
            </p>
            <p class="text-xs text-text-secondary mt-1 font-fanum">
              {{ order.items.reduce((s, i) => s + i.quantity, 0) }} عدد
            </p>
          </div>
        </div>

        <!-- Footer: total + cancel action -->
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-text-secondary">مبلغ کل</p>
            <p class="text-base font-bold text-text-primary font-fanum">
              {{ formatPrice(order.total) }}
            </p>
          </div>
          <button
            v-if="canCancel(order.status)"
            @click.stop="openCancel(order)"
            class="relative z-10 text-xs text-error border border-error/40 px-3 py-1.5 rounded-lg hover:bg-error/5 transition-colors"
          >
            لغو سفارش
          </button>
        </div>
      </GlassCard>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center gap-2 mt-8">
      <button
        v-for="p in totalPages" :key="p"
        @click="page = p; fetchOrders()"
        :class="[
          'w-9 h-9 rounded-lg text-sm font-medium transition-colors font-fanum',
          page === p
            ? 'bg-brand text-white'
            : 'border border-surface-border text-text-secondary hover:text-text-primary',
        ]"
      >
        {{ p }}
      </button>
    </div>

    <!-- Cancel confirm dialog -->
    <Teleport to="body">
      <div
        v-if="cancelTarget"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="cancelTarget = null"
        @keydown.esc="cancelTarget = null"
      >
        <GlassCard
          padding="lg"
          class="w-full max-w-sm flex flex-col gap-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
        >
          <h3 id="cancel-dialog-title" class="font-bold text-glass-text-primary text-base">لغو سفارش</h3>
          <p class="text-glass-text-secondary text-sm leading-6">
            آیا از لغو سفارش
            <span class="font-bold text-glass-text-primary font-fanum dir-ltr">{{ cancelTarget?.orderNumber }}</span>
            مطمئن هستید؟ این عملیات قابل برگشت نیست.
          </p>
          <div class="flex gap-3 mt-2">
            <button
              @click="confirmCancel"
              :disabled="cancelling"
              class="flex-1 py-2.5 rounded-xl bg-error text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {{ cancelling ? 'در حال لغو...' : 'بله، لغو شود' }}
            </button>
            <button
              @click="cancelTarget = null"
              class="flex-1 py-2.5 rounded-xl border border-glass-border text-sm text-glass-text-secondary hover:text-glass-text-primary transition-colors"
            >
              انصراف
            </button>
          </div>
        </GlassCard>
      </div>
    </Teleport>
  </div>
</template>

<script setup>

definePageMeta({ layout: 'default', middleware: ['auth'] })
useSeoMeta({ title: 'سفارش‌های من', robots: 'noindex,nofollow' })


import { ref, nextTick, onMounted } from 'vue'
import { orderService }      from '~/services/order.service'
import { useUiStore }        from '~/stores/ui.store'
import { formatPrice, formatDate } from '~/utils/formatters'
import BaseEmpty from '~/components/common/BaseEmpty.vue'
import GlassCard from '~/components/glass/GlassCard.vue'

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="%23334155"%3E%3Crect width="48" height="48" rx="8"/%3E%3C/svg%3E'

const ui         = useUiStore()
const orders     = ref([])
const loading    = ref(true)
const page       = ref(1)
const totalPages = ref(1)
const activeStatus = ref('')
const cancelTarget = ref(null)
const cancelling   = ref(false)
const copiedId     = ref(null)
const ordersGridRef = ref(null)

// Order-history reveal: this list is CSR-only (fetched in onMounted, not
// SSR-prefetched like the blog grid), so the cards don't exist in the DOM
// yet when a mount-time-only composable like useGsapReveal would take its
// snapshot — it would find zero children and never animate. Firing the
// tween manually right after the fetch resolves (and again on every filter
// change) is the equivalent one-shot fade+rise, just timed correctly.
async function revealOrders() {
  if (!import.meta.client) return
  await nextTick()
  const el = ordersGridRef.value
  if (!el || !el.children.length) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const { gsap } = await import('gsap')
  gsap.fromTo(
    el.children,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: 'power2.out' },
  )
}

function copyOrderNumber(id, text) {
  navigator.clipboard.writeText(text).then(() => {
    copiedId.value = id
    setTimeout(() => { copiedId.value = null }, 2000)
  })
}

const statusTabs = [
  { value: '',           label: 'همه' },
  { value: 'pending',    label: 'در انتظار' },
  { value: 'confirmed',  label: 'تأیید شده' },
  { value: 'processing', label: 'در حال پردازش' },
  { value: 'shipped',    label: 'ارسال شده' },
  { value: 'delivered',  label: 'تحویل داده شده' },
  { value: 'cancelled',  label: 'لغو شده' },
]

const STATUS_MAP = {
  pending:    { label: 'در انتظار تأیید', dot: 'bg-warning',  badge: 'bg-warning/10 text-warning' },
  confirmed:  { label: 'تأیید شده',       dot: 'bg-brand',    badge: 'bg-brand/10 text-brand' },
  processing: { label: 'در حال پردازش',  dot: 'bg-blue-400', badge: 'bg-blue-400/10 text-blue-400' },
  shipped:    { label: 'ارسال شده',       dot: 'bg-purple-400', badge: 'bg-purple-400/10 text-purple-400' },
  delivered:  { label: 'تحویل داده شده', dot: 'bg-success',  badge: 'bg-success/10 text-success' },
  cancelled:  { label: 'لغو شده',        dot: 'bg-error',    badge: 'bg-error/10 text-error' },
}

function statusLabel(s) { return STATUS_MAP[s]?.label ?? s }
function statusColor(s) { return STATUS_MAP[s] ?? { dot: 'bg-gray-400', badge: 'bg-gray-400/10 text-gray-400' } }
function canCancel(s)   { return s === 'pending' || s === 'confirmed' }

async function fetchOrders() {
  loading.value = true
  try {
    const params = { page: page.value, limit: 10 }
    if (activeStatus.value) params.status = activeStatus.value
    const { data } = await orderService.getMyOrders(params)
    orders.value     = data.orders ?? []
    totalPages.value = data.totalPages ?? 1
    revealOrders()
  } catch {
    ui.addToast('خطا در دریافت سفارشات', 'error')
  } finally {
    loading.value = false
  }
}

function openCancel(order) {
  cancelTarget.value = order
}

async function confirmCancel() {
  if (!cancelTarget.value) return
  cancelling.value = true
  try {
    await orderService.cancelOrder(cancelTarget.value._id)
    const idx = orders.value.findIndex(o => o._id === cancelTarget.value._id)
    if (idx !== -1) orders.value[idx].status = 'cancelled'
    ui.addToast('سفارش با موفقیت لغو شد', 'success')
    cancelTarget.value = null
  } catch (err) {
    const msg = err?.response?.data?.message
    ui.addToast(msg || 'خطا در لغو سفارش', 'error')
  } finally {
    cancelling.value = false
  }
}

onMounted(fetchOrders)
</script>

<style scoped>
.dir-ltr { direction: ltr; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
