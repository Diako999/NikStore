<template>
  <section v-if="slides.length" class="hero" role="region" aria-label="تبلیغات و بنرها" aria-roledescription="carousel">

    <Transition name="hero">
      <div
        :key="current"
        class="hero__slide"
        :style="slideStyle(slides[current])"
        role="group"
        :aria-label="`اسلاید ${current + 1} از ${slides.length}: ${slides[current].title}`"
      >

        <!-- Background image — desktop (hidden on mobile if mobileImageUrl exists) -->
        <div v-if="slides[current].imageUrl"
             class="hero__img"
             :class="slides[current].mobileImageUrl ? 'hero__img--desktop-only' : ''"
             :style="{ backgroundImage: `url(${slides[current].imageUrl})` }" />

        <!-- Background image — mobile crop (only rendered when mobileImageUrl is set) -->
        <div v-if="slides[current].mobileImageUrl"
             class="hero__img hero__img--mobile-only"
             :style="{ backgroundImage: `url(${slides[current].mobileImageUrl})` }" />

        <!-- Gradient veil for text readability -->
        <div class="hero__veil" />

        <!-- Dot-mesh texture overlay -->
        <div class="hero__mesh" aria-hidden="true" />

        <!-- Decorative badge SVG when no image -->
        <div v-if="!slides[current].imageUrl && slides[current].badgeType !== 'none'"
             class="hero__deco" aria-hidden="true">
          <svg v-if="slides[current].badgeType === 'sale'" width="420" height="260"
               viewBox="0 0 340 200" fill="none" stroke="white" stroke-width="6"
               stroke-linecap="round" stroke-linejoin="round">
            <circle cx="90" cy="90" r="60"/>
            <circle cx="250" cy="140" r="60"/>
            <path d="M300 40 L40 170"/>
          </svg>
          <svg v-else-if="slides[current].badgeType === 'new'" width="420" height="260"
               viewBox="0 0 340 200" fill="none" stroke="white" stroke-width="6"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M90 40 Q104 96 170 108 Q104 120 90 176 Q76 120 10 108 Q76 96 90 40 Z"/>
            <path d="M260 70 Q268 100 300 108 Q268 116 260 146 Q252 116 220 108 Q252 100 260 70 Z"/>
          </svg>
          <svg v-else width="280" height="280" viewBox="0 0 280 280"
               fill="none" stroke="white" stroke-width="6" stroke-linecap="round">
            <path d="M140 30 L140 250"/>
            <path d="M40 80 L240 200"/>
            <path d="M240 80 L40 200"/>
          </svg>
        </div>

        <!-- Text content -->
        <div class="container-main hero__body">
          <div class="hero__copy">
            <span class="hero__eyebrow">{{ slides[current].eyebrow }}</span>
            <h1 class="hero__title">{{ slides[current].title }}</h1>
            <p class="hero__sub">{{ slides[current].subtitle }}</p>
            <NuxtLink
              :to="slides[current].ctaLink || '/'"
              class="hero__btn"
              :style="{ backgroundColor: slides[current].accent, color: slides[current].bgFrom }"
            >
              {{ slides[current].cta || 'مشاهده محصولات' }}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                   stroke-width="2.5" stroke="currentColor" class="hero__btn-ico" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
              </svg>
            </NuxtLink>
          </div>
        </div>

        <!-- Slide progress bar -->
        <div class="hero__prog">
          <div :key="`prog-${current}`" class="hero__prog-fill"
               :class="{ 'hero__prog-fill--paused': paused }"
               :style="{ backgroundColor: slides[current].accent }" />
        </div>

      </div>
    </Transition>

    <!-- Slide indicators -->
    <div class="hero__dots" role="tablist" :aria-label="`اسلایدشو — ${slides.length} اسلاید`" dir="ltr">
      <button
        v-for="(s, i) in slides"
        :key="s._id || s.id"
        role="tab"
        :aria-label="`اسلاید ${i + 1} از ${slides.length}`"
        :aria-selected="current === i"
        class="hero__dot-btn"
        @click="goTo(i)"
      >
        <span :class="['hero__dot', current === i && 'hero__dot--on']" aria-hidden="true" />
      </button>
    </div>

    <!-- Pause / Play toggle (WCAG 2.2.2) -->
    <button
      class="hero__pause"
      @click="togglePause"
      :aria-label="paused ? 'شروع اسلایدشو' : 'توقف اسلایدشو'"
      :title="paused ? 'شروع' : 'توقف'"
    >
      <svg v-if="paused" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-4 h-4">
        <path d="M8 5v14l11-7z"/>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-4 h-4">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
      </svg>
    </button>

    <!-- Prev / Next arrows -->
    <button class="hero__arr hero__arr--r" @click="prev" aria-label="قبلی">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
           stroke-width="2.5" stroke="currentColor" class="w-5 h-5" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
      </svg>
    </button>
    <button class="hero__arr hero__arr--l" @click="next" aria-label="بعدی">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
           stroke-width="2.5" stroke="currentColor" class="w-5 h-5" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
      </svg>
    </button>

  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { bannerService } from '~/services/banner.service'
