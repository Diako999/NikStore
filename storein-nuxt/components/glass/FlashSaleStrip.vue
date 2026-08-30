<template>
  <div class="flash-strip">
    <div class="flash-strip__txt">
      <div class="flash-strip__t1">{{ title }}</div>
      <div class="flash-strip__t2">{{ subtitle }}</div>
    </div>
    <div class="flash-strip__timer">
      <span>{{ hh }}</span><span>:</span><span>{{ mm }}</span><span>:</span><span>{{ ss }}</span>
    </div>
  </div>
</template>

<script setup>
// Matches the mockups' `.flash` strip. Owns its own live countdown (derived
// from `endsAt`) so callers just pass a target time instead of managing an
// interval themselves.
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  title:    { type: String, default: '⚡ فروش ویژه امروز' },
  subtitle: { type: String, default: '' },
  // Date object or ISO string the countdown ends at.
  endsAt:   { type: [String, Date], required: true },
})

// Starts `null` (not Date.now()) so SSR output and the client's pre-mount
// render agree — "the current instant" is a different value on the server
// vs. the client, so computing it eagerly at setup time would always
// hydration-mismatch on the timer text. The real countdown only starts
// ticking in onMounted (client-only); until then the chips show a neutral
// placeholder that matches the server-rendered markup exactly.
const now = ref(null)
let timer = null

onMounted(() => {
  now.value = Date.now()
  timer = setInterval(() => { now.value = Date.now() }, 1000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const remainingMs = computed(() => {
  if (now.value === null) return null
  const end = new Date(props.endsAt).getTime()
  return Math.max(0, end - now.value)
})

function pad2(n) {
  return new Intl.NumberFormat('fa-IR', { minimumIntegerDigits: 2 }).format(n)
}

const placeholder = pad2(0)
const hh = computed(() => remainingMs.value === null ? placeholder : pad2(Math.floor(remainingMs.value / 3_600_000)))
const mm = computed(() => remainingMs.value === null ? placeholder : pad2(Math.floor((remainingMs.value % 3_600_000) / 60_000)))
const ss = computed(() => remainingMs.value === null ? placeholder : pad2(Math.floor((remainingMs.value % 60_000) / 1000)))
</script>

<style scoped>
.flash-strip {
  border-radius: 18px;
  padding: 16px 18px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1.5px solid transparent;
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  background:
    linear-gradient(120deg, rgba(61, 139, 82, .38), rgba(122, 90, 220, .20)) padding-box,
    linear-gradient(120deg, rgba(255, 255, 255, .4), rgba(255, 255, 255, .03) 60%) border-box;
}
[data-theme='light'] .flash-strip {
  background:
    linear-gradient(120deg, rgba(110, 176, 130, .50), rgba(122, 90, 220, .22)) padding-box,
    linear-gradient(120deg, rgba(255, 255, 255, 1), rgba(255, 255, 255, .2) 60%) border-box;
  box-shadow: var(--glass-shadow);
}

.flash-strip__t1 { font-size: 14px; font-weight: 700; margin-bottom: 3px; color: var(--text-primary); }
.flash-strip__t2 { font-size: 11px; color: var(--text-secondary); }

.flash-strip__timer { display: flex; gap: 5px; }
.flash-strip__timer span {
  background: rgba(9, 15, 12, .4);
  border: 1px solid var(--glass-border);
  border-radius: 7px;
  padding: 6px 7px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
}
[data-theme='light'] .flash-strip__timer span {
  background: rgba(255, 255, 255, .6);
  color: var(--text-primary);
}
</style>
