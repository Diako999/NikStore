<template>
  <div class="admin-layout-root min-h-screen flex">

    <!-- Mobile overlay -->
    <Transition name="fade">
      <div v-if="ui.sidebarMobileOpen"
           class="fixed inset-0 bg-black/50 z-sidebar lg:hidden"
           @click="ui.closeMobileSidebar()" />
    </Transition>

    <!-- Sidebar -->
    <AdminSidebar />

    <!-- Main area -->
    <div
      class="flex-1 flex flex-col min-w-0 transition-all duration-300"
      :class="ui.sidebarCollapsed ? 'lg:pr-[68px]' : 'lg:pr-[268px]'"
    >
      <AdminHeader />

      <main class="flex-1 p-5 overflow-auto">
        <div class="mb-5">
          <h1 class="page-title">{{ route.meta.title }}</h1>
        </div>
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute }            from 'vue-router'
import { storeToRefs }         from 'pinia'
import { useUiStore }          from '@/stores/ui.store'
import { useSettingsStore }    from '@/stores/settings.store'
import AdminSidebar   from '@/components/layout/AdminSidebar.vue'
import AdminHeader    from '@/components/layout/AdminHeader.vue'
import { useRealtimeNotifications } from '@/composables/useRealtimeNotifications'
import { useAdminTheme }             from '@/composables/useAdminTheme'
import { useAdminHead }              from '@/composables/useHead'

const route          = useRoute()
const ui             = useUiStore()
const settingsStore  = useSettingsStore()
const { settings }   = storeToRefs(settingsStore)
const routeTitle     = computed(() => route.meta.title ?? '')

useAdminHead(settings, routeTitle)
useRealtimeNotifications()
const { init: initTheme } = useAdminTheme()
onMounted(initTheme)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from,  .fade-leave-to      { opacity: 0; }

/* Calm, mostly-solid root — cohesive with the aurora palette (same base
   tone as --page-bg) but deliberately NOT the busy full mesh, which is
   reserved for the login screen. A faint radial brand tint keeps it from
   reading as a flat, disconnected surface. */
.admin-layout-root {
  background-color: rgb(var(--bg-rgb));
  background-image: radial-gradient(120% 60% at 100% 0%, rgb(var(--brand-rgb) / 0.05), transparent 60%);
}
</style>
