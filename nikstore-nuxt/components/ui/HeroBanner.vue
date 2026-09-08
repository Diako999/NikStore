<template>
  <div ref="heroEl" class="hero">
    <div
      ref="bgEl"
      class="hero__bg"
      :style="{ backgroundImage: `url(${image})`, backgroundPosition: imagePosition }"
    />
    <div class="hero__scrim" />
    <slot />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

// Full-bleed rounded-bottom hero frame (spec §3). Owns only the photo +
// legibility scrim + shape + parallax; callers compose topbar/hero-copy via
// the default slot so this stays reusable for other pages later.
const props = defineProps({
  image: { type: String, required: true },
  imagePosition: { type: String, default: '25% 45%' },
})

const heroEl = ref(null)
const bgEl = ref(null)
let ctx = null

onMounted(async () => {
  // Respect reduced-motion and skip entirely rather than a static no-op tween.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const { gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)

  ctx = gsap.context(() => {
    // The bg layer is sized taller than its container (see .hero__bg inset)
    // specifically so it has room to shift without exposing empty edges.
    gsap.to(bgEl.value, {
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
  min-height: 392px;
  margin-bottom: 28px;
  overflow: hidden;
  border-radius: 0 0 40px 40px;
}

.hero__bg {
  position: absolute;
  inset: -8% 0;
  background-size: cover;
  background-repeat: no-repeat;
  will-change: transform;
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
    rgba(var(--bg-rgb), .95) 100%
  );
}
</style>
