<template>
  <!-- ═══ Desktop Sidebar ═══════════════════════════════════════════════════════ -->
  <aside
    :class="['sb', ui.sidebarCollapsed ? 'sb--sm' : 'sb--lg', 'hidden lg:flex']"
    :style="activeSidebarBg ? { background: activeSidebarBg } : {}"
  >
    <div class="sb-glow" aria-hidden="true" />

    <!-- ── Logo ── -->
    <div class="sb-head">
      <div class="sb-head__icon">
        <img src="/favicon.svg" alt="لوگو نیک" class="w-[22px] h-[22px]" draggable="false" />
      </div>
      <Transition name="ft">
        <div v-if="!ui.sidebarCollapsed" class="sb-head__text">
          <span class="sb-head__name">{{ settingsStore.siteName }}</span>
          <span class="sb-head__badge">پنل مدیریت</span>
        </div>
      </Transition>
    </div>

    <!-- ── Navigation ── -->
    <nav class="sb-nav scrollbar-hide">
      <template v-for="group in navGroups" :key="group.label">

        <div v-if="group.label" class="sb-sep">
          <span v-if="!ui.sidebarCollapsed" class="sb-sep__lbl">{{ group.label }}</span>
          <div v-else class="sb-sep__dot" />
        </div>

        <RouterLink
          v-for="item in group.items"
          :key="item.name"
          :to="{ name: item.name }"
          :title="ui.sidebarCollapsed ? item.label : undefined"
          :class="['nav-item', isActive(item) && 'nav-item--on']"
        >
          <span v-if="isActive(item) && ui.sidebarCollapsed" class="nav-ring" />
          <svg class="nav-ico" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path
              v-for="(d, i) in iconPaths(item.icon)"
              :key="i"
              stroke-linecap="round"
              stroke-linejoin="round"
              :d="d"
            />
          </svg>
          <Transition name="ft">
            <span v-if="!ui.sidebarCollapsed" class="nav-lbl">{{ item.label }}</span>
          </Transition>
          <span v-if="ui.sidebarCollapsed" class="nav-tip">{{ item.label }}</span>
        </RouterLink>

      </template>
    </nav>

    <!-- ── Footer ── -->
    <div class="sb-foot">
      <Transition name="ft">
        <div v-if="!ui.sidebarCollapsed && auth.user" class="sb-user">
          <div class="sb-user__av">
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-3.5 h-3.5 text-white/80">
              <path d="M12 12a4 4 0 110-8 4 4 0 010 8zm-7 8a7 7 0 1114 0H5z"/>
            </svg>
          </div>
          <div class="sb-user__info">
            <span class="sb-user__phone">{{ auth.user.phone }}</span>
            <span :class="['sb-user__role', auth.isAdmin ? 'sb-user__role--admin' : 'sb-user__role--mgr']">
              {{ auth.isAdmin ? 'ادمین' : 'مدیر' }}
            </span>
          </div>
          <div class="sb-user__pulse" />
        </div>
      </Transition>

      <div class="sb-foot__btns">
        <a :href="siteUrl" target="_blank" class="foot-btn" title="مشاهده سایت">
          <svg class="nav-ico" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
          </svg>
          <Transition name="ft"><span v-if="!ui.sidebarCollapsed">مشاهده سایت</span></Transition>
          <span v-if="ui.sidebarCollapsed" class="nav-tip">مشاهده سایت</span>
        </a>

        <button @click="logout" class="foot-btn foot-btn--out" title="خروج">
          <svg class="nav-ico" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          <Transition name="ft"><span v-if="!ui.sidebarCollapsed">خروج</span></Transition>
          <span v-if="ui.sidebarCollapsed" class="nav-tip">خروج</span>
        </button>
      </div>
    </div>
  </aside>

  <!-- ═══ Mobile Drawer ════════════════════════════════════════════════════════ -->
  <aside
    :class="['mob', ui.sidebarMobileOpen && 'mob--open', 'lg:hidden']"
    :style="activeSidebarBg ? { background: activeSidebarBg } : {}"
  >
    <div class="sb-glow" aria-hidden="true" />

    <div class="sb-head">
      <div class="sb-head__icon">
        <img src="/favicon.svg" alt="لوگو نیک" class="w-[22px] h-[22px]" draggable="false" />
      </div>
      <div class="sb-head__text">
        <span class="sb-head__name">{{ settingsStore.siteName }}</span>
        <span class="sb-head__badge">پنل مدیریت</span>
      </div>
      <button @click="ui.closeMobileSidebar()" class="mob-close">
        <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <nav class="sb-nav scrollbar-hide">
      <template v-for="group in navGroups" :key="group.label">
        <div v-if="group.label" class="sb-sep">
          <span class="sb-sep__lbl">{{ group.label }}</span>
        </div>
        <RouterLink
          v-for="item in group.items"
          :key="item.name"
          :to="{ name: item.name }"
          @click="ui.closeMobileSidebar()"
          :class="['nav-item', isActive(item) && 'nav-item--on']"
        >
          <svg class="nav-ico" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path v-for="(d, i) in iconPaths(item.icon)" :key="i"
                  stroke-linecap="round" stroke-linejoin="round" :d="d" />
          </svg>
          <span class="nav-lbl">{{ item.label }}</span>
        </RouterLink>
      </template>
    </nav>

    <div class="sb-foot">
      <div v-if="auth.user" class="sb-user">
        <div class="sb-user__av">
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-3.5 h-3.5 text-white/80">
            <path d="M12 12a4 4 0 110-8 4 4 0 010 8zm-7 8a7 7 0 1114 0H5z"/>
          </svg>
        </div>
        <div class="sb-user__info">
          <span class="sb-user__phone">{{ auth.user.phone }}</span>
          <span :class="['sb-user__role', auth.isAdmin ? 'sb-user__role--admin' : 'sb-user__role--mgr']">
            {{ auth.isAdmin ? 'ادمین' : 'مدیر' }}
          </span>
        </div>
        <div class="sb-user__pulse" />
      </div>
      <div class="sb-foot__btns">
        <a :href="siteUrl" target="_blank" class="foot-btn">
          <svg class="nav-ico" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
          </svg>
          <span>مشاهده سایت</span>
        </a>
        <button @click="logout" class="foot-btn foot-btn--out">
          <svg class="nav-ico" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          <span>خروج</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore }       from '@/stores/ui.store'
