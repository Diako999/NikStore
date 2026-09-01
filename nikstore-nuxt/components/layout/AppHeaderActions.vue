<template>
  <div class="flex items-center gap-1 shrink-0">

    <!-- ─── Notification bell + dropdown ─────────────────────── -->
    <div v-if="authStore.isLoggedIn" ref="notifRef" class="relative">
      <button
        class="relative p-2 rounded-lg transition-colors"
        :class="isNotifOpen
          ? 'text-brand bg-glass'
          : 'text-glass-text-secondary hover:text-brand hover:bg-glass'"
        title="اعلان‌ها"
        data-testid="bell-btn"
        @click="toggleNotif"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0018 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
        </svg>
        <span
          v-if="notifStore.unreadCount > 0"
          class="nd__bell-badge font-fanum"
          data-testid="bell-badge"
        >{{ notifStore.unreadCount > 99 ? '۹۹+' : notifStore.unreadCount }}</span>
      </button>

      <!-- Dropdown panel -->
      <Transition name="dropdown">
        <div v-if="isNotifOpen" class="nd" :style="{ '--nd-top': ndTop }" data-testid="notif-dropdown">

          <!-- Header -->
          <div class="nd__head">
            <span class="nd__head-title">اعلان‌ها</span>
            <span v-if="notifStore.unreadCount > 0" class="nd__head-count font-fanum" data-testid="nd-count">
              {{ notifStore.unreadCount }} جدید
            </span>
          </div>

          <!-- Loading skeleton -->
          <div v-if="notifStore.loading" class="nd__loading" data-testid="nd-loading">
            <div v-for="i in 3" :key="i" class="nd__sk">
              <div class="nd__sk-dot" />
              <div class="nd__sk-body">
                <div class="nd__sk-line" style="width:58%" />
                <div class="nd__sk-line" style="width:80%;margin-top:5px;height:.65rem;opacity:.5" />
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-else-if="!notifStore.notifications.length" class="nd__empty" data-testid="nd-empty">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                 stroke-width="1.5" stroke="currentColor" class="nd__empty-icon" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0018 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
            </svg>
            <p class="nd__empty-text">اعلانی وجود ندارد</p>
          </div>

          <!-- Notification list (max 5) -->
          <div v-else class="nd__list" data-testid="nd-list">
            <button
              v-for="n in notifStore.notifications.slice(0, 3)"
              :key="n._id"
              class="nd__item"
              :class="{ 'nd__item--unread': !n.isRead }"
              :data-testid="`nd-item-${n._id}`"
              @click="handleNotifClick(n)"
            >
              <!-- Type icon -->
              <span class="nd__icon" :class="`nd__icon--${notifTypeKey(n.type)}`" aria-hidden="true">
                <!-- order -->
                <svg v-if="n.type === 'order_update' || n.type === 'order_shipped'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"/></svg>
                <!-- payment -->
                <svg v-else-if="n.type === 'payment'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/></svg>
                <!-- promotion / discount -->
                <svg v-else-if="n.type === 'promotion'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z"/></svg>
                <!-- default bell -->
                <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0018 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg>
              </span>

              <div class="nd__item-body">
                <div class="nd__item-head">
                  <p class="nd__item-title" :class="{ 'nd__item-title--unread': !n.isRead }">{{ n.title }}</p>
                  <span class="nd__dot" :class="n.isRead ? 'nd__dot--read' : 'nd__dot--unread'" />
                </div>
                <p class="nd__item-sub">{{ n.body }}</p>
                <span class="nd__item-time font-fanum">{{ timeAgo(n.createdAt) }}</span>
              </div>
            </button>
          </div>

          <!-- Footer — see all -->
          <NuxtLink
            :to="'/user/notifications'"
            class="nd__footer"
            data-testid="nd-see-all"
            @click="isNotifOpen = false"
          >
            <span>مشاهده همه اعلان‌ها</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                 stroke-width="2" stroke="currentColor" class="nd__footer-arrow rtl:rotate-180">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
            </svg>
          </NuxtLink>
        </div>
      </Transition>
    </div>

    <!-- ─── Theme toggle ──────────────────────────────────────── -->
    <GlassThemeToggle />

    <!-- ─── Cart ──────────────────────────────────────────────── -->
    <NuxtLink
      :to="'/cart'"
      class="relative p-2 rounded-lg text-glass-text-secondary hover:text-brand hover:bg-glass transition-colors"
      title="سبد خرید"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"/>
      </svg>
      <span
        v-if="cartStore.totalItems > 0"
        class="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-error text-white text-xs font-bold rounded-full flex items-center justify-center px-1 leading-none font-fanum"
      >
        {{ cartStore.totalItems > 99 ? '۹۹+' : cartStore.totalItems }}
      </span>
    </NuxtLink>

    <!-- ─── User area ─────────────────────────────────────────── -->
    <div ref="userRef" class="relative">
      <!-- Not logged in -->
      <NuxtLink
        v-if="!authStore.isLoggedIn"
        to="/auth/login"
        class="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-brand text-brand text-sm font-medium hover:bg-brand hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
        </svg>
        ورود | ثبت‌نام
      </NuxtLink>
      <NuxtLink
        v-if="!authStore.isLoggedIn"
        to="/auth/login"
        class="md:hidden p-2 rounded-lg text-glass-text-secondary hover:text-brand hover:bg-glass transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
        </svg>
      </NuxtLink>

      <!-- Logged in: avatar button -->
      <button
        v-else
        class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-glass transition-colors"
        @click="isOpen = !isOpen"
      >
        <span class="w-8 h-8 rounded-full bg-brand text-white text-sm font-bold flex items-center justify-center shrink-0">
          {{ avatarLetter }}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
          :class="['w-3.5 h-3.5 text-glass-text-secondary transition-transform duration-200 hidden md:block', isOpen ? 'rotate-180' : '']"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
        </svg>
      </button>

      <!-- User dropdown -->
      <Transition name="dropdown">
        <div
          v-if="isOpen && authStore.isLoggedIn"
          class="absolute top-full end-0 mt-2 w-56 rounded-xl shadow-dropdown z-dropdown overflow-hidden user-drop-panel"
          style="max-width: calc(100vw - 1rem);"
        >
          <div class="px-4 py-3" style="border-bottom: 1px solid var(--glass-border);">
            <p class="text-xs" style="color: var(--text-secondary);">سلام،</p>
            <p class="text-sm font-semibold truncate" style="color: var(--text-primary);">{{ userName }}</p>
          </div>
          <nav class="py-1">
            <NuxtLink
              v-for="item in userMenuItems"
              :key="item.name"
              :to="item.to"
              class="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
              style="color: var(--text-primary);"
              @mouseenter="e => e.currentTarget.style.backgroundColor = 'var(--glass)'"
              @mouseleave="e => e.currentTarget.style.backgroundColor = ''"
              @click="isOpen = false"
            >
              <component :is="item.icon" class="w-4 h-4 shrink-0" style="color: var(--text-secondary);" />
              {{ item.label }}
            </NuxtLink>
          </nav>
          <div class="py-1" style="border-top: 1px solid var(--glass-border);">
            <button
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error transition-colors hover:bg-red-500/10"
              @click="handleLogout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 shrink-0">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/>
              </svg>
              خروج از حساب
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, h, nextTick } from 'vue'
import { useRouter }       from 'vue-router'
import { storeToRefs }     from 'pinia'
import { onClickOutside }  from '@vueuse/core'
import { useAuthStore }         from '~/stores/auth.store'
import { useCartStore }         from '~/stores/cart.store'
import { useNotificationStore } from '~/stores/notification.store'

