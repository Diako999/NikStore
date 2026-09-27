<template>
  <NuxtLink to="/" class="brandmark">
    <span class="brandmark__logo-stack">
      <img src="/images/logo-white.png" :alt="settings.siteName" class="brandmark__logo" />
      <img
        src="/images/logo-green.png"
        alt=""
        aria-hidden="true"
        class="brandmark__logo brandmark__logo--fill"
        :style="{ clipPath: `inset(${(1 - fill) * 100}% 0 0 0)` }"
      >
    </span>
  </NuxtLink>
</template>

<script setup>
// Used in the hero topbar over the photo (always white by default, not
// theme-reactive) — a second green copy is clipped on top of it and its
// clip-path is driven by `fill` (0..1, scroll progress through the hero)
// so the mark visually fills with brand green from the bottom up as the
// page scrolls, like a level rising, rather than a straight opacity fade.
const { settings } = useSiteSettings()

defineProps({
  fill: { type: Number, default: 0 },
})
</script>

<style scoped>
.brandmark {
  display: flex;
  align-items: center;
}

.brandmark__logo-stack {
  position: relative;
  display: block;
  height: 26px;
}

.brandmark__logo {
  height: 26px;
  width: auto;
  display: block;
  filter: drop-shadow(0 1px 4px rgba(0, 0, 0, .35));
}

.brandmark__logo--fill {
  position: absolute;
  inset: 0;
}
</style>
