<template>
  <Transition name="splash" @after-leave="onAfterLeave">
    <div v-if="!ready" class="splash" data-testid="splash-root">

      <!-- floating particles -->
      <div class="particles" aria-hidden="true">
        <span v-for="i in 18" :key="i" class="particle" :style="particleStyle(i)" />
      </div>

      <!-- lens flare on exit -->
      <div class="flare" aria-hidden="true" />

      <div class="splash__inner">

        <!-- glasses -->
        <div class="splash__icon" aria-hidden="true">
          <svg viewBox="-28 0 356 90" xmlns="http://www.w3.org/2000/svg" overflow="visible">
            <defs>
              <linearGradient id="lens-grad-l" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stop-color="#4a9eff" stop-opacity="0.18"/>
                <stop offset="100%" stop-color="#a855f7" stop-opacity="0.22"/>
              </linearGradient>
              <linearGradient id="lens-grad-r" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%"   stop-color="#06b6d4" stop-opacity="0.18"/>
                <stop offset="100%" stop-color="#4a9eff" stop-opacity="0.22"/>
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <clipPath id="sp-clip-l"><rect x="6"   y="9" width="113" height="72" rx="17"/></clipPath>
              <clipPath id="sp-clip-r"><rect x="181" y="9" width="113" height="72" rx="17"/></clipPath>
            </defs>

            <!-- lens fills -->
            <rect class="sp-fill"      x="6"   y="9" width="113" height="72" rx="17" fill="url(#lens-grad-l)"/>
            <rect class="sp-fill sp-fill--r" x="181" y="9" width="113" height="72" rx="17" fill="url(#lens-grad-r)"/>

            <!-- scan beam -->
            <rect class="sp-scan" x="6" y="9" width="40" height="72" clip-path="url(#sp-clip-l)"/>
            <rect class="sp-scan sp-scan--r" x="181" y="9" width="40" height="72" clip-path="url(#sp-clip-r)"/>

            <!-- shine -->
            <ellipse class="sp-shine"     cx="36"  cy="30" rx="22" ry="9" clip-path="url(#sp-clip-l)"/>
            <ellipse class="sp-shine sp-shine--r" cx="211" cy="30" rx="22" ry="9" clip-path="url(#sp-clip-r)"/>

            <!-- frames with glow -->
            <g filter="url(#glow)">
              <line   class="sp-frame sp-temple-l" x1="8"   y1="36" x2="-24"  y2="24" stroke-linecap="round"/>
              <rect   class="sp-frame sp-lens-l"   x="6"   y="9"   width="113" height="72" rx="17"/>
              <path   class="sp-frame sp-bridge"   d="M 119 45 Q 132 26 150 26 Q 168 26 181 45" fill="none" stroke-linecap="round"/>
              <rect   class="sp-frame sp-lens-r"   x="181" y="9"   width="113" height="72" rx="17"/>
              <line   class="sp-frame sp-temple-r" x1="292" y1="36" x2="324"  y2="24" stroke-linecap="round"/>
            </g>
          </svg>
        </div>

        <!-- brand — blurs in to focus -->
        <Transition name="sp-brand">
          <div v-if="brandVisible" class="splash__brand-wrap">
            <h1 class="splash__brand">
              <span v-for="(ch, i) in brandChars" :key="i"
                    class="sp-char" :style="{ animationDelay: `${i * 60}ms` }">{{ ch }}</span>
            </h1>
            <p class="splash__tagline">{{ settingsStore.tagline }}</p>
          </div>
        </Transition>

        <!-- progress bar -->
        <div class="splash__progress" role="status" aria-label="در حال بارگذاری">
          <div class="splash__progress-fill" />
        </div>

      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useSettingsStore } from '~/stores/settings.store'
import { logger } from '~/utils/logger'

const settingsStore = useSettingsStore()
const CTX = 'AppSplash'

const props = defineProps({ ready: { type: Boolean, default: false } })
const emit  = defineEmits(['hidden'])

const brandVisible = ref(false)
let _timerFired    = false
let _settingsFired = false

const brandChars = computed(() => (settingsStore.siteName || 'نیک').split(''))

function _checkBrand() {
  if (_timerFired && _settingsFired && !brandVisible.value) {
    brandVisible.value = true
  }
}

watch(() => settingsStore.settings, (s) => { if (s) { _settingsFired = true; _checkBrand() } }, { immediate: true })
watch(() => props.ready, (r) => { if (r) logger.info('splash: fading out', {}, CTX) })

function onAfterLeave() {
  logger.debug('splash: removed from DOM', {}, CTX)
  emit('hidden')
}

function particleStyle(i) {
  const size   = 2 + (i % 4)
  const x      = (i * 37 + 11) % 95
  const y      = (i * 53 + 7)  % 90
  const dur    = 3 + (i % 5)
  const delay  = (i * 0.3) % 3
  const op     = 0.15 + (i % 5) * 0.06
  return {
    width:            `${size}px`,
    height:           `${size}px`,
    left:             `${x}%`,
    top:              `${y}%`,
    opacity:          op,
    animationDuration:`${dur}s`,
    animationDelay:   `${delay}s`,
  }
}

onMounted(() => {
  logger.debug('splash: started', {}, CTX)
  setTimeout(() => { _timerFired = true; _checkBrand() }, 950)
})

defineExpose({ onAfterLeave })
</script>

<style scoped>
/* ── Root ── */
.splash {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #080d1a;
  overflow: hidden;
}