import { useAuthStore }     from '@/stores/auth.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useAdminTheme }    from '@/composables/useAdminTheme'
import { logger }           from '@/utils/logger'

const route  = useRoute()
const router = useRouter()
const ui     = useUiStore()
const auth   = useAuthStore()
const settingsStore = useSettingsStore()
const { sidebarBg, sidebarBgDark } = useAdminTheme()
const activeSidebarBg = computed(() =>
  (ui.isDark && sidebarBgDark.value) ? sidebarBgDark.value : sidebarBg.value
)

// ── Icons ───────────────────────────────────────────────────────────────────
const ICONS = {
  dashboard:     ['M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'],
  products:      ['M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'],
  categories:    ['M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'],
  brands:        ['M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z'],
  features:      ['M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z'],
  banners:       ['M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'],
  orders:        ['M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'],
  discounts:     ['M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z'],
  blog:          ['M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'],
  'blog-comments': ['M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'],
  pages:         ['M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'],
  users:         ['M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'],
  reviews:       ['M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'],
  popups:        ['M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122'],
  settings:      ['M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', 'M15 12a3 3 0 11-6 0 3 3 0 016 0z'],
  theme:         ['M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01'],
  password:      ['M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z'],
  notifications: ['M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'],
  wholesale:     ['M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'],
}
function iconPaths(name) { return ICONS[name] ?? ['M12 4v16m-8-8h16'] }

// ── Nav groups ──────────────────────────────────────────────────────────────
function canAccess(perm) {
  if (auth.isAdmin) return true
  return auth.hasPermission(perm)
}

const navGroups = computed(() => {
  const groups = [
    {
      label: '',
      items: [{ name: 'dashboard', perm: 'dashboard', icon: 'dashboard', label: 'داشبورد' }],
    },
    {
      label: 'فروشگاه',
      items: [
        { name: 'products',       perm: 'products',   icon: 'products',   label: 'محصولات' },
        { name: 'categories',     perm: 'categories', icon: 'categories', label: 'دسته‌بندی‌ها' },
        { name: 'brands',         perm: 'brands',     icon: 'brands',     label: 'برندها' },
        { name: 'colors',         perm: 'colors',     icon: 'features',   label: 'ویژگی‌های اختصاصی' },
        { name: 'banners',   perm: 'banners',   icon: 'banners',   label: 'بنرها' },
        { name: 'discounts',     perm: 'discounts', icon: 'discounts', label: 'تخفیف‌ها' },
        { name: 'coupon-codes',   perm: 'discounts', icon: 'discounts', label: 'کدهای تخفیف' },
        { name: 'orders',    perm: 'orders',     icon: 'orders',     label: 'سفارشات' },
        { name: 'blog',          perm: 'blog', icon: 'blog',          label: 'بلاگ' },
        { name: 'blog-comments', perm: 'blog', icon: 'blog-comments', label: 'نظرات مقالات' },
        { name: 'pages',      perm: 'pages',      icon: 'pages',      label: 'صفحات' },
      ],
    },
    {
      label: 'مدیریت',
      items: [
        { name: 'users',              perm: 'users',   icon: 'users',     label: 'کاربران' },
        { name: 'wholesale-requests', perm: 'users',   icon: 'wholesale', label: 'درخواست‌های عمده' },
        { name: 'wholesale-orders',   perm: 'orders',  icon: 'wholesale', label: 'سفارشات عمده' },
        { name: 'reviews',            perm: 'reviews', icon: 'reviews',   label: 'نظرات' },
        ...(auth.isAdmin ? [
          { name: 'popups',             perm: null, icon: 'popups',        label: 'پاپ‌آپ سایت' },
          { name: 'settings',           perm: null, icon: 'settings',      label: 'تنظیمات سایت' },
          { name: 'theme',              perm: null, icon: 'theme',         label: 'تم سایت' },
          { name: 'change-password',    perm: null, icon: 'password',      label: 'تغییر رمز عبور' },
          { name: 'notifications-send', perm: null, icon: 'notifications', label: 'ارسال اعلان و پیامک' },
        ] : []),
      ],
    },
  ]
  return groups
    .map(g => ({ ...g, items: g.items.filter(i => !i.perm || canAccess(i.perm)) }))
    .filter(g => g.items.length > 0)
})

