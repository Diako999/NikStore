<template>
  <component :is="to ? 'NuxtLink' : 'div'" :to="to || undefined" class="glass-banner" :class="`glass-banner--${variant}`">
    <slot />
  </component>
</template>

<script setup>
// Shared wrapper for the flash-sale strip (§7) and the promo/collection
// banner (§10) — both are a rounded glass surface with a colored gradient
// fill and space-between flex content, differing only in the fill recipe
// and their inner composition (which callers own via the default slot).
defineProps({
  variant: { type: String, default: 'flash', validator: (v) => ['flash', 'promo'].includes(v) },
  to: { type: [String, Object], default: null },
})
</script>

<style scoped>
.glass-banner {
  margin: 0 18px;
  border-radius: 18px;
  padding: 16px 18px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid transparent;
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
}
[data-theme='light'] .glass-banner {
  border-width: 1.5px;
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  box-shadow: var(--glass-shadow);
}

.glass-banner--flash {
  background:
    linear-gradient(120deg, rgba(61, 139, 82, .38), rgba(122, 90, 220, .20)) padding-box,
    linear-gradient(120deg, rgba(255, 255, 255, .4), rgba(255, 255, 255, .03) 60%) border-box;
}
[data-theme='light'] .glass-banner--flash {
  background:
    linear-gradient(120deg, rgba(110, 176, 130, .50), rgba(122, 90, 220, .22)) padding-box,
    linear-gradient(120deg, rgba(255, 255, 255, 1), rgba(255, 255, 255, .2) 60%) border-box;
}

.glass-banner--promo {
  padding: 20px;
  background:
    linear-gradient(105deg, rgba(122, 90, 220, .32), rgba(231, 175, 66, .16)) padding-box,
    linear-gradient(120deg, rgba(255, 255, 255, .4), rgba(255, 255, 255, .03) 60%) border-box;
}
[data-theme='light'] .glass-banner--promo {
  background:
    linear-gradient(105deg, rgba(122, 90, 220, .36), rgba(231, 175, 66, .24)) padding-box,
    linear-gradient(120deg, rgba(255, 255, 255, 1), rgba(255, 255, 255, .2) 60%) border-box;
}
</style>
