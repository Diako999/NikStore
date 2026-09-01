<template>
  <Transition name="adm-splash" @after-leave="onAfterLeave">
    <div v-if="!ready" class="adm-splash" data-testid="splash-root">

      <!-- Subtle dot-grid background — dashboard/data aesthetic -->
      <div class="adm-grid" aria-hidden="true" />

      <div class="adm-inner">

        <!-- ── Glasses SVG ── -->
        <div class="adm-icon" aria-hidden="true">
          <svg viewBox="-28 0 356 90" xmlns="http://www.w3.org/2000/svg" overflow="visible">
            <defs>
              <clipPath id="adm-clip-l">
                <rect x="6" y="9" width="113" height="72" rx="17"/>
              </clipPath>
              <clipPath id="adm-clip-r">
                <rect x="181" y="9" width="113" height="72" rx="17"/>
              </clipPath>
            </defs>

            <!-- Lens fills (appear after frames draw) -->
            <rect class="adm-fill"       x="6"   y="9" width="113" height="72" rx="17"/>
            <rect class="adm-fill adm-fill--r" x="181" y="9" width="113" height="72" rx="17"/>

            <!-- Radar pulse rings — clipped to lens shape -->
            <g clip-path="url(#adm-clip-l)">
              <circle class="adm-radar adm-radar-1"   cx="62"  cy="45" r="36"/>
              <circle class="adm-radar adm-radar-2"   cx="62"  cy="45" r="36"/>
            </g>
            <g clip-path="url(#adm-clip-r)">
              <circle class="adm-radar adm-radar-1 adm-radar--r" cx="237" cy="45" r="36"/>
              <circle class="adm-radar adm-radar-2 adm-radar--r" cx="237" cy="45" r="36"/>
            </g>

            <!-- Left temple -->
            <line class="adm-frame adm-temple-l"
                  x1="8" y1="36" x2="-24" y2="24" stroke-linecap="round"/>
            <!-- Left lens frame -->
            <rect class="adm-frame adm-lens-l"
                  x="6" y="9" width="113" height="72" rx="17"/>
            <!-- Bridge -->
            <path class="adm-frame adm-bridge"
                  d="M 119 45 Q 132 26 150 26 Q 168 26 181 45"
                  fill="none" stroke-linecap="round"/>
            <!-- Right lens frame -->
            <rect class="adm-frame adm-lens-r"
                  x="181" y="9" width="113" height="72" rx="17"/>
            <!-- Right temple -->
            <line class="adm-frame adm-temple-r"
                  x1="292" y1="36" x2="324" y2="24" stroke-linecap="round"/>
          </svg>
        </div>

        <!-- ── Brand ── only revealed once settings are loaded + min timer has elapsed -->
        <Transition name="adm-brand">
          <div v-if="brandVisible" class="adm-brand-wrap">
            <h1 class="adm-brand">{{ settingsStore.siteName }}</h1>
            <span class="adm-badge" data-testid="admin-badge">پنل مدیریت</span>
          </div>
        </Transition>

        <!-- ── Progress bar ── -->
        <div
          class="adm-progress-wrap"
          role="status"
          aria-label="در حال بارگذاری پنل مدیریت"
          data-testid="progress-bar"
        >
          <div class="adm-progress">
            <div class="adm-progress-fill" />
          </div>
        </div>

      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings.store'
import { logger } from '@/utils/logger'

const settingsStore = useSettingsStore()

const CTX = 'AdminSplash'

const props = defineProps({
  ready: { type: Boolean, default: false },
})

const emit = defineEmits(['hidden'])

// ── Brand reveal: only show the site name once BOTH conditions are met:
//   1. Minimum timer elapsed (keeps glasses mostly drawn before text appears)
//   2. Settings loaded (guarantees we show the real name, not the default)
const brandVisible = ref(false)
let _timerFired = false
let _settingsFired = false

function _checkBrand() {
  if (_timerFired && _settingsFired && !brandVisible.value) {
    brandVisible.value = true
    logger.debug('admin-splash: brand text revealed', { siteName: settingsStore.siteName }, CTX)
  }
}

watch(
  () => settingsStore.settings,
  (s) => { if (s) { _settingsFired = true; _checkBrand() } },
  { immediate: true },
)

watch(
  () => props.ready,
  (r) => {
    if (r) logger.info('admin-splash: auth ready — fading out splash', {}, CTX)
  },
)

function onAfterLeave() {
  logger.debug('admin-splash: leave transition complete — splash removed', {}, CTX)
  emit('hidden')
}

onMounted(() => {
  logger.debug('admin-splash: radar animation started', {}, CTX)
  // Same visual timing as original 1.05 s CSS delay but now waits for real site name
  setTimeout(() => { _timerFired = true; _checkBrand() }, 950)
})