/* ── Particles ── */
.particles { position: absolute; inset: 0; pointer-events: none; }
.particle {
  position: absolute;
  border-radius: 50%;
  background: #4a9eff;
  animation: float linear infinite;
}
@keyframes float {
  0%   { transform: translateY(0)   scale(1); }
  50%  { transform: translateY(-18px) scale(1.3); }
  100% { transform: translateY(0)   scale(1); }
}

/* ── Lens flare (fires on exit) ── */
.flare {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 42%, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 100%);
  pointer-events: none;
  transition: background 0.1s;
}
.splash-leave-active .flare {
  animation: flare-burst 0.55s ease-out forwards;
}
@keyframes flare-burst {
  0%   { background: radial-gradient(circle at 50% 42%, rgba(255,255,255,0)   0%, rgba(255,255,255,0) 100%); }
  30%  { background: radial-gradient(circle at 50% 42%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 55%); }
  100% { background: radial-gradient(circle at 50% 42%, rgba(255,255,255,0)   0%, rgba(255,255,255,0) 100%); }
}

/* ── Inner ── */
.splash__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  position: relative;
  z-index: 1;
}

/* ── Glasses ── */
.splash__icon { width: 240px; max-width: 72vw; }
.splash__icon svg { width: 100%; height: auto; }

/* frames */
.sp-frame {
  fill: none;
  stroke: url(#stroke-grad);
  stroke: #4a9eff;
  stroke-width: 3.8;
}
.sp-lens-l {
  stroke-dasharray: 342; stroke-dashoffset: 342;
  animation: sp-draw 0.9s cubic-bezier(0.4,0,0.2,1) forwards 0.15s;
  stroke: #4a9eff;
}
.sp-bridge {
  stroke-dasharray: 90; stroke-dashoffset: 90;
  animation: sp-draw 0.4s ease-out forwards 0.65s;
  stroke: #7dd3fc;
}
.sp-lens-r {
  stroke-dasharray: 342; stroke-dashoffset: 342;
  animation: sp-draw 0.9s cubic-bezier(0.4,0,0.2,1) forwards 0.72s;
  stroke: #a78bfa;
}
.sp-temple-l {
  stroke-dasharray: 38; stroke-dashoffset: 38;
  animation: sp-draw 0.25s ease-out forwards 0.05s;
  stroke: #60a5fa;
}
.sp-temple-r {
  stroke-dasharray: 38; stroke-dashoffset: 38;
  animation: sp-draw 0.25s ease-out forwards 1.1s;
  stroke: #c084fc;
}
@keyframes sp-draw { to { stroke-dashoffset: 0; } }

/* fills */
.sp-fill {
  opacity: 0;
  animation: sp-fade 0.5s ease-out forwards 1s;
}
.sp-fill--r { animation-delay: 1.15s; }
@keyframes sp-fade { to { opacity: 1; } }

/* scan beam */
.sp-scan {
  fill: rgba(255,255,255,0.12);
  opacity: 0;
  animation: sp-scan-move 0.6s ease-in-out forwards 1.05s;
}
.sp-scan--r { animation-delay: 1.2s; }
@keyframes sp-scan-move {
  0%   { opacity: 0;    transform: translateX(0); }
  20%  { opacity: 1; }
  80%  { opacity: 0.6; }
  100% { opacity: 0;    transform: translateX(80px); }
}

/* shine */
.sp-shine {
  fill: rgba(255,255,255,0.26);
  opacity: 0;
  animation: sp-shine 3s ease-in-out infinite 1.5s;
}
.sp-shine--r { animation-delay: 2s; }
@keyframes sp-shine {
  0%   { opacity: 0;    transform: translate(-10px,-4px) rotate(-10deg); }
  25%  { opacity: 0.85; }
  60%  { opacity: 0.2;  transform: translate(10px, 4px) rotate(-10deg); }
  100% { opacity: 0;    transform: translate(-10px,-4px) rotate(-10deg); }
}

/* ── Brand — blur-to-focus reveal ── */
.splash__brand-wrap {
  display: flex; flex-direction: column; align-items: center; gap: 0.45rem;
  text-align: center;
}
.splash__brand {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #34d399 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 12px rgba(74,158,255,0.4));
}
.splash__tagline {
  margin: 0;
  color: rgba(255,255,255,0.4);
  font-size: 0.85rem;
}

/* char-by-char blur reveal */
.sp-char {
  display: inline-block;
  opacity: 0;
  filter: blur(8px);
  animation: sp-focus 0.4s ease-out forwards;
}
@keyframes sp-focus {
  to { opacity: 1; filter: blur(0); }
}

/* brand transition */
.sp-brand-enter-active { transition: opacity 0.3s ease; }
.sp-brand-enter-from   { opacity: 0; }

/* ── Progress bar ── */
.splash__progress {
  width: 120px;
  height: 2px;
  background: rgba(255,255,255,0.08);
  border-radius: 99px;
  overflow: hidden;
}
.splash__progress-fill {
  height: 100%;
  width: 0%;
  border-radius: 99px;
  background: linear-gradient(90deg, #4a9eff, #a78bfa, #34d399);
  animation: sp-progress 1.5s cubic-bezier(0.4,0,0.2,1) forwards 0.2s;
}
@keyframes sp-progress { to { width: 100%; } }

/* ── Exit ── */
.splash-leave-active {
  transition: opacity 0.55s ease, transform 0.55s ease;
}
.splash-leave-to {
  opacity: 0;
  transform: scale(1.05);
}
</style>
