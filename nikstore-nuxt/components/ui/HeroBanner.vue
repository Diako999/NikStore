<template>
  <div
    class="hero"
    :style="{ backgroundImage: `var(--hero-scrim), url(${image})`, backgroundPosition: `center, ${imagePosition}` }"
  >
    <slot />
  </div>
</template>

<script setup>
// Full-bleed rounded-bottom hero frame (spec §3). Owns only the photo +
// legibility scrim + shape; callers compose topbar/hero-copy via the
// default slot so this stays reusable for other pages later.
defineProps({
  image: { type: String, required: true },
  imagePosition: { type: String, default: '25% 45%' },
})
</script>

<style scoped>
.hero {
  position: relative;
  width: 100%;
  min-height: 392px;
  margin-bottom: 28px;
  overflow: hidden;
  border-radius: 0 0 40px 40px;
  background-size: cover, cover;
  background-repeat: no-repeat, no-repeat;
  --hero-scrim: linear-gradient(
    180deg,
    rgba(9, 15, 12, .35) 0%,
    rgba(9, 15, 12, .06) 24%,
    rgba(9, 15, 12, .5) 60%,
    rgba(9, 15, 12, .82) 100%
  );
}
[data-theme='light'] .hero {
  --hero-scrim: linear-gradient(
    180deg,
    rgba(9, 15, 12, .32) 0%,
    rgba(9, 15, 12, .05) 24%,
    rgba(9, 15, 12, .42) 58%,
    rgba(var(--bg-rgb), .95) 100%
  );
}
</style>
