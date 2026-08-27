<template>
  <header
    class="sticky top-0 z-header transition-colors duration-200"
    style="
      background-color: var(--color-header-bg);
      backdrop-filter: blur(20px) saturate(150%);
      -webkit-backdrop-filter: blur(20px) saturate(150%);
      border-bottom: 1px solid var(--color-header-border);
    "
  >
    <!-- Main row -->
    <div class="container-main flex items-center gap-3 h-14 md:h-16">
      <!-- Mobile hamburger -->
      <button
        class="md:hidden p-2 -ml-1 rounded-lg transition-colors"
        style="color: var(--color-text-secondary);"
        @click="uiStore.toggleMenu()"
        aria-label="منو"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
        </svg>
      </button>

      <!-- Logo — rightmost on desktop (order-3) -->
      <NuxtLink :to="'/'" class="flex items-center gap-2 shrink-0 leading-tight md:order-1">
        <img src="/nik-logo.png" :alt="`لوگو ${settingsStore.siteName}`" class="w-8 h-8 shrink-0 object-contain rounded-full" draggable="false" />
        <div class="flex flex-col items-start">
          <span class="text-brand font-bold text-xl tracking-tight">{{ settingsStore.siteName }}</span>
          <span class="hidden md:block -mt-0.5 text-xs" style="color: var(--color-text-secondary);">{{ settingsStore.tagline }}</span>
        </div>
      </NuxtLink>

      <!-- Search (desktop) — middle (order-2) -->
      <div class="hidden md:flex md:order-2 flex-1 max-w-xl">
        <AppHeaderSearch />
      </div>

      <!-- Spacer for mobile -->
      <div class="flex-1 md:hidden" />

      <!-- Actions — leftmost on desktop (order-1) -->
      <ClientOnly>
        <AppHeaderActions class="md:order-3 md:ms-auto" />
        <template #fallback>
          <!-- SSR placeholder — same size as real actions to prevent layout shift -->
          <div class="flex items-center gap-1 shrink-0">
            <div class="w-9 h-9 rounded-lg bg-white/8" />
            <div class="w-9 h-9 rounded-lg bg-white/8" />
            <div class="w-9 h-9 rounded-lg bg-white/8" />
          </div>
        </template>
      </ClientOnly>
    </div>

    <!-- Mobile search row -->
    <div class="md:hidden px-4 pb-3">
      <AppHeaderSearch />
    </div>

    <!-- Category nav (desktop) -->
    <AppHeaderNav v-if="!hideNav" />
  </header>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUiStore }       from '~/stores/ui.store'
import { useAuthStore }     from '~/stores/auth.store'
import { useCategoryStore } from '~/stores/category.store'
import { useCartStore }     from '~/stores/cart.store'
import { useSettingsStore } from '~/stores/settings.store'
import AppHeaderSearch  from './AppHeaderSearch.vue'
import AppHeaderActions from './AppHeaderActions.vue'
import AppHeaderNav     from './AppHeaderNav.vue'

const props = defineProps({ hideNav: { type: Boolean, default: false } })

const uiStore       = useUiStore()
const authStore     = useAuthStore()
const categoryStore = useCategoryStore()
const cartStore     = useCartStore()
const settingsStore = useSettingsStore()

onMounted(async () => {
  categoryStore.fetchCategories()
  if (authStore.isLoggedIn) {
    authStore.fetchProfile().catch(() => {})
    cartStore.fetchCart().catch(() => {})
  }
})
</script>
