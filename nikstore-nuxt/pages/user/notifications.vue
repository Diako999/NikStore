<template>
  <div class="nv">

    <!-- ─── Header ──────────────────────────────────────────────── -->
    <div class="nv__header">
      <div class="nv__header-start">
        <div class="nv__bell-wrap" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
               stroke-width="1.5" stroke="currentColor" class="nv__bell-svg">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0018 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
          </svg>
          <span v-if="notifStore.unreadCount > 0" class="nv__badge font-fanum" data-testid="unread-badge">
            {{ notifStore.unreadCount }}
          </span>
        </div>
        <div>
          <h1 class="nv__title">اعلان‌ها</h1>
          <p class="nv__sub">
            <span v-if="notifStore.unreadCount > 0" class="nv__sub--phosphor font-fanum">
              {{ notifStore.unreadCount }} اعلان خوانده‌نشده
            </span>
            <span v-else>همه اعلان‌ها خوانده شده‌اند</span>
          </p>
        </div>
      </div>

      <button
        v-if="notifStore.unreadCount > 0"
        class="nv__mark-all"
        :disabled="markingAll"
        @click="handleMarkAll"
      >
        <svg v-if="markingAll" class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
             stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
        </svg>
        همه را خواندم
      </button>
    </div>

    <!-- ─── Loading skeleton ─────────────────────────────────── -->
    <div v-if="notifStore.loading" class="nv__list" data-testid="skeleton-list">
      <div v-for="i in 5" :key="i" class="nv__skeleton">
        <div class="nv__sk-icon" />
        <div class="nv__sk-body">
          <div class="nv__sk-line" style="width:55%" />
          <div class="nv__sk-line" style="width:82%;margin-top:8px;height:.7rem;opacity:.5" />
          <div class="nv__sk-line" style="width:30%;margin-top:8px;height:.6rem;opacity:.3" />
        </div>
      </div>
    </div>

    <!-- ─── Empty state ──────────────────────────────────────── -->
    <div v-else-if="!notifStore.notifications.length" class="nv__empty">
      <div class="nv__empty-art" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" class="nv__empty-svg" fill="none">
          <circle cx="48" cy="48" r="46" fill="rgba(99,102,241,.06)" stroke="rgba(99,102,241,.14)" stroke-width="1.5"/>
          <path d="M56.857 65.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0060 57.75v-.7V57A12 12 0 0036 57v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                stroke="rgba(99,102,241,.45)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="66" cy="33" r="9" fill="rgba(99,102,241,.1)" stroke="rgba(99,102,241,.28)" stroke-width="1.5"/>
          <path d="M63 33h6M66 30v6" stroke="rgba(99,102,241,.55)" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <p class="nv__empty-title">هیچ اعلانی وجود ندارد</p>
      <p class="nv__empty-sub">اعلان‌های جدید در اینجا نمایش داده می‌شوند</p>
      <NuxtLink :to="'/'" class="nv__back-btn">بازگشت به صفحه اصلی</NuxtLink>
    </div>

    <!-- ─── Notification list ────────────────────────────────── -->
    <div v-else class="nv__list">
      <button
        v-for="n in notifStore.notifications"
        :key="n._id"
        class="nv__item"
        :class="{ 'nv__item--unread': !n.isRead }"
        @click="handleClick(n)"
      >
        <!-- Pulsing dot ── phosphor green when unread -->
        <span
          class="nv__dot"
          :class="n.isRead ? 'nv__dot--read' : 'nv__dot--unread'"
          :data-testid="n.isRead ? 'dot-read' : 'dot-unread'"
        />

        <!-- Type icon badge -->
        <div class="nv__type-icon" :class="typeIconClass(n.type)" aria-hidden="true">
          <svg v-if="n.type === 'order_update'" xmlns="http://www.w3.org/2000/svg"
               fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <svg v-else-if="n.type === 'promo'" xmlns="http://www.w3.org/2000/svg"
               fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L9.568 3z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
               stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>
          </svg>
        </div>

        <!-- Content -->
        <div class="nv__content">
          <p class="nv__item-title" :class="{ 'nv__item-title--unread': !n.isRead }">{{ n.title }}</p>
          <p class="nv__item-body">{{ n.body }}</p>
          <span class="nv__item-time font-fanum">{{ timeAgo(n.createdAt) }}</span>
        </div>

        <!-- Chevron for navigable items -->
        <svg
          v-if="resolveRoute(n)"
          xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          stroke-width="2" stroke="currentColor" class="nv__chevron rtl:rotate-180"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
        </svg>
      </button>
    </div>

  </div>