function isActive(item) {
  return route.name === item.name ||
    route.path.startsWith('/' + item.name.split('-')[0])
}

const siteUrl = import.meta.env.VITE_SITE_URL || 'http://localhost:3000'

async function logout() {
  logger.info('sidebar: logout initiated', {}, 'AdminSidebar')
  await auth.logout()
  logger.debug('sidebar: state cleared, navigating to login', {}, 'AdminSidebar')
  router.push({ name: 'login' })
}
</script>

<style scoped>
/* ═══ Base ══════════════════════════════════════════════════════════════════ */
.sb {
  position: fixed; top: 0; right: 0; height: 100%;
  z-index: 50;
  flex-direction: column;
  background: #171717;
  background: linear-gradient(180deg, #1a1a1a 0%, #141414 100%);
  border-left: 1px solid rgba(255,255,255,0.05);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.sb--lg { width: 268px; }
.sb--sm { width: 68px; }

/* Ambient glow */
.sb-glow {
  position: absolute;
  top: -80px; right: -80px;
  width: 280px; height: 280px;
  background: radial-gradient(circle, rgba(198,255,52,0.10) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;
}

/* ═══ Head ══════════════════════════════════════════════════════════════════ */
.sb-head {
  position: relative; z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0 1rem;
  min-height: 68px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  flex-shrink: 0;
}
.sb-head__icon {
  width: 40px; height: 40px;
  background: linear-gradient(145deg, #C6FF34 0%, #B3EA2E 60%, #A2D12A 100%);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow:
    0 0 0 1px rgba(198,255,52,0.25),
    0 4px 20px rgba(198,255,52,0.35),
    0 1px 3px rgba(0,0,0,0.4);
}
.sb-head__text {
  display: flex; flex-direction: column; gap: 4px;
  overflow: hidden; min-width: 0;
}
.sb-head__name {
  color: #F5F5F5;
  font-size: 0.9rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.01em;
}
.sb-head__badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  font-size: 0.575rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #C6FF34;
  background: rgba(198,255,52,0.1);
  border: 1px solid rgba(198,255,52,0.22);
  padding: 2px 8px;
  border-radius: 5px;
}

/* ═══ Navigation ════════════════════════════════════════════════════════════ */
.sb-nav {
  position: relative; z-index: 1;
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* Section separator */
.sb-sep {
  padding: 1.1rem 0.5rem 0.45rem;
}
.sb-sep__lbl {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: #5C5C5C;
}
.sb-sep__dot {
  width: 20px; height: 1px;
  background: rgba(255,255,255,0.05);
  margin: 1rem auto 0.45rem;
}

/* Nav item */
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.65rem 0.9rem;
  border-radius: 10px;
  position: relative;
  color: #6B6B6B;
  font-size: 0.8125rem;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
  white-space: nowrap;
  overflow: visible;
}
.nav-item:hover {
  background: rgba(255,255,255,0.045);
  color: #D4D4D4;
}
.nav-item:hover .nav-ico { color: #A3A3A3; }

/* ── Active ── */
.nav-item--on {
  background: linear-gradient(135deg, rgba(198,255,52,0.16) 0%, rgba(198,255,52,0.04) 100%);
  color: #F5F5F5;
}
.nav-item--on::before {
  content: '';
  position: absolute;
  left: 0; top: 6px; bottom: 6px;
  width: 3px;
  background: linear-gradient(180deg, #D6FF6B 0%, #C6FF34 100%);
  border-radius: 0 3px 3px 0;
}
.nav-item--on::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  border: 1px solid rgba(198,255,52,0.15);
  pointer-events: none;
}
.nav-item--on .nav-ico {
  color: #C6FF34;
  filter: drop-shadow(0 0 6px rgba(198,255,52,0.5));
}
.nav-item--on .nav-lbl {
  font-weight: 600;
  color: #F5F5F5;
}

/* Active glow ring (collapsed) */
.nav-ring {
  position: absolute;
  inset: 2px;
  border-radius: 8px;
  border: 1px solid rgba(198,255,52,0.35);
  box-shadow: inset 0 0 10px rgba(198,255,52,0.12);
  pointer-events: none;
}

.nav-ico {
  width: 18px; height: 18px;
  flex-shrink: 0;
  color: #5C5C5C;
  transition: color 0.15s ease, filter 0.15s ease;
}
.nav-lbl { flex: 1; overflow: hidden; text-overflow: ellipsis; }

/* Tooltip */
.nav-tip {
  position: absolute;
  right: calc(100% + 12px);
  top: 50%;
  transform: translateY(-50%);
  background: #232323;
  color: #D4D4D4;
  font-size: 0.72rem;
  font-weight: 500;
  padding: 0.3rem 0.75rem;
  border-radius: 8px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
  border: 1px solid rgba(198,255,52,0.15);
  box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(198,255,52,0.05);
  z-index: 9999;
}
.nav-item:hover .nav-tip,
.foot-btn:hover .nav-tip { opacity: 1; }

/* ═══ Footer ════════════════════════════════════════════════════════════════ */
.sb-foot {
  position: relative; z-index: 1;
  border-top: 1px solid rgba(255,255,255,0.04);
  padding: 0.75rem 0.75rem 0.875rem;
  flex-shrink: 0;
}
.sb-foot__btns { display: flex; flex-direction: column; gap: 2px; }

/* User card */
.sb-user {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.6rem 0.875rem;
  margin-bottom: 0.625rem;
  border-radius: 10px;
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.04);
}
.sb-user__av {
  width: 32px; height: 32px;
  background: linear-gradient(135deg, #2A2A2A 0%, #1A1A1A 100%);
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 0 0 1px rgba(198,255,52,0.22), 0 2px 10px rgba(0,0,0,0.45);
}
.sb-user__info {
  display: flex; flex-direction: column; min-width: 0; gap: 3px;
}
.sb-user__phone {
  font-size: 0.7rem;
  color: #8A8A8A;
  direction: ltr;
  font-family: 'IRANSansFaNum', monospace;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sb-user__role {
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 2px 8px;
  border-radius: 5px;
  width: fit-content;
}
.sb-user__role--admin { background: rgba(198,255,52,0.16); color: #C6FF34; }
.sb-user__role--mgr   { background: rgba(245,158,11,0.12); color: #FBBF24; }

/* Online pulse dot */
.sb-user__pulse {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #22C55E;
  box-shadow: 0 0 0 2px rgba(34,197,94,0.25);
  flex-shrink: 0;
  margin-right: auto;
  animation: pulse 2.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 2px rgba(34,197,94,0.25); }
  50%       { box-shadow: 0 0 0 5px rgba(34,197,94,0.08); }
}

/* Footer buttons */
.foot-btn {
  display: flex; align-items: center; gap: 0.8rem;
  padding: 0.56rem 0.9rem;
  border-radius: 9px;
  color: #6B6B6B;
  font-size: 0.8rem;
  font-weight: 500;
  text-decoration: none;
  width: 100%; cursor: pointer;
  background: transparent; border: none;
  transition: background 0.15s ease, color 0.15s ease;
  white-space: nowrap; position: relative;
}
.foot-btn:hover { background: rgba(255,255,255,0.045); color: #D4D4D4; }
.foot-btn:hover .nav-ico { color: #A3A3A3; }
.foot-btn--out:hover { background: rgba(239,68,68,0.07); color: #F87171; }
.foot-btn--out:hover .nav-ico { color: #F87171; }

/* ═══ Mobile ════════════════════════════════════════════════════════════════ */
.mob {
  position: fixed; top: 0; right: 0; height: 100%;
  z-index: 50; width: 268px;
  display: flex; flex-direction: column;
  background: linear-gradient(180deg, #1a1a1a 0%, #141414 100%);
  border-left: 1px solid rgba(255,255,255,0.05);
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.mob--open { transform: translateX(0); }

.mob-close {
  margin-right: auto;
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px;
  border-radius: 8px;
  color: #6B6B6B;
  background: transparent; border: none; cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease, color 0.15s ease;
}
.mob-close:hover { background: rgba(255,255,255,0.06); color: #D4D4D4; }

/* ═══ Transition ════════════════════════════════════════════════════════════ */
.ft-enter-active, .ft-leave-active { transition: opacity 0.12s ease; }
.ft-enter-from,   .ft-leave-to     { opacity: 0; }
</style>
