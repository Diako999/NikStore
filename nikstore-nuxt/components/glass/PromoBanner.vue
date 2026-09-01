<template>
  <component :is="to ? 'NuxtLink' : 'div'" :to="to || undefined" class="promo-banner">
    <div class="promo-banner__txt">
      <div class="promo-banner__kicker">{{ kicker }}</div>
      <h3 class="promo-banner__title">{{ title }}</h3>
      <span class="promo-banner__cta">{{ ctaText }}</span>
    </div>
    <div class="promo-banner__num">{{ bigNumber }}</div>
  </component>
</template>

<script setup>
// Matches the mockups' `.banner` — kicker/title/CTA pill over a large faint
// percentage number. This recipe (colored padding-box fill, near-white
// border-box gradient) is distinct enough from GlassCard's border-focused
// recipe that it's implemented directly rather than composed from GlassCard.
defineProps({
  kicker:   { type: String, required: true },
  title:    { type: String, required: true },
  ctaText:  { type: String, required: true },
  to:       { type: [String, Object], default: null },
  bigNumber: { type: String, default: '' },
})
</script>

<style scoped>
.promo-banner {
  border-radius: 18px;
  padding: 20px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
  border: 1.5px solid transparent;
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  background:
    linear-gradient(105deg, rgba(61, 139, 82, .38), rgba(122, 90, 220, .20)) padding-box,
    linear-gradient(120deg, rgba(255, 255, 255, .4), rgba(255, 255, 255, .03) 60%) border-box;
}
[data-theme='light'] .promo-banner {
  background:
    linear-gradient(105deg, rgba(122, 90, 220, .36), rgba(231, 175, 66, .24)) padding-box,
    linear-gradient(120deg, rgba(255, 255, 255, 1), rgba(255, 255, 255, .2) 60%) border-box;
  box-shadow: var(--glass-shadow);
}

.promo-banner__kicker {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .5px;
  margin-bottom: 6px;
  color: var(--brand-light);
}
[data-theme='light'] .promo-banner__kicker { color: var(--brand-dark); }

.promo-banner__title { font-size: 17px; font-weight: 800; margin-bottom: 10px; color: var(--text-primary); }

.promo-banner__cta {
  font-size: 12px;
  font-weight: 700;
  color: #16241C;
  background: #F5F7F3;
  padding: 9px 16px;
  border-radius: 999px;
  display: inline-block;
}
[data-theme='light'] .promo-banner__cta { color: #fff; background: var(--brand-dark); }

.promo-banner__num { font-size: 34px; font-weight: 800; color: rgba(255, 255, 255, .18); }
[data-theme='light'] .promo-banner__num { color: rgba(30, 40, 34, .10); }
</style>