</template>

<script setup>

definePageMeta({ layout: 'default', middleware: ['auth'] })
useSeoMeta({ title: 'اعلان‌ها', robots: 'noindex,nofollow' })


import { ref, onMounted } from 'vue'
import { useRouter }      from 'vue-router'
import { useNotificationStore } from '~/stores/notification.store'
import { logger } from '~/utils/logger'

const CTX = 'NotificationsView'

const router     = useRouter()
const notifStore = useNotificationStore()
const markingAll = ref(false)

onMounted(async () => {
  logger.info('notifications page mounted', {}, CTX)
  if (!notifStore.fetched) {
    logger.debug('fetching notifications on mount', {}, CTX)
    await notifStore.fetchNotifications()
    logger.debug('notifications fetched', { count: notifStore.notifications.length }, CTX)
  }
})

async function handleClick(n) {
  logger.debug('notification item clicked', { id: n._id, type: n.type, isRead: n.isRead }, CTX)
  if (!n.isRead) await notifStore.markRead(n._id)
  const dest = resolveRoute(n)
  if (dest) {
    logger.info('navigating from notification', { dest, type: n.type }, CTX)
    router.push(dest)
  }
}

async function handleMarkAll() {
  logger.info('mark all read triggered', { count: notifStore.unreadCount }, CTX)
  markingAll.value = true
  try {
    await notifStore.markAllRead()
    logger.debug('all notifications marked as read', {}, CTX)
  } finally {
    markingAll.value = false
  }
}

function resolveRoute(n) {
  const d = n.data
  if (d?.orderId) return { name: 'user-order-detail', params: { id: d.orderId } }
  if (n.type === 'order_update') return { name: 'user-orders' }
  return null
}

