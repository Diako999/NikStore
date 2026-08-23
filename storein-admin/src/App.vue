<template>
  <AdminSplash :ready="appReady" />
  <component :is="currentLayout">
    <RouterView />
  </component>
  <AdminToast />
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute }    from 'vue-router'
import { storeToRefs } from 'pinia'
import AdminLayout  from '@/layouts/AdminLayout.vue'
import AuthLayout   from '@/layouts/AuthLayout.vue'
import AdminToast   from '@/components/common/AdminToast.vue'
import AdminSplash  from '@/components/AdminSplash.vue'
import { useAuthStore }     from '@/stores/auth.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useUiStore }       from '@/stores/ui.store'
import { socketService }    from '@/services/socket.service'
import { playPing }         from '@/composables/useRealtimeNotifications'
import { logger }           from '@/utils/logger'

const CTX = 'App'

const route         = useRoute()
const auth          = useAuthStore()
const settingsStore = useSettingsStore()
const ui            = useUiStore()
const { isLoggedIn, token } = storeToRefs(auth)
const layouts = { admin: AdminLayout, auth: AuthLayout }
const currentLayout = computed(() => layouts[route.meta.layout] ?? AdminLayout)

// Fire settings fetch immediately — races ahead of auth init so the real site name
// is ready before the brand text animation starts (~1.05 s from mount).
onMounted(() => settingsStore.fetchSettings())

// Splash gate: wait for auth init + minimum display time so radar animation completes
const appReady = ref(false)

watch(
  () => auth.initialized,
  async (initialized) => {
    if (!initialized) return
    await Promise.all([
      settingsStore.fetchSettings(),
      new Promise((r) => setTimeout(r, 1600)),
    ])
    appReady.value = true
    logger.info('App: auth initialised — splash dismissed', {}, CTX)
  },
  { immediate: true },
)

// ── Real-time event handlers ──────────────────────────────────────────────────
// These are the ONLY registrations for new_order and new_review.
// useRealtimeNotifications composable is now a no-op to prevent duplicate handlers.
function onNewOrder(payload) {
  ui.addNotification({
    id:      payload.orderId,
    type:    'new_order',
    title:   `سفارش جدید #${payload.orderNumber}`,
    message: `${payload.customerName} — ${Number(payload.total).toLocaleString('fa-IR')} تومان`,
    time:    payload.createdAt,
  })
  ui.incrementPendingOrders()
  ui.addToast(`سفارش جدید #${payload.orderNumber} از ${payload.customerName}`, 'info', 6000)
  playPing()
  logger.info('App: new_order event received', { orderNumber: payload.orderNumber }, CTX)
}

function onNewReview(payload) {
  ui.addNotification({
    id:      payload.reviewId,
    type:    'new_review',
    title:   'دیدگاه جدید',
    message: `${payload.userName} برای "${payload.productName}" (${payload.rating}★)`,
    time:    payload.createdAt,
  })
  ui.incrementPendingReviews()
  ui.addToast(`دیدگاه جدید از ${payload.userName}`, 'info', 5000)
  playPing()
  logger.info('App: new_review event received', { product: payload.productName }, CTX)
}

// ── Socket lifecycle: connect when admin is logged in, disconnect on logout ───
watch(
  isLoggedIn,
  (loggedIn) => {
    if (loggedIn && token.value) {
      socketService.connect(token.value)
      socketService.on('new_order',  onNewOrder)
      socketService.on('new_review', onNewReview)
      logger.debug('App: socket connected for admin session', {}, CTX)
    } else {
      socketService.off('new_order',  onNewOrder)
      socketService.off('new_review', onNewReview)
      socketService.disconnect()
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  socketService.off('new_order',  onNewOrder)
  socketService.off('new_review', onNewReview)
})
</script>
