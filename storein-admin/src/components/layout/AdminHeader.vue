<template>
  <header class="sticky top-0 z-header bg-card border-b border-border flex items-center justify-between px-5 h-[60px] shadow-sm">

    <!-- Right: toggle -->
    <div class="flex items-center gap-3">
      <button @click="ui.toggleSidebar()"
        class="hidden lg:flex w-9 h-9 items-center justify-center rounded-lg
               text-text-secondary hover:bg-surface hover:text-text-primary transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
      <button @click="ui.openMobileSidebar()"
        class="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg
               text-text-secondary hover:bg-surface transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
    </div>

    <!-- Left: actions + user -->
    <div class="flex items-center gap-2">

      <!-- Notification bell -->
      <div class="relative" ref="bellRef" data-testid="notif-wrapper">
        <button
          @click="toggleDropdown"
          data-testid="bell-btn"
          :class="[
            'relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors',
            dropdownOpen
              ? 'bg-surface text-primary'
              : 'text-text-secondary hover:bg-surface hover:text-text-primary',
          ]"
          title="اعلان‌ها"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0018 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
          </svg>
          <span
            v-if="ui.unreadCount > 0"
            class="anh__badge"
            data-testid="bell-badge"
          >{{ ui.unreadCount > 9 ? '۹+' : ui.unreadCount }}</span>
        </button>

        <!-- Dropdown -->
        <Transition name="dropdown">
          <div
            v-show="dropdownOpen"
            class="anh"
            style="direction: rtl;"
            data-testid="notif-dropdown"
          >
            <!-- Header -->
            <div class="anh__head">
              <div class="flex items-center gap-2">
                <span class="anh__head-title">اعلان‌ها</span>
                <span
                  v-if="ui.unreadCount > 0"
                  class="anh__head-count"
                  data-testid="nd-count"
                >{{ ui.unreadCount }} جدید</span>
              </div>
              <div class="flex items-center gap-2">
                <button
                  v-if="ui.unreadCount > 0"
                  @click="ui.markAllRead()"
                  class="anh__action-btn"
                  data-testid="mark-all-read-btn"
                >خواندن همه</button>
                <button
                  v-if="ui.notifications.length > 0"
                  @click="ui.clearNotifications()"
                  class="anh__action-btn anh__action-btn--danger"
                  data-testid="clear-btn"
                >پاک کردن</button>
              </div>
            </div>

            <!-- Empty state -->
            <div v-if="!ui.notifications.length" class="anh__empty" data-testid="nd-empty">
              <svg class="anh__empty-icon" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0018 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
              </svg>
              <p class="anh__empty-text">اعلانی وجود ندارد</p>
            </div>

            <!-- List -->
            <div v-else class="anh__list" data-testid="nd-list">
              <button
                v-for="n in ui.notifications.slice(0, 8)"
                :key="n.id"
                class="anh__item"
                :class="{ 'anh__item--unread': !n.read }"
                :data-testid="`nd-item-${n.id}`"
                @click="onClickNotification(n)"
              >
                <!-- Type icon -->
                <span class="anh__icon" :class="`anh__icon--${typeClass(n.type)}`" aria-hidden="true">
                  <svg v-if="n.type === 'new_order'" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"/>
                  </svg>
                  <svg v-else-if="n.type === 'new_review'" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
                  </svg>
                  <svg v-else-if="n.type === 'new_wholesale_order' || n.type === 'new_wholesale_request'" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                  <svg v-else fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </span>

                <!-- Body -->
                <div class="anh__item-body">
                  <div class="anh__item-head">
                    <p class="anh__item-title" :class="{ 'anh__item-title--unread': !n.read }">{{ n.title }}</p>
                    <span class="anh__dot" :class="n.read ? 'anh__dot--read' : 'anh__dot--unread'" />
                  </div>
                  <p class="anh__item-sub">{{ n.body }}</p>
                  <span class="anh__item-time">{{ timeAgo(n.createdAt) }}</span>
                </div>
              </button>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Dark mode toggle -->
      <button
        @click="ui.toggleDark()"
        :title="ui.isDark ? 'حالت روشن' : 'حالت تیره'"
        class="w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
      >
        <svg v-if="ui.isDark" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5"/>
          <path stroke-linecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
        </svg>
      </button>

      <div class="hidden sm:flex flex-col items-end">
        <span class="text-sm font-medium text-text-primary">{{ userName }}</span>
        <span class="text-xs text-primary font-medium">ادمین سیستم</span>
      </div>
      <div class="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-[#171717] font-bold text-sm flex-shrink-0">
        {{ userInitial }}
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter }     from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import { useUiStore }    from '@/stores/ui.store'
import { useAuthStore }  from '@/stores/auth.store'

const ui     = useUiStore()
const auth   = useAuthStore()
const router = useRouter()

const userName    = computed(() =>
  [auth.user?.firstName, auth.user?.lastName].filter(Boolean).join(' ') || 'مدیر سیستم'
)
const userInitial = computed(() => userName.value[0] || 'م')

// ── Notification dropdown ─────────────────────────────────────
const dropdownOpen = ref(false)
const bellRef      = ref(null)

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
}

onClickOutside(bellRef, () => { dropdownOpen.value = false })

