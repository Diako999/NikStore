<template>
  <header
    class="app-header sticky top-0 z-header"
    :class="isTransparent ? 'app-header--transparent' : 'app-header--glass'"
  >
    <!-- Main row -->
    <div class="container-main flex items-center gap-3 h-14 md:h-16">
      <!-- Mobile hamburger -->
      <button
        class="md:hidden p-2 -ml-1 rounded-lg transition-colors"
        style="color: var(--text-secondary);"
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
          <span class="hidden md:block -mt-0.5 text-xs" style="color: var(--text-secondary);">{{ settingsStore.tagline }}</span>
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
    <AppHeaderNav v-if="!hideNav" :transparent="isTransparent" />
  </header>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
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

// ── Transparent-over-hero → glassy-on-scroll ────────────────────────────
// Only pages that declare a hero (definePageMeta({ hasHero: true })) get the
// transparent-at-top phase — everywhere else the header stays glassy/sticky
// throughout, since there's no photo underneath it to preserve.
const route     = useRoute()
const pageHasHero = computed(() => !!route.meta?.hasHero)

// Fixed scroll threshold (rather than measuring the hero node itself, which
// would need a cross-component ref since the header and hero are siblings
// under the layout, not ancestor/descendant) — roughly the point where the
// hero's copy block has scrolled out from under the header.
const SCROLL_THRESHOLD = 260

// Synchronous initial value (not set in onMounted) so SSR/first paint already
// renders the correct phase for the route — no glass-then-transparent flash.
const scrolled = ref(!pageHasHero.value)

const isTransparent = computed(() => pageHasHero.value && !scrolled.value)

let ticking = false
function onScroll() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    scrolled.value = window.scrollY > SCROLL_THRESHOLD
    ticking = false
  })
}

// The header persists across client-side navigations (it lives in the layout,
// not the page), so react to the route's hasHero flag changing rather than
// only checking it once on mount — otherwise navigating from a non-hero page
// straight into the hero page (or back out) would leave the header showing
// a stale phase until the next scroll event.
watch(pageHasHero, (has) => {
  if (has) {
    scrolled.value = window.scrollY > SCROLL_THRESHOLD
    window.addEventListener('scroll', onScroll, { passive: true })
  } else {
    window.removeEventListener('scroll', onScroll)
    scrolled.value = true // non-hero pages always render glassy
  }
}, { immediate: false })

onMounted(async () => {
  categoryStore.fetchCategories().catch(() => {})
  if (authStore.isLoggedIn) {
    authStore.fetchProfile().catch(() => {})
    cartStore.fetchCart().catch(() => {})
  }

  if (pageHasHero.value) {
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // correct for a reload that lands mid-scroll (e.g. back navigation)
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
.app-header {
  transition: background-color 300ms ease, backdrop-filter 300ms ease, border-color 300ms ease;
}

.app-header--glass {
  background-color: var(--glass-strong);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  border-bottom: 1px solid var(--glass-border);
}

/* Transparent phase: sits directly over the hero photo, no glass fill —
   text/icons pick up the same text-shadow legibility trick the hero's own
   copy already uses over its photo. */
.app-header--transparent {
  background-color: transparent;
  backdrop-filter: blur(0px) saturate(100%);
  -webkit-backdrop-filter: blur(0px) saturate(100%);
  border-bottom: 1px solid transparent;
}
.app-header--transparent :deep(svg),
.app-header--transparent :deep(img) {
  filter: drop-shadow(0 1px 4px rgba(0, 0, 0, .55));
}
.app-header--transparent :deep(span),
.app-header--transparent :deep(a) {
  text-shadow: 0 1px 6px rgba(0, 0, 0, .55);
}
</style>