const authStore  = useAuthStore()
const cartStore  = useCartStore()
const notifStore = useNotificationStore()
const router     = useRouter()

const userRef      = ref(null)
const notifRef     = ref(null)
const isOpen       = ref(false)
const isNotifOpen  = ref(false)
const ndTop        = ref('0px')

onClickOutside(userRef,  () => { isOpen.value = false })
onClickOutside(notifRef, () => { isNotifOpen.value = false })

// ── Notification dropdown ──────────────────────────────────────
async function toggleNotif() {
  isNotifOpen.value = !isNotifOpen.value
  isOpen.value = false
  if (isNotifOpen.value) {
    // Capture bell rect before fetching so the dropdown top is accurate on mobile
    await nextTick()
    const rect = notifRef.value?.getBoundingClientRect()
    if (rect) ndTop.value = `${rect.bottom + 10}px`
    if (!notifStore.fetched) await notifStore.fetchNotifications()
  }
}

async function handleNotifClick(n) {
  if (!n.isRead) await notifStore.markRead(n._id)
  isNotifOpen.value = false
  const dest = resolveNotifRoute(n)
  if (dest) router.push(dest)
}

function resolveNotifRoute(n) {
  const d = n.data
  if (d?.orderId) return { name: 'user-order-detail', params: { id: d.orderId } }
  if (n.type === 'order_update') return { name: 'user-orders' }
  return null
}

