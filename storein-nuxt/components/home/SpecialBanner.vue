<template>
  <section v-if="displayed.length" class="sb-wrap">
    <div class="sb-grid">
      <NuxtLink
        v-for="banner in displayed"
        :key="banner._id || banner.id"
        :to="banner.ctaLink || '/'"
        class="sb-card"
        :style="cardStyle(banner)"
      >
        <!-- Image -->
        <div v-if="banner.imageUrl"
             class="sb-card__img"
             :style="{ backgroundImage: `url(${banner.imageUrl})` }" />

        <!-- Gradient overlay -->
        <div class="sb-card__overlay" />

        <!-- Mesh texture -->
        <div class="sb-card__mesh" aria-hidden="true" />

        <!-- Decorative SVG (no image) -->
        <div v-if="!banner.imageUrl && banner.badgeType !== 'none'"
             class="sb-card__deco" aria-hidden="true">
          <svg v-if="banner.badgeType === 'sale'" width="220" height="110"
               viewBox="0 0 180 90" fill="none" stroke="white" stroke-width="5"
               stroke-linecap="round" stroke-linejoin="round">
            <circle cx="55" cy="32" r="15"/>
            <circle cx="125" cy="58" r="15"/>
            <path d="M150 18 L30 72"/>
          </svg>
          <svg v-else-if="banner.badgeType === 'new'" width="220" height="110"
               viewBox="0 0 180 90" fill="none" stroke="white" stroke-width="5"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M48 20 Q54 42 76 46 Q54 50 48 72 Q42 50 20 46 Q42 42 48 20 Z"/>
            <path d="M132 34 Q136 48 150 50 Q136 52 132 66 Q128 52 114 50 Q128 48 132 34 Z"/>
          </svg>
          <svg v-else width="120" height="120" viewBox="0 0 280 280"
               fill="none" stroke="white" stroke-width="8" stroke-linecap="round">
            <path d="M140 30 L140 250"/>
            <path d="M40 80 L240 200"/>
            <path d="M240 80 L40 200"/>
          </svg>
        </div>

        <!-- Text content -->
        <div class="sb-card__body">
          <p class="sb-card__eyebrow">{{ banner.eyebrow }}</p>
          <h3 class="sb-card__title">{{ banner.title }}</h3>
          <span class="sb-card__cta">
            {{ banner.cta || 'مشاهده محصولات' }}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                 stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5 rtl:rotate-180">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
            </svg>
          </span>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { bannerService } from '~/services/banner.service'

const displayed = ref([])

function cardStyle(banner) {
  if (banner.imageUrl) return {}
  return { background: `linear-gradient(135deg, ${banner.bgFrom} 0%, ${banner.bgTo} 100%)` }
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

/* ── Card ──────────────────────────────────────────── */
.sb-card {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  min-height: 190px;
  display: flex;
  align-items: flex-end;
  padding: 1.5rem 1.625rem;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.28s cubic-bezier(0.34, 1.2, 0.64, 1), box-shadow 0.28s ease;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
}

@media (min-width: 768px) {
  .sb-card { min-height: 210px; }
}

.sb-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.28);
}

/* Background image */
.sb-card__img {
  position: absolute;
  inset: -3%;
  background-size: cover;
  background-position: center;
  transition: transform 0.5s ease;
}
.sb-card:hover .sb-card__img { transform: scale(1.04); }

/* Overlay — gradient from bottom */
.sb-card__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 55%, transparent 100%);
}

/* Mesh texture */
.sb-card__mesh {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}

/* Decorative SVG */
.sb-card__deco {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.1;
  pointer-events: none;
  transition: opacity 0.28s ease;
}
.sb-card:hover .sb-card__deco { opacity: 0.16; }

/* ── Body ──────────────────────────────────────────── */
.sb-card__body {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.sb-card__eyebrow {
  font-size: 0.72rem;
  color: rgba(255,255,255,0.6);
  letter-spacing: 0.04em;
  margin: 0;
}

.sb-card__title {
  font-size: 1.625rem;
  font-weight: 900;
  color: #ffffff;
  line-height: 1.25;
  margin: 0;
  text-shadow: 0 2px 12px rgba(0,0,0,0.3);
}

.sb-card__cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(255,255,255,0.7);
  margin-top: 0.375rem;
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.18);
  padding: 6px 14px;
  border-radius: 99px;
  transition: background 0.2s ease, color 0.2s ease;
  width: fit-content;
}
.sb-card:hover .sb-card__cta {
  background: rgba(255,255,255,0.22);
  color: rgba(255,255,255,0.95);
}
</style>