defineExpose({ onAfterLeave })
</script>

<style scoped>
/* ── Root overlay ──────────────────────────────── */
.adm-splash {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #030711;
}

/* ── Dot-grid background ───────────────────────── */
.adm-grid {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(0, 212, 232, 0.12) 1px, transparent 1px);
  background-size: 32px 32px;
  pointer-events: none;
}

/* ── Inner container ───────────────────────────── */
.adm-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}

/* ── Glasses SVG wrapper ───────────────────────── */
.adm-icon {
  width: 260px;
  max-width: 75vw;
  filter: drop-shadow(0 0 18px rgba(0, 212, 232, 0.25));
}
.adm-icon svg { width: 100%; height: auto; }

/* ── Frame strokes ─────────────────────────────── */
.adm-frame {
  fill: none;
  stroke: #00D4E8;
  stroke-width: 3.2;
}

.adm-lens-l {
  stroke-dasharray: 342;
  stroke-dashoffset: 342;
  animation: adm-draw 0.9s cubic-bezier(0.4, 0, 0.2, 1) forwards 0.15s;
}
.adm-bridge {
  stroke-dasharray: 90;
  stroke-dashoffset: 90;
  animation: adm-draw 0.4s ease-out forwards 0.65s;
}
.adm-lens-r {
  stroke-dasharray: 342;
  stroke-dashoffset: 342;
  animation: adm-draw 0.9s cubic-bezier(0.4, 0, 0.2, 1) forwards 0.72s;
}
.adm-temple-l {
  stroke-dasharray: 38;
  stroke-dashoffset: 38;
  animation: adm-draw 0.25s ease-out forwards 0.05s;
}
.adm-temple-r {
  stroke-dasharray: 38;
  stroke-dashoffset: 38;
  animation: adm-draw 0.25s ease-out forwards 1.1s;
}

@keyframes adm-draw {
  to { stroke-dashoffset: 0; }
}

/* ── Lens fills ────────────────────────────────── */
.adm-fill {
  fill: rgba(0, 212, 232, 0.07);
  opacity: 0;
  animation: adm-fade 0.4s ease-out forwards 0.95s;
}
.adm-fill--r { animation-delay: 1.48s; }

@keyframes adm-fade {
  to { opacity: 1; }
}

/* ── Radar pulse rings ─────────────────────────── */
.adm-radar {
  fill: none;
  stroke: #00D4E8;
  stroke-width: 1.5;
  opacity: 0;
  transform-origin: 62px 45px;
  animation: adm-radar 1.5s ease-out infinite;
}
.adm-radar--r { transform-origin: 237px 45px; }

.adm-radar-1         { animation-delay: 1.15s; }
.adm-radar-2         { animation-delay: 1.75s; }
.adm-radar--r.adm-radar-1 { animation-delay: 1.35s; }
.adm-radar--r.adm-radar-2 { animation-delay: 1.95s; }

@keyframes adm-radar {
  0%   { transform: scale(0.04); opacity: 0.9; stroke-width: 2.5; }
  70%  { opacity: 0.4; stroke-width: 1; }
  100% { transform: scale(1.08); opacity: 0; stroke-width: 0; }
}

/* ── Brand ─────────────────────────────────────── */
.adm-brand-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.adm-brand {
  margin: 0;
  color: #ffffff;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}
.adm-badge {
  display: inline-block;
  padding: 0.2rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #00D4E8;
  border: 1px solid rgba(0, 212, 232, 0.45);
  background: rgba(0, 212, 232, 0.08);
}

/* Vue Transition: brand slides in once settings are ready */
.adm-brand-enter-active {
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}
.adm-brand-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

/* ── Progress bar ──────────────────────────────── */
.adm-progress-wrap {
  width: 200px;
  opacity: 0;
  animation: adm-fade 0.3s ease-out forwards 1.25s;
}
.adm-progress {
  height: 2px;
  border-radius: 9999px;
  background: rgba(0, 212, 232, 0.15);
  overflow: hidden;
}
.adm-progress-fill {
  height: 100%;
  border-radius: 9999px;
  background: linear-gradient(90deg, #00D4E8, #0EA5E9);
  width: 0%;
  animation: adm-progress 1.5s cubic-bezier(0.4, 0, 0.6, 1) forwards 1.25s;
  box-shadow: 0 0 8px rgba(0, 212, 232, 0.6);
}

@keyframes adm-progress {
  0%   { width: 0%; }
  25%  { width: 40%; }
  60%  { width: 72%; }
  85%  { width: 88%; }
  100% { width: 97%; }
}

/* ── Fade-out transition ───────────────────────── */
.adm-splash-leave-active {
  transition: opacity 0.45s ease, transform 0.45s ease;
}
.adm-splash-leave-to {
  opacity: 0;
  transform: scale(1.03);
}
</style>
