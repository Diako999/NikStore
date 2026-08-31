<template>
  <section ref="rootRef" class="trust">
    <GlassTrustBadgeRow :items="trustItems">
      <template #icon="{ item }">
        <span class="trust__emoji" aria-hidden="true">{{ item.icon }}</span>
      </template>
    </GlassTrustBadgeRow>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSettingsStore } from '~/stores/settings.store'
import GlassTrustBadgeRow from '~/components/glass/TrustBadgeRow.vue'
import { useGsapReveal } from '~/composables/useGsapReveal'

const { trustItems: rawTrustItems } = useSettingsStore()

// TrustBadgeRow expects { icon, label } — map the settings store's
// { icon, bgColor, title, subtitle } shape onto `label` (still exposing the
// full item to the #icon/#default scoped slots above for the emoji + title).
const trustItems = computed(() => rawTrustItems.map((item) => ({ ...item, label: item.title })))

const rootRef = ref(null)
useGsapReveal(rootRef, { y: 16, stagger: 0.06, selector: '.trust-row__item' })
</script>

<style scoped>
.trust {
  padding: 1.25rem 0 0.5rem;
}

.trust__emoji {
  font-size: 1.125rem;
  line-height: 1;
  user-select: none;
}
</style>
