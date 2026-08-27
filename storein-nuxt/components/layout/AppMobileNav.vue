<template>
  <nav class="md:hidden fixed bottom-0 inset-x-0 z-header h-14 glass-strong shadow-floating">
    <div class="flex items-stretch h-full">
      <NuxtLink
        v-for="item in navItems"
        :key="item.label"
        :to="item.to"
        :class="[
          'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative',
          isActive(item) ? 'text-brand' : 'text-text-secondary',
        ]"
        :aria-label="item.label"
      >
        <!-- Cart badge — client-only to avoid hydration mismatch -->
        <ClientOnly>
          <span
            v-if="item.badge && item.badge > 0"
            class="absolute top-1.5 left-1/2 translate-x-2 min-w-[16px] h-4 bg-error text-white text-xs font-bold rounded-full flex items-center justify-center px-1 leading-none font-fanum"
          >
            {{ item.badge > 9 ? '۹+' : item.badge }}
          </span>
        </ClientOnly>

        <!-- Selected-state highlight — soft glass pill, not just a color change -->
        <span
          v-if="isActive(item)"
          class="absolute inset-x-2.5 top-1.5 bottom-1.5 rounded-xl -z-10"
          style="background: rgb(var(--color-brand-rgb) / 0.16); box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);"
          aria-hidden="true"
        />

        <component :is="item.icon" class="w-5 h-5" />
        <span class="text-xs font-medium">{{ item.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup>
import { computed, h } from 'vue'
import { useRoute }    from 'vue-router'
import { useAuthStore } from '~/stores/auth.store'
import { useCartStore } from '~/stores/cart.store'

const route     = useRoute()
const authStore = useAuthStore()
const cartStore = useCartStore()

// Inline SVG icon components
const IconHome = { render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.6', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'm2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' })]) }
const IconGrid = { render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.6', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z' })]) }
const IconSearch = { render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.6', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z' })]) }
const IconBag  = { render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.6', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z' })]) }
const IconUser = { render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.6', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z' })]) }

// Static items — no auth-dependent `to` so SSR and client render identical HTML
const navItems = computed(() => [
  { label: 'خانه',    to: '/',               icon: IconHome,   routePaths: ['/'] },
  { label: 'دسته‌ها', to: '/products',       icon: IconGrid,   routePaths: ['/products', '/category'] },
  { label: 'جستجو',  to: '/search',         icon: IconSearch, routePaths: ['/search'] },
  { label: 'سبد',    to: '/cart',           icon: IconBag,    routePaths: ['/cart'], badge: cartStore.totalItems },
  { label: 'من',     to: '/user/profile',   icon: IconUser,   routePaths: ['/user', '/auth/login', '/auth/otp'] },
])

function isActive(item) {
  return item.routePaths?.some(p => route.path === p || route.path.startsWith(p + '/'))
}
</script>