function notifTypeKey(type) {
  if (type === 'order_update' || type === 'order_shipped') return 'order'
  if (type === 'payment') return 'payment'
  if (type === 'promotion') return 'promo'
  return 'default'
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

// ── User dropdown ──────────────────────────────────────────────
const avatarLetter = computed(() => {
  const u = authStore.user
  return (u?.firstName?.[0] || u?.name?.[0] || u?.phone?.[1] || 'ک').toUpperCase()
})

const userName = computed(() => {
  const u = authStore.user
  if (u?.firstName && u?.lastName) return `${u.firstName} ${u.lastName}`
  if (u?.firstName) return u.firstName
  return u?.phone || 'کاربر'
})

const IconUser   = { render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' })]) }
const IconOrders = { render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' })]) }
const IconHeart  = { render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z' })]) }

const userMenuItems = [
  { to: '/user/profile',   label: 'پروفایل من',    icon: IconUser },
  { to: '/user/orders',    label: 'سفارش‌هایم',    icon: IconOrders },
  { to: '/user/favorites', label: 'علاقه‌مندی‌ها', icon: IconHeart },
]

async function handleLogout() {
  isOpen.value = false
  authStore.logout()
  router.push('/')
}
</script>

<style scoped>
/* ── Dropdown shared animation ─────────────────────────────── */
.dropdown-enter-active,
.dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from,
.dropdown-leave-to     { opacity: 0; transform: translateY(-8px) scale(0.97); }

/* ── User dropdown panel ───────────────────────────────────── */
.user-drop-panel {
  background: var(--glass-strong);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid var(--glass-border);
}

/* ── Bell badge ─────────────────────────────────────────────── */
.nd__bell-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background: #ef4444;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  line-height: 1;
  border: 1.5px solid var(--glass-strong);
}

/* ── Notification dropdown panel ────────────────────────────── */
.nd {
  position: absolute;
  top: calc(100% + 12px);
  left: 0;
  right: auto;
  width: 360px;
  max-width: calc(100vw - 0.5rem);
  border-radius: 20px;
  overflow: hidden;
  background: var(--glass-strong);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid var(--glass-border);
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.28),
    0 8px 24px rgba(0, 0, 0, 0.16),
    0 0 0 1px rgba(255, 255, 255, 0.04);
  z-index: var(--z-dropdown, 50);
}

/* Mobile: fixed to viewport, full-width, below the bell button */
@media (max-width: 640px) {
  .nd {
    position: fixed;
    top: var(--nd-top, 64px);
    left: 0.5rem;
    right: 0.5rem;
    width: auto;
    max-width: none;
    border-radius: 16px;
  }
}

/* Header */
.nd__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.125rem 0.875rem;
  border-bottom: 1px solid var(--glass-border);
  background: linear-gradient(
    to bottom,
    rgba(255,255,255,.03) 0%,
    transparent 100%
  );
}

.nd__head-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.nd__head-count {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--brand-light);
  background: rgb(var(--brand-rgb) / 0.14);
  border: 1px solid rgb(var(--brand-rgb) / 0.28);
  border-radius: 20px;
  padding: 3px 10px;
  letter-spacing: 0.01em;
}
[data-theme='light'] .nd__head-count { color: var(--brand-dark); }

