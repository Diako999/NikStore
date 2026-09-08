<template>
  <div ref="heroEl" class="hero">
    <div
      class="hero__bg"
      :class="{ 'hero__bg--visible': mode !== 'light' }"
      :style="{ backgroundImage: `url(${imageDark})`, backgroundPosition: positionDark }"
    />
    <div
      class="hero__bg"
      :class="{ 'hero__bg--visible': mode === 'light' }"
      :style="{ backgroundImage: `url(${imageLight})`, backgroundPosition: positionLight }"
    />
    <div class="hero__scrim" />
    <slot />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

// Full-bleed hero frame (spec §3) — pinned to the viewport via `position:
// fixed` in the homepage's own CSS (see .home-hero override in pages/index),
// with a same-height spacer taking its place in document flow so the page
// below it can scroll up and over it. Owns the photo (theme-crossfaded) +
// legibility scrim; callers compose topbar/hero-copy via the default slot.
defineProps({
  imageDark: { type: String, required: true },
  imageLight: { type: String, required: true },
  positionDark: { type: String, default: '50% 50%' },
  positionLight: { type: String, default: '50% 50%' },
  mode: { type: String, required: true },
})

const heroEl = ref(null)
let ctx = null

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const { gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)

  ctx = gsap.context(() => {
    // The bg layers are sized taller than their container (see .hero__bg
    // inset) specifically so they have room to shift without exposing
    // empty edges.
    gsap.to(heroEl.value.querySelectorAll('.hero__bg'), {
      yPercent: 15,
      ease: 'none',
      scrollTrigger: {
        trigger: heroEl.value,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    })
  }, heroEl.value)
})

onUnmounted(() => {
  ctx?.revert()
})
</script>

<style scoped>
.hero {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.hero__bg {
  position: absolute;
  inset: -8% 0;
  background-size: cover;
  background-repeat: no-repeat;
  opacity: 0;
  transition: opacity .6s ease;
  will-change: transform, opacity;
}
.hero__bg--visible {
  opacity: 1;
}

.hero__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(9, 15, 12, .35) 0%,
    rgba(9, 15, 12, .06) 24%,
    rgba(9, 15, 12, .5) 60%,
    rgba(9, 15, 12, .82) 100%
  );
}
[data-theme='light'] .hero__scrim {
  background: linear-gradient(
    180deg,
    rgba(9, 15, 12, .32) 0%,
    rgba(9, 15, 12, .05) 24%,
    rgba(9, 15, 12, .42) 58%,
    rgba(9, 15, 12, .55) 100%
  );
}
</style>
