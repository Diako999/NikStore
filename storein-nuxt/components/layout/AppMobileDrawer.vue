<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="backdrop">
      <div
        v-if="uiStore.isMenuOpen"
        class="fixed inset-0 bg-black/60 z-[250] md:hidden"
        style="backdrop-filter: blur(2px);"
        @click="uiStore.toggleMenu()"
      />
    </Transition>

    <!-- Drawer -->
    <Transition name="drawer">
      <nav
        v-if="uiStore.isMenuOpen"
        class="fixed top-0 right-0 bottom-0 w-[288px] z-[260] md:hidden flex flex-col overflow-y-auto glass-strong"
        style="border-left: 1px solid var(--glass-border); border-top: none; border-bottom: none; border-right: none;"
      >
        <!-- Brand accent strip -->
        <div class="h-1 flex-shrink-0 bg-brand" />

        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-4 flex-shrink-0"
             style="border-bottom: 1px solid var(--color-border);">
          <NuxtLink :to="'/'" @click="close" class="flex items-center gap-3">
            <img src="/nik-logo.png" :alt="`لوگو ${settingsStore.siteName}`" class="w-9 h-9 shrink-0 object-contain rounded-full" draggable="false" />
            <div class="flex flex-col leading-tight">
              <span class="text-brand font-bold text-[17px] tracking-tight">{{ settingsStore.siteName }}</span>
              <span class="text-[11px]" style="color: var(--color-text-disabled);">{{ settingsStore.tagline }}</span>
            </div>
          </NuxtLink>
          <button
            @click="close"
            class="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style="background-color: var(--color-bg); color: var(--color-text-secondary);"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- User section -->
        <div class="px-4 py-4 flex-shrink-0" style="border-bottom: 1px solid var(--color-border);">
          <template v-if="authStore.isLoggedIn">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                   style="background-color: var(--color-bg); border: 2px solid var(--color-border);">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5" style="color: var(--color-text-secondary);">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
                </svg>
              </div>
              <div class="min-w-0">
                <p class="text-xs font-medium" style="color: var(--color-text-disabled);">خوش آمدید</p>
                <p class="font-bold text-sm truncate" style="color: var(--color-text-primary);">{{ userName }}</p>
              </div>
            </div>
          </template>
          <NuxtLink v-else to="/auth/login" @click="close"
            class="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 bg-brand text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
            </svg>
            ورود | ثبت‌نام
          </NuxtLink>
        </div>

        <!-- Quick links -->
        <div class="px-3 py-3 flex-shrink-0" style="border-bottom: 1px solid var(--color-border);">
          <NuxtLink
            v-for="link in quickLinks"
            :key="link.name"
            :to="link.to"
            @click="close"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
            :class="isActive(link) ? 'bg-brand/10 text-brand' : ''"
            :style="!isActive(link) ? 'color: var(--color-text-primary);' : ''"
            @mouseenter="e => { if (!isActive(link)) e.currentTarget.style.backgroundColor = 'var(--color-bg)' }"
            @mouseleave="e => { if (!isActive(link)) e.currentTarget.style.backgroundColor = '' }"
          >
            <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                 :style="isActive(link) ? 'background-color: var(--color-brand); color: white;' : 'background-color: var(--color-bg); color: var(--color-text-secondary);'">
              <component :is="link.icon" class="w-4 h-4" />
            </div>
            {{ link.label }}
          </NuxtLink>
        </div>

        <!-- Categories -->
        <div class="py-3 flex-1" v-if="categories.length">
          <p class="px-4 pb-2 text-[11px] font-bold tracking-widest uppercase"
             style="color: var(--color-text-disabled);">دسته‌بندی‌ها</p>
          <div class="px-3 flex flex-col gap-0.5">
            <MobileNavItem
              v-for="cat in categories"
              :key="cat._id"
              :item="cat"
              :depth="0"
              @close="close"
            />
          </div>
        </div>

        <!-- User actions footer -->
        <div v-if="authStore.isLoggedIn" class="p-3 flex-shrink-0"
             style="border-top: 1px solid var(--color-border);">
          <div class="rounded-2xl overflow-hidden" style="background-color: var(--color-bg);">
            <NuxtLink :to="'/user/profile'" @click="close"
              class="flex items-center gap-3 px-4 py-3 text-sm transition-colors"
              style="color: var(--color-text-primary);"
              @mouseenter="e => e.currentTarget.style.backgroundColor = 'var(--color-brand-5, rgba(124,58,237,0.05))'"
              @mouseleave="e => e.currentTarget.style.backgroundColor = ''">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 flex-shrink-0" style="color: var(--color-text-secondary);">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
              </svg>
              <span class="flex-1">پروفایل من</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="color: var(--color-text-disabled);">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
              </svg>
            </NuxtLink>
            <div style="height: 1px; background-color: var(--color-border); margin: 0 12px;" />
            <button @click="handleLogout"
              class="w-full flex items-center gap-3 px-4 py-3 text-sm text-error transition-colors"
              @mouseenter="e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.05)'"
              @mouseleave="e => e.currentTarget.style.backgroundColor = ''">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 flex-shrink-0">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/>
              </svg>
              خروج از حساب
            </button>
          </div>
        </div>
      </nav>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUiStore }        from '~/stores/ui.store'
import { useAuthStore }      from '~/stores/auth.store'
import { useSettingsStore }  from '~/stores/settings.store'
const settingsStore = useSettingsStore()
import { useCategoryStore } from '~/stores/category.store'
import { storeToRefs } from 'pinia'
import MobileNavItem from '~/components/layout/MobileNavItem.vue'

const router        = useRouter()
const route         = useRoute()
const uiStore       = useUiStore()
const authStore     = useAuthStore()
const categoryStore = useCategoryStore()
const { categories } = storeToRefs(categoryStore)

const userName = computed(() => {
  const u = authStore.user
  if (u?.firstName && u?.lastName) return `${u.firstName} ${u.lastName}`
  if (u?.firstName) return u.firstName
  return u?.phone || 'کاربر'
})

// Inline SVG icon components for quick links
const IconHome = {
  render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' }),
  ]),
}
const IconBlog = {
  render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z' }),
  ]),
}

const quickLinks = [
  { name: 'home', label: 'صفحه اصلی', to: '/', icon: IconHome },
  { name: 'blog', label: 'بلاگ',      to: { name: 'blog' }, icon: IconBlog },
]

function isActive(link) {
  if (link.name === 'home') return route.path === '/'
  if (link.name === 'blog') return route.name === 'blog' || route.name === 'blog-detail'
  return false
}

function close() {
  uiStore.isMenuOpen = false
}

async function handleLogout() {
  close()
  authStore.logout()
  router.push('/')
}
</script>

<style scoped>
.backdrop-enter-active, .backdrop-leave-active { transition: opacity 0.25s ease; }
.backdrop-enter-from, .backdrop-leave-to       { opacity: 0; }

.drawer-enter-active, .drawer-leave-active { transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
.drawer-enter-from, .drawer-leave-to       { transform: translateX(100%); }
</style>