/* Loading skeleton */
.nd__loading { padding: 0.5rem 0; }

.nd__sk {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 0.75rem 1.125rem;
}

.nd__sk-dot {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--glass-strong);
  flex-shrink: 0;
  animation: sk-pulse 1.5s ease-in-out infinite;
}

.nd__sk-body { flex: 1; padding-top: 4px; }

.nd__sk-line {
  height: 0.75rem;
  border-radius: 5px;
  background: var(--glass-strong);
  animation: sk-pulse 1.5s ease-in-out infinite;
}

@keyframes sk-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.38; }
}

/* Empty */
.nd__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.625rem;
  padding: 2.5rem 1rem;
  text-align: center;
}

.nd__empty-icon {
  width: 36px;
  height: 36px;
  color: var(--text-secondary);
  opacity: 0.35;
}

.nd__empty-text {
  font-size: 0.82rem;
  color: var(--text-secondary);
  opacity: 0.7;
}

/* List */
.nd__list { padding: 0.25rem 0; }

/* Notification item */
.nd__item {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 0.75rem 1.125rem;
  width: 100%;
  text-align: right;
  cursor: pointer;
  transition: background-color 0.14s;
  position: relative;
  border-bottom: 1px solid var(--glass-border);
}

.nd__item:last-child { border-bottom: none; }

.nd__item:hover { background-color: var(--glass); }

.nd__item--unread {
  background: rgb(var(--brand-rgb) / 0.05);
  border-right: 2.5px solid var(--brand-light);
}

.nd__item--unread:hover { background: rgb(var(--brand-rgb) / 0.09); }

/* Type icon */
.nd__icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.nd__icon svg { width: 17px; height: 17px; }

.nd__icon--order   { background: rgba(251,191,36,.13); color: #f59e0b; }
.nd__icon--payment { background: rgb(var(--brand-rgb) / .14); color: var(--brand-light); }
.nd__icon--promo   { background: rgba(168,85,247,.12); color: #a855f7; }
.nd__icon--default { background: rgba(99,102,241,.12); color: #818cf8; }
[data-theme='light'] .nd__icon--payment { color: var(--brand-dark); }

/* Item content */
.nd__item-body {
  flex: 1;
  min-width: 0;
}

.nd__item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.nd__item-title {
  font-size: 0.83rem;
  font-weight: 600;
  color: var(--text-secondary);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.nd__item-title--unread {
  color: var(--text-primary);
  font-weight: 700;
}

/* Dot */
.nd__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.nd__dot--unread {
  background: var(--brand-light);
  box-shadow: 0 0 0 2px rgb(var(--brand-rgb) / .15);
}

.nd__dot--read { background: transparent; }

.nd__item-sub {
  font-size: 0.76rem;
  color: var(--text-secondary);
  margin-top: 3px;
  opacity: 0.7;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.45;
}

.nd__item-time {
  font-size: 0.67rem;
  color: var(--text-secondary);
  margin-top: 5px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  opacity: 0.5;
}

/* Footer */
.nd__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.875rem 1rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--brand);
  text-decoration: none;
  border-top: 1px solid var(--glass-border);
  transition: background-color 0.14s;
  letter-spacing: -0.01em;
}

.nd__footer:hover { background-color: var(--glass); }

.nd__footer-arrow {
  width: 13px;
  height: 13px;
  transition: transform 0.15s;
  opacity: 0.8;
}

.nd__footer:hover .nd__footer-arrow { transform: translateX(-3px); }
</style>