import { logger } from '~/utils/logger'

const CTX = 'HeroBanner'

const slides  = ref([])
const current = ref(0)
const paused  = ref(false)
let autoTimer = null

function slideStyle(slide) {
  if (slide.imageUrl) return {}
  return { background: `linear-gradient(135deg, ${slide.bgFrom} 0%, ${slide.bgTo} 100%)` }
}

function next()  { current.value = (current.value + 1) % slides.value.length }
function prev()  { current.value = (current.value - 1 + slides.value.length) % slides.value.length }
function goTo(i) { current.value = i; resetTimer() }

function togglePause() {
  paused.value = !paused.value
  if (paused.value) clearInterval(autoTimer)
  else resetTimer()
}

function resetTimer() {
  clearInterval(autoTimer)
  if (!paused.value) autoTimer = setInterval(next, 4500)
}

onMounted(async () => {
  autoTimer = setInterval(next, 4500)
  try {
    const { data } = await bannerService.getActive()
    if (Array.isArray(data) && data.length > 0) {
      slides.value = data
      current.value = 0
      const withMobile = data.filter(s => s.mobileImageUrl).length
      logger.info(`hero: loaded ${data.length} slides (${withMobile} with mobile image)`, {}, CTX)
    }
  } catch (err) {
    logger.warn('hero: failed to load banners', { err }, CTX)
  }
})

onUnmounted(() => clearInterval(autoTimer))
</script>

<style scoped>
/* ── Root ─────────────────────────────────────────── */
.hero {
  position: relative;
  width: 100%;
  height: 360px;
  overflow: hidden;
  border-radius: 0;
  margin-top: 0;
}

@media (min-width: 768px) {
  .hero {
    height: 460px;
    border-radius: 20px;
    margin-top: 0.75rem;
  }
}

/* ── Slide ─────────────────────────────────────────── */
.hero__slide {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
}

/* Background image with Ken Burns */
.hero__img {
  position: absolute;
  inset: -4%;
  background-size: cover;
  background-position: center 20%;
  animation: kb 14s ease-in-out infinite alternate;
}

/* Desktop image hidden on mobile when a mobile-specific image exists */
.hero__img--desktop-only { display: none; }
@media (min-width: 768px) {
  .hero__img--desktop-only { display: block; }
  .hero__img--mobile-only  { display: none;  }
}
@keyframes kb {
  from { transform: scale(1) translate(0, 0); }
  to   { transform: scale(1.07) translate(-1%, -1%); }
}

/* Gradient overlay for readability — RTL: text is on physical right, so darken right side */
.hero__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.72) 100%);
}

