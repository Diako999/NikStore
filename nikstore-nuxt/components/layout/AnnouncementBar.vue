<template>
  <Transition name="bar-slide">
    <div
      v-if="!dismissed && bar.isActive && bar.text"
      class="announcement-bar relative w-full overflow-hidden flex items-center justify-center py-2.5 px-10 text-sm font-semibold"
    >
      <!-- Animated gradient base -->
      <div class="gradient-layer" aria-hidden="true" />

      <!-- Moving shimmer sweep -->
      <div class="shimmer-sweep" aria-hidden="true" />

      <!-- Floating sparkles -->
      <span class="sparkle s1" aria-hidden="true">✦</span>
      <span class="sparkle s2" aria-hidden="true">✦</span>
      <span class="sparkle s3" aria-hidden="true">✦</span>
      <span class="sparkle s4" aria-hidden="true">✦</span>

      <!-- Content -->
      <component
        :is="bar.link ? 'a' : 'span'"
        v-bind="bar.link ? { href: bar.link, target: '_blank', rel: 'noopener' } : {}"
        class="bar-text relative z-10"
        :class="{ 'hover:underline cursor-pointer': bar.link }"
      >{{ bar.text }}</component>

      <!-- Close -->
      <button
        @click="dismissed = true"
        class="absolute end-3 top-1/2 -translate-y-1/2 z-10 opacity-50 hover:opacity-100 hover:scale-110 transition-all duration-150"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { settingsService } from '~/services/settings.service'

const bar       = ref({ isActive: false, text: '', bgColor: '#3b82f6', textColor: '#ffffff', link: '' })
const dismissed = ref(false)

onMounted(async () => {
  try {
    const { data } = await settingsService.getSettings()
    if (data?.announcementBar) bar.value = data.announcementBar
  } catch { /* non-critical */ }
})

function hexToRgb(hex) {
  const h = (hex || '#3b82f6').replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

const bgGradient = computed(() => {
  const { r, g, b } = hexToRgb(bar.value.bgColor)
  const l = (v, amt) => Math.min(255, Math.max(0, v + amt))
  const lighter = `rgb(${l(r, 45)},${l(g, 30)},${l(b, 20)})`
  const darker  = `rgb(${l(r,-25)},${l(g,-15)},${l(b,-10)})`
  return `linear-gradient(135deg, ${darker} 0%, ${bar.value.bgColor} 35%, ${lighter} 65%, ${bar.value.bgColor} 82%, ${darker} 100%)`
})

const barTextColor  = computed(() => bar.value.textColor || '#ffffff')
const glowColor     = computed(() => {
  const { r, g, b } = hexToRgb(bar.value.textColor)
  return `rgba(${r},${g},${b},0.45)`
})
</script>

<style scoped>
/* ── Base ─────────────────────────────────────────────────── */
.announcement-bar {
  color: v-bind(barTextColor);
  min-height: 40px;
}

/* ── Animated gradient layer ──────────────────────────────── */
.gradient-layer {
  position: absolute;
  inset: 0;
  background: v-bind(bgGradient);
  background-size: 300% 300%;
  animation: gradient-flow 7s ease-in-out infinite;
}

@keyframes gradient-flow {
  0%   { background-position: 0%   50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0%   50%; }
}

/* ── Shimmer sweep ────────────────────────────────────────── */
.shimmer-sweep {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    108deg,
    transparent 35%,
    rgba(255,255,255,0.22) 50%,
    transparent 65%
  );
  background-size: 250% 100%;
  animation: shimmer 4s ease-in-out infinite;
  pointer-events: none;
  z-index: 1;
}

@keyframes shimmer {
  0%   { background-position: -100% 0; }
  60%  { background-position:  200% 0; }
  100% { background-position:  200% 0; }
}

/* ── Sparkle decorations ──────────────────────────────────── */
.sparkle {
  position: absolute;
  font-size: 9px;
  opacity: 0;
  animation: twinkle 5s ease-in-out infinite;
  z-index: 2;
  pointer-events: none;
  color: v-bind(barTextColor);
}

.s1 { left: 6%;   top: 50%; animation-delay: 0s;    animation-duration: 3.8s; }
.s2 { left: 18%;  top: 30%; animation-delay: 1.4s;  animation-duration: 4.5s; }
.s3 { right: 16%; top: 60%; animation-delay: 0.7s;  animation-duration: 4.1s; }
.s4 { right: 6%;  top: 35%; animation-delay: 2.1s;  animation-duration: 3.5s; }

@keyframes twinkle {
  0%, 100% { opacity: 0;    transform: scale(0.4) rotate(0deg);   }
  25%       { opacity: 0.8;  transform: scale(1.3) rotate(30deg);  }
  50%       { opacity: 0.45; transform: scale(0.9) rotate(-15deg); }
  75%       { opacity: 0.7;  transform: scale(1.1) rotate(45deg);  }
}

/* ── Text glow pulse ──────────────────────────────────────── */
.bar-text {
  display: inline-block;
  animation: text-glow 4s ease-in-out infinite;
  letter-spacing: 0.02em;
}

@keyframes text-glow {
  0%, 100% { text-shadow: 0 0 0px transparent; }
  50%       {
    text-shadow:
      0 0 8px  v-bind(glowColor),
      0 0 20px v-bind(glowColor);
  }
}

/* ── Slide-in transition ──────────────────────────────────── */
.bar-slide-enter-active {
  transition: max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease;
  overflow: hidden;
}
.bar-slide-leave-active {
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
  overflow: hidden;
}
.bar-slide-enter-from,
.bar-slide-leave-to  { max-height: 0;    opacity: 0; }
.bar-slide-enter-to,
.bar-slide-leave-from{ max-height: 56px; opacity: 1; }
</style>
