<template>
  <div class="min-h-screen flex flex-col bg-transparent">
    <!-- UXID-006: skip navigation for keyboard/screen-reader users -->
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-[500] focus:px-4 focus:py-2 focus:bg-brand focus:text-white focus:rounded-lg focus:text-sm focus:font-bold"
    >رفتن به محتوای اصلی</a>

    <AnnouncementBar />
    <AppHeader />

    <main id="main-content" class="flex-1 pb-14 md:pb-0">
      <slot />
    </main>

    <AppFooter class="pb-14 md:pb-0" />
    <AppMobileNav />
    <AppMobileDrawer />
    <BaseToast />
    <SitePopup />
    <NotificationConsentModal v-model="showConsentModal" />
    <AppPwaInstall />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AnnouncementBar          from '~/components/layout/AnnouncementBar.vue'
import AppHeader                from '~/components/layout/AppHeader.vue'
import AppFooter                from '~/components/layout/AppFooter.vue'
import AppMobileNav             from '~/components/layout/AppMobileNav.vue'
import AppMobileDrawer          from '~/components/layout/AppMobileDrawer.vue'
import BaseToast                from '~/components/common/BaseToast.vue'
import SitePopup                from '~/components/common/SitePopup.vue'
import NotificationConsentModal from '~/components/common/NotificationConsentModal.vue'
import AppPwaInstall            from '~/components/AppPwaInstall.vue'
import { useNotificationPermission } from '~/composables/useNotificationPermission'

const CONSENT_DELAY_MS = 45_000

const { canAsk } = useNotificationPermission()

const showConsentModal = ref(false)
let   consentTimer     = null

function scheduleConsent() {
  if (consentTimer || !canAsk.value) return
  consentTimer = setTimeout(() => {
    consentTimer = null
    if (!canAsk.value) return
    showConsentModal.value = true
  }, CONSENT_DELAY_MS)
}

function cancelConsent() {
  if (consentTimer) { clearTimeout(consentTimer); consentTimer = null }
  showConsentModal.value = false
}

// Show notification permission prompt to all visitors after 5 seconds
onMounted(() => scheduleConsent())
onUnmounted(cancelConsent)
</script>
