<template>
  <div
    class="hero-banner"
    :style="{
      backgroundImage: `var(--hb-scrim), url(${image})`,
      backgroundPosition: `center, ${imagePosition}`,
    }"
  >
    <div class="hero-banner__copy">
      <slot />
    </div>
  </div>
</template>

<script setup>
// Full-bleed rounded-bottom hero. Used on the homepage, category banners,
// and product hero — all of which need different copy, so this component
// only owns the frame (image, scrim, rounded-bottom shape, text-shadow
// legibility helper) and lets the caller compose eyebrow/title/price/CTA
// content via the default slot.
defineProps({
  image: { type: String, required: true },
  // CSS background-position for the image layer only (the scrim layer is
  // always centered) — matches the mockups' 25% 45% framing by default.
  imagePosition: { type: String, default: '25% 45%' },
})
</script>

<style scoped>
.hero-banner {
  position: relative;
  width: 100%;
  min-height: 392px;
  overflow: hidden;
  /* Flush against the very top of the page (covers the status-bar/notch
     area on mobile) — no top radius, no top margin. Rounded bottom only. */
  border-radius: 0 0 40px 40px;
  background-size: cover, cover;
  background-repeat: no-repeat, no-repeat;
  /* Dark theme scrim: fades into a fixed dark rgba since the whole app is
     already dark there (no page-color blending needed). */
  --hb-scrim: linear-gradient(
    180deg,
    rgba(9, 15, 12, .35) 0%,
    rgba(9, 15, 12, .06) 24%,
    rgba(9, 15, 12, .5) 60%,
    rgba(9, 15, 12, .82) 100%
  );
}

[data-theme='light'] .hero-banner {
  /* Light theme scrim fades INTO the page background color (--bg-rgb) so
     the hero blends seamlessly into the page below it, instead of ending
     on a hard edge. */
  --hb-scrim: linear-gradient(
    180deg,
    rgba(9, 15, 12, .32) 0%,
    rgba(9, 15, 12, .05) 24%,
    rgba(9, 15, 12, .42) 58%,
    rgba(var(--bg-rgb), .95) 100%
  );
}

.hero-banner__copy {
  position: relative;
  z-index: 3;
  padding: 150px 20px 26px;
  max-width: 80%;
  /* Hero stays a "dark island" in both themes per spec — text is always
     light-colored on a photo, never theme-reactive, so it stays legible
     regardless of the current mode. */
  color: #fff;
}
.hero-banner__copy :deep(*) { text-shadow: 0 2px 12px rgba(0, 0, 0, .45); }
</style>
