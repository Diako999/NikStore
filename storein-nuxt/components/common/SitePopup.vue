<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div
        v-if="visible && popup"
        class="fixed inset-0 z-[900] flex items-end sm:items-center justify-center p-0 sm:p-4"
        style="background: rgba(0,0,0,0.65); backdrop-filter: blur(10px);"
        @click.self="close"
      >
        <Transition name="card" appear>
          <div v-if="visible && popup" class="popup-card relative w-full sm:w-[320px] overflow-hidden">

            <!-- ── Close ── -->
            <button
              @click="close"
              class="close-btn absolute top-3 left-3 z-20 w-7 h-7 rounded-full flex items-center justify-center"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            <!-- ── Image ── -->
            <div v-if="popup.imageUrl" class="relative overflow-hidden" style="height:200px">
              <img
                :src="popup.imageUrl"
                :alt="popup.title"
                class="w-full h-full object-cover img-scale"
                @error="e => e.target.closest('div').remove()"
              />
              <div class="img-overlay absolute inset-0"/>
            </div>

            <!-- ── Body ── -->
            <div class="px-5 pt-4 pb-5 space-y-3">

              <!-- Tag -->
              <div v-if="popup.title" class="flex items-center gap-2">
                <span class="tag-dot"/>
                <span class="tag-label">پیشنهاد ویژه</span>
              </div>

              <!-- Title + desc -->
              <div>
                <h3 v-if="popup.title" class="popup-title">{{ popup.title }}</h3>
                <p v-if="popup.description" class="popup-desc mt-1">{{ popup.description }}</p>
              </div>

              <!-- CTA -->
              <NuxtLink
                v-if="popup.buttonText && popup.buttonLink"
                :to="popup.buttonLink"
                @click="close"
                class="cta-btn flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold"
              >
                {{ popup.buttonText }}
                <svg class="w-3.5 h-3.5 arrow" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
                </svg>
              </NuxtLink>

              <!-- Dismiss -->
              <button @click="close" class="dismiss-btn w-full text-center">
                نه ممنون، بستن
              </button>

            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { popupService } from '~/services/popup.service'

const popup   = ref(null)
const visible = ref(false)

const STORAGE_PREFIX = 'storein_popup_'
function getStorageKey(id)  { return `${STORAGE_PREFIX}${id}` }

function hasBeenSeen(id, per) {
  if (per === 'always') return false
  const raw = localStorage.getItem(getStorageKey(id))
  if (!raw) return false
  try { const { until } = JSON.parse(raw); return Date.now() < until }
  catch { return false }
}
function markSeen(id, per) {
  if (per === 'always') return
  if (per === 'session') { sessionStorage.setItem(getStorageKey(id), '1'); return }
  const ms = { day: 86400000, week: 604800000 }[per] ?? 86400000
  localStorage.setItem(getStorageKey(id), JSON.stringify({ until: Date.now() + ms }))
}
function hasBeenSeenSession(id) { return !!sessionStorage.getItem(getStorageKey(id)) }

function close() {
  visible.value = false
  if (popup.value) markSeen(popup.value._id, popup.value.showOncePer)
}

onMounted(async () => {
  try {
    const { data } = await popupService.getActive()
    if (!data) return
    popup.value = data
    const id  = data._id
    const per = data.showOncePer ?? 'day'
    if (per === 'session' && hasBeenSeenSession(id)) return
    if (per !== 'session' && hasBeenSeen(id, per))  return
    const delay = Math.max(0, (data.showDelay ?? 2) * 1000)
    setTimeout(() => { visible.value = true }, delay)
  } catch { /* non-critical */ }
})
</script>

<style scoped>
/* ── Card ───────────────────────────────────────────── */
.popup-card {
  background: var(--glass-strong);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04);
}
@media (min-width: 640px) {
  .popup-card {
    border-radius: 20px;
    box-shadow: 0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06);
  }
}

/* ── Image overlay ──────────────────────────────────── */
.img-overlay {
  background: linear-gradient(
    to bottom,
    transparent 40%,
    rgba(15,15,24,0.5) 70%,
    rgba(15,15,24,1) 100%
  );
}
.img-scale {
  transition: transform 6s ease;
  transform: scale(1.04);
  animation: img-zoom 6s ease forwards;
}
@keyframes img-zoom {
  to { transform: scale(1); }
}

/* ── Tag ────────────────────────────────────────────── */
.tag-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #a78bfa;
  box-shadow: 0 0 6px #a78bfa;
  animation: dot-pulse 2s ease-in-out infinite;
}
@keyframes dot-pulse {
  0%,100% { opacity: 1; }
  50%      { opacity: 0.4; }
}
.tag-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #a78bfa;
  opacity: 0.85;
}

/* ── Typography ─────────────────────────────────────── */
.popup-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.35;
  letter-spacing: -0.01em;
}
.popup-desc {
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary);
}

/* ── CTA Button ─────────────────────────────────────── */
.cta-btn {
  background: linear-gradient(130deg, #6d28d9 0%, #9333ea 55%, #c026d3 100%);
  color: #fff;
  box-shadow: 0 4px 20px rgba(109,40,217,0.4), inset 0 1px 0 rgba(255,255,255,0.12);
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.cta-btn:hover {
  opacity: 0.92;
  transform: translateY(-1px);
}
.cta-btn:active {
  transform: translateY(0);
  opacity: 1;
}
.arrow {
  transition: transform 0.2s ease;
}
.cta-btn:hover .arrow { transform: translateX(-3px); }

/* ── Dismiss ────────────────────────────────────────── */
.dismiss-btn {
  font-size: 11px;
  color: var(--text-disabled);
  transition: color 0.15s ease;
  padding-bottom: 2px;
}
.dismiss-btn:hover { color: var(--text-secondary); }

/* ── Close button ───────────────────────────────────── */
.close-btn {
  background: var(--glass);
  border: 1px solid var(--glass-border);
  color: var(--text-secondary);
  transition: background 0.15s ease, color 0.15s ease, transform 0.2s ease;
  backdrop-filter: blur(4px);
}
.close-btn:hover {
  background: var(--glass-strong);
  color: var(--text-primary);
  transform: rotate(90deg);
}

/* ── Backdrop ───────────────────────────────────────── */
.backdrop-enter-active { transition: opacity 0.3s ease; }
.backdrop-leave-active { transition: opacity 0.2s ease; }
.backdrop-enter-from,
.backdrop-leave-to     { opacity: 0; }

/* ── Card animation ─────────────────────────────────── */
.card-enter-active {
  transition: opacity 0.35s ease, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}
.card-leave-active {
  transition: opacity 0.2s ease, transform 0.18s ease;
}
.card-enter-from {
  opacity: 0;
  transform: translateY(40px) scale(0.96);
}
.card-leave-to {
  opacity: 0;
  transform: scale(0.97) translateY(8px);
}
@media (min-width: 640px) {
  .card-enter-from { transform: scale(0.92) translateY(16px); }
  .card-leave-to   { transform: scale(0.96); }
}
</style>