function typeIconClass(type) {
  if (type === 'order_update') return 'nv__type-icon--order'
  if (type === 'promo')        return 'nv__type-icon--promo'
  return 'nv__type-icon--info'
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'همین الان'
  if (m < 60) return `${m} دقیقه پیش`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ساعت پیش`
  return `${Math.floor(h / 24)} روز پیش`
}
</script>

<style scoped>
/* ── Phosphor green palette ─────────────────────────────────── */
.nv {
  --phosphor:        #39FF14;
  --phosphor-glow:   rgba(57, 255, 20, 0.55);
  --phosphor-mid:    rgba(57, 255, 20, 0.22);
  --phosphor-soft:   rgba(57, 255, 20, 0.10);
  --phosphor-bg:     rgba(57, 255, 20, 0.032);
  --phosphor-border: rgba(57, 255, 20, 0.22);
}

.nv {
  max-width: 760px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
}

/* ── Header ──────────────────────────────────────────────────── */
.nv__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.75rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.nv__header-start {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Bell icon wrapper */
.nv__bell-wrap {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: rgba(var(--color-brand-rgb, 99 102 241), 0.08);
  border: 1px solid rgba(var(--color-brand-rgb, 99 102 241), 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nv__bell-svg {
  width: 24px;
  height: 24px;
  color: var(--color-brand);
}

/* Unread count badge on bell */
.nv__badge {
  position: absolute;
  top: -6px;
  left: -6px;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  background: var(--phosphor);
  color: #000;
  font-size: 0.65rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  box-shadow: 0 0 8px var(--phosphor-glow);
  border: 2px solid var(--color-card, #0f172a);
}

.nv__title {
  font-size: 1.35rem;
  font-weight: 900;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
}

.nv__sub {
  font-size: 0.775rem;
  color: var(--color-text-secondary);
  margin: 4px 0 0;
}

.nv__sub--phosphor {
  color: var(--phosphor);
  font-weight: 600;
  text-shadow: 0 0 10px var(--phosphor-mid);
}

/* Mark all button */
.nv__mark-all {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.1rem;
  border-radius: 10px;
  background: var(--phosphor-bg);
  border: 1px solid var(--phosphor-border);
  color: var(--phosphor);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-shadow: 0 0 8px var(--phosphor-mid);
}
.nv__mark-all:hover:not(:disabled) {
  background: var(--phosphor-soft);
  box-shadow: 0 0 12px var(--phosphor-soft);
}
.nv__mark-all:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* ── List ────────────────────────────────────────────────────── */
.nv__list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

/* ── Notification card ───────────────────────────────────────── */
.nv__item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1rem 1.125rem;
  border-radius: 16px;
  border: 1.5px solid var(--glass-border);
  background: var(--glass);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  text-align: right;
  width: 100%;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s, background-color 0.2s;
  overflow: hidden;
}

.nv__item:hover {
  border-color: rgba(var(--color-brand-rgb, 99 102 241), 0.4);
  box-shadow: 0 4px 20px rgba(var(--color-brand-rgb, 99 102 241), 0.08);
  transform: translateY(-1px);
}

.nv__item:active {
  transform: translateY(0);
}

/* ── Unread state ── phosphor green ──────────────────────────── */
.nv__item--unread {
  background: var(--phosphor-bg);
  border-color: var(--phosphor-border);
  border-right-width: 3px;
}

.nv__item--unread::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--phosphor);
  box-shadow: 0 0 14px var(--phosphor-glow), 0 0 4px var(--phosphor);
  border-radius: 0 16px 16px 0;
}

.nv__item--unread:hover {
  border-color: rgba(57, 255, 20, 0.35);
  box-shadow: 0 4px 24px rgba(57, 255, 20, 0.08), 0 0 0 1px rgba(57, 255, 20, 0.06);
}

/* ── Unread pulsing dot ──────────────────────────────────────── */
.nv__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
}

.nv__dot--unread {
  background: var(--phosphor);
  box-shadow: 0 0 0 3px var(--phosphor-soft), 0 0 10px var(--phosphor-glow);
  animation: phosphor-pulse 2.2s ease-in-out infinite;
}

.nv__dot--read {
  background: transparent;
}

@keyframes phosphor-pulse {
  0%,100% { box-shadow: 0 0 0 3px var(--phosphor-soft), 0 0 10px var(--phosphor-glow); }
  50%     { box-shadow: 0 0 0 5px rgba(57,255,20,.06), 0 0 18px rgba(57,255,20,.75); }
}

/* ── Type icon badge ─────────────────────────────────────────── */
.nv__type-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nv__type-icon--order { background: rgba(59,130,246,.12); color: #3b82f6; }
.nv__type-icon--promo { background: rgba(245,158,11,.12); color: #f59e0b; }
.nv__type-icon--info  { background: rgba(99,102,241,.12); color: #6366f1; }

/* ── Content ─────────────────────────────────────────────────── */
.nv__content {
  flex: 1;
  min-width: 0;
  text-align: right;
}

.nv__item-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  line-height: 1.4;
  transition: color 0.2s;
}

.nv__item-title--unread {
  color: var(--color-text-primary);
  font-weight: 700;
}

.nv__item-body {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin-top: 3px;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  opacity: 0.85;
}

.nv__item-time {
  display: inline-block;
  font-size: 0.7rem;
  color: var(--color-text-disabled, var(--color-text-secondary));
  margin-top: 7px;
  opacity: 0.7;
}

/* ── Chevron ─────────────────────────────────────────────────── */
.nv__chevron {
  width: 16px;
  height: 16px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
  margin-top: 4px;
  opacity: 0.35;
  transition: opacity 0.15s, transform 0.15s;
}

.nv__item:hover .nv__chevron {
  opacity: 0.8;
  transform: translateX(-2px);
}

/* ── Loading skeleton ────────────────────────────────────────── */
.nv__skeleton {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1rem 1.125rem;
  border-radius: 16px;
  border: 1.5px solid var(--glass-border);
  background: var(--glass);
}

.nv__sk-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--color-border);
  flex-shrink: 0;
  animation: sk-pulse 1.5s ease-in-out infinite;
}

.nv__sk-body { flex: 1; }

.nv__sk-line {
  height: 0.875rem;
  border-radius: 6px;
  background: var(--color-border);
  animation: sk-pulse 1.5s ease-in-out infinite;
}

@keyframes sk-pulse {
  0%,100% { opacity: 1; }
  50%     { opacity: 0.4; }
}

/* ── Empty state ─────────────────────────────────────────────── */
.nv__empty {
  text-align: center;
  padding: 5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.nv__empty-svg {
  width: 96px;
  height: 96px;
  margin-bottom: 0.5rem;
}

.nv__empty-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-top: 0.25rem;
}

.nv__empty-sub {
  font-size: 0.825rem;
  color: var(--color-text-secondary);
  opacity: 0.75;
}

.nv__back-btn {
  margin-top: 1.5rem;
  padding: 0.625rem 1.75rem;
  border-radius: 12px;
  background: var(--color-brand);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.2s, transform 0.15s;
}

.nv__back-btn:hover {
  opacity: 0.85;
  transform: translateY(-1px);
}
</style>