function onClickNotification(n) {
  ui.markRead(n.id)
  dropdownOpen.value = false
  if (n.type === 'new_order')             router.push(`/orders/${n.id}`)
  if (n.type === 'new_review')            router.push('/reviews')
  if (n.type === 'new_wholesale_order')   router.push('/wholesale-orders')
  if (n.type === 'new_wholesale_request') router.push('/wholesale')
}

function typeClass(type) {
  if (type === 'new_order')  return 'order'
  if (type === 'new_review') return 'review'
  if (type === 'new_wholesale_order' || type === 'new_wholesale_request') return 'wholesale'
  return 'system'
}

// ── Relative time ─────────────────────────────────────────────
function timeAgo(iso) {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff <  60)  return 'همین الان'
  if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`
  return `${Math.floor(diff / 86400)} روز پیش`
}
</script>

<style scoped>
/* ── Dropdown animation ─────────────────────────────────────── */
.dropdown-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-leave-active { transition: opacity 0.1s ease,  transform 0.1s ease; }
.dropdown-enter-from,
.dropdown-leave-to     { opacity: 0; transform: translateY(-8px) scale(0.97); }

/* ── Bell badge ─────────────────────────────────────────────── */
.anh__badge {
  position: absolute;
  top: 2px; right: 2px;
  min-width: 17px; height: 17px;
  border-radius: 9px;
  background: #ef4444;
  color: #fff;
  font-size: 0.6rem;
  font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  padding: 0 3px;
  line-height: 1;
  border: 1.5px solid var(--color-card, #1e2030);
}

/* ── Dropdown panel ─────────────────────────────────────────── */
.anh {
  position: absolute;
  left: 0; top: calc(100% + 10px);
  width: 340px;
  max-width: calc(100vw - 1rem);
  border-radius: 18px;
  overflow: hidden;
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  box-shadow:
    0 24px 60px rgba(0,0,0,.35),
    0 8px 20px rgba(0,0,0,.2),
    0 0 0 1px rgba(255,255,255,.04);
  z-index: 400;
}

/* Header */
.anh__head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.875rem 1rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(to bottom, rgba(255,255,255,.03) 0%, transparent 100%);
}

.anh__head-title {
  font-size: 0.875rem; font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}

.anh__head-count {
  font-size: 0.65rem; font-weight: 700;
  color: #f59e0b;
  background: rgba(245,158,11,.1);
  border: 1px solid rgba(245,158,11,.22);
  border-radius: 20px;
  padding: 2px 8px;
  letter-spacing: .01em;
}

.anh__action-btn {
  font-size: 0.72rem; font-weight: 600;
  color: var(--color-primary, #6366f1);
  background: none; border: none; cursor: pointer;
  padding: 3px 0;
  transition: opacity .15s;
}
.anh__action-btn:hover { opacity: .7; }
.anh__action-btn--danger { color: #ef4444; }

/* Empty */
.anh__empty {
  display: flex; flex-direction: column; align-items: center; gap: .5rem;
  padding: 2.25rem 1rem; text-align: center;
}
.anh__empty-icon { width: 34px; height: 34px; color: var(--color-text-secondary); opacity: .3; }
.anh__empty-text { font-size: .8rem; color: var(--color-text-secondary); opacity: .6; }

/* List */
.anh__list { padding: .25rem 0; max-height: 320px; overflow-y: auto; }
.anh__list::-webkit-scrollbar { width: 3px; }
.anh__list::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 4px; }

/* Item */
.anh__item {
  display: flex; align-items: flex-start; gap: .75rem;
  padding: .7rem 1rem;
  width: 100%; text-align: right; cursor: pointer;
  transition: background-color .13s;
  border-bottom: 1px solid var(--color-border);
}
.anh__item:last-child { border-bottom: none; }
.anh__item:hover { background-color: var(--color-surface, rgba(255,255,255,.03)); }

.anh__item--unread {
  background: rgba(245,158,11,.04);
  border-right: 2.5px solid #f59e0b;
}
.anh__item--unread:hover { background: rgba(245,158,11,.08); }

/* Type icon */
.anh__icon {
  width: 34px; height: 34px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 1px;
}
.anh__icon svg { width: 16px; height: 16px; }

.anh__icon--order     { background: rgba(251,191,36,.13); color: #f59e0b; }
.anh__icon--review    { background: rgba(99,102,241,.12);  color: #818cf8; }
.anh__icon--wholesale { background: rgba(245,158,11,.13);  color: #d97706; }
.anh__icon--system    { background: rgba(107,114,128,.1);  color: #9ca3af; }

/* Body */
.anh__item-body { flex: 1; min-width: 0; }
.anh__item-head { display: flex; align-items: center; justify-content: space-between; gap: .4rem; }

.anh__item-title {
  font-size: .8rem; font-weight: 600;
  color: var(--color-text-secondary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  flex: 1; min-width: 0; line-height: 1.4;
}
.anh__item-title--unread { color: var(--color-text-primary); font-weight: 700; }

.anh__dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.anh__dot--unread {
  background: #f59e0b;
  box-shadow: 0 0 0 2px rgba(245,158,11,.18), 0 0 7px rgba(245,158,11,.6);
}
.anh__dot--read { background: transparent; }

.anh__item-sub {
  font-size: .73rem; color: var(--color-text-secondary); opacity: .7;
  margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.4;
}

.anh__item-time {
  font-size: .65rem; color: var(--color-text-secondary); opacity: .45;
  margin-top: 4px; display: block;
}
</style>
