<template>
  <section v-if="displayed.length" class="sb-wrap">
    <div ref="gridRef" class="sb-grid">
      <GlassPromoBanner
        v-for="banner in displayed"
        :key="banner._id || banner.id"
        :kicker="banner.eyebrow || 'پیشنهاد ویژه'"
        :title="banner.title"
        :cta-text="banner.cta || 'مشاهده محصولات'"
        :to="banner.ctaLink || '/'"
        :big-number="bigNumberFor(banner)"
      />
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { bannerService } from '~/services/banner.service'
import GlassPromoBanner from '~/components/glass/PromoBanner.vue'
import { useGsapReveal } from '~/composables/useGsapReveal'

const displayed = ref([])
const gridRef = ref(null)

useGsapReveal(gridRef, { y: 18, stagger: 0.08 })

// Pull a leading percentage/number out of the title for the banner's large
// faint background numeral (matches the mockup's "٪۲۰" treatment) — falls
// back to a generic percent glyph when the title has no number in it.
function bigNumberFor(banner) {
  const match = (banner.title || '').match(/\d+/)
  return match ? `%${match[0]}` : '٪'
}

onMounted(async () => {
  try {
    const { data } = await bannerService.getActivePromo()
    if (Array.isArray(data) && data.length > 0) displayed.value = data
  } catch {
    // silently keep static fallback
  }
})
</script>

<style scoped>
/* ── Section ───────────────────────────────────────── */
.sb-wrap {
  padding: 0.25rem 0;
}

.sb-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .sb-grid { grid-template-columns: 1fr 1fr; }
}
</style>