/* Dot mesh texture */
.hero__mesh {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 24px 24px;
  pointer-events: none;
}

/* Decorative SVG */
.hero__deco {
  position: absolute;
  left: -10px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.09;
  pointer-events: none;
}

/* ── Body ────────────────────────────────────────────── */
.hero__body {
  position: relative;
  z-index: 2;
  width: 100%;
}

.hero__copy {
  max-width: 440px;
  animation: copy-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  padding-top: 0;
}

@media (max-width: 767px) {
  .hero__copy {
    max-width: 100%;
  }
}
@keyframes copy-in {
  from { opacity: 0; transform: translateY(22px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Eyebrow pill */
.hero__eyebrow {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: rgba(255,255,255,0.88);
  background: rgba(255,255,255,0.14);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.22);
  padding: 4px 12px;
  border-radius: 99px;
  margin-bottom: 14px;
}

/* Title */
.hero__title {
  font-size: 1.5rem;
  font-weight: 900;
  color: #ffffff;
  line-height: 1.3;
  margin: 0 0 12px;
  text-shadow: 0 2px 20px rgba(0,0,0,0.5);
}
@media (min-width: 768px) {
  .hero__title { font-size: 2.375rem; margin-bottom: 14px; }
}

/* Subtitle */
.hero__sub {
  display: block;
  font-size: 0.78rem;
  color: rgba(255,255,255,0.72);
  line-height: 1.65;
  margin: 0 0 16px;
}
@media (min-width: 768px) {
  .hero__sub { font-size: 0.9rem; margin-bottom: 26px; }
}

/* CTA button — rendered as <a> (NuxtLink) */
.hero__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 0.875rem;
  padding: 11px 24px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 24px rgba(0,0,0,0.28);
  margin-top: 14px;
}
.hero__btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.38);
}
.hero__btn:active { transform: scale(0.97); }
.hero__btn-ico { width: 16px; height: 16px; }

/* ── Progress bar ────────────────────────────────────── */
.hero__prog {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255,255,255,0.12);
  z-index: 5;
}
.hero__prog-fill {
  height: 100%;
  width: 0;
  animation: prog 4.5s linear forwards;
}
.hero__prog-fill--paused {
  animation-play-state: paused;
}
@keyframes prog {
  to { width: 100%; }
}

/* ── Dots ──────────────────────────────────────────── */
.hero__dots {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 10;
}
/* Accessible tap wrapper — 44×44px WCAG target */
.hero__dot-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}
.hero__dot-btn:focus-visible {
  outline: 2px solid rgba(255,255,255,0.8);
  border-radius: 6px;
}
.hero__dot {
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 99px;
  background: rgba(255,255,255,0.38);
  transition: all 0.3s ease;
  pointer-events: none;
}
.hero__dot--on {
  width: 22px;
  background: rgba(255,255,255,0.9);
}

/* ── Pause button ──────────────────────────────────── */
.hero__pause {
  position: absolute;
  bottom: 14px;
  left: 16px;
  z-index: 10;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255,255,255,0.14);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.22);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}
.hero__pause:hover { background: rgba(255,255,255,0.26); }
.hero__pause:focus-visible { outline: 2px solid rgba(255,255,255,0.8); }

/* ── Arrows ────────────────────────────────────────── */
.hero__arr {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 44px; height: 44px;
  border-radius: 50%;
  background: rgba(255,255,255,0.14);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.22);
  color: white;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}
@media (min-width: 768px) {
  .hero__arr { display: flex; }
}
.hero__arr:hover { background: rgba(255,255,255,0.26); }
.hero__arr--r { right: 16px; }
.hero__arr--l { left: 16px; }

/* ── Transition ─────────────────────────────────────── */
.hero-enter-active { transition: opacity 0.55s ease; }
.hero-leave-active { transition: opacity 0.35s ease; }
.hero-enter-from, .hero-leave-to { opacity: 0; }
</style>
