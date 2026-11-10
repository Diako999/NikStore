<template>
  <div v-if="visible" ref="root" class="splash" :class="{ 'splash--leaving': leaving }" @click="skip">
    <div class="splash__stage">
      <p ref="sentenceEl" class="splash__sentence">
        <span ref="letterN" class="splash__letter">N</span><span ref="restNew" class="splash__rest">EW</span><span ref="dotA" class="splash__dot">&middot;</span><span ref="letterI" class="splash__letter">I</span><span ref="restIconic" class="splash__rest">CONIC</span><span ref="dotB" class="splash__dot">&middot;</span><span ref="letterK" class="splash__letter">K</span><span ref="restKnown" class="splash__rest">NOWN</span>
      </p>
    </div>

    <p ref="taglineEl" class="splash__tagline">NEW &middot; ICONIC &middot; KNOWN</p>

    <button type="button" class="splash__skip" @click.stop="skip">رد کردن</button>

    <div ref="loadingEl" class="splash__loading">
      <span class="splash__loading-text">در حال بارگذاری...</span>
      <div class="splash__track">
        <div ref="fillEl" class="splash__fill" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const emit = defineEmits(['done'])

const visible = ref(true)
const leaving = ref(false)

const root = ref(null)
const sentenceEl = ref(null)
const letterN = ref(null)
const letterI = ref(null)
const letterK = ref(null)
const restNew = ref(null)
const restIconic = ref(null)
const restKnown = ref(null)
const dotA = ref(null)
const dotB = ref(null)
const taglineEl = ref(null)
const loadingEl = ref(null)
const fillEl = ref(null)

let ctx = null
let gsapInstance = null

// The splash is a brand moment, not a gate: it must never hold the page hostage.
//  - it only plays on the first visit of a session, when landing on the home page, and not
//    for people who asked for reduced motion (decided before paint by the inline script in
//    app.vue, which puts `no-splash` on <html>);
//  - a tap / Escape / the "رد کردن" button skips it;
//  - a hard timeout ends it even if animation frames are slow (GSAP slows its clock on
//    slow devices, which used to stretch ~5 s into 20 s+).
const FAILSAFE_MS = 6500
let failsafe = null
let finished = false

function finish() {
  if (finished) return
  finished = true
  clearTimeout(failsafe)
  visible.value = false
  emit('done')
}

function skip() {
  if (finished) return
  leaving.value = true
  ctx?.revert()
  if (gsapInstance && root.value) {
    gsapInstance.killTweensOf(root.value)
    gsapInstance.to(root.value, { autoAlpha: 0, duration: 0.25, onComplete: finish })
  } else {
    finish()
  }
}

function onKey(e) {
  if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip()
}

onMounted(async () => {
  if (document.documentElement.classList.contains('no-splash')) {
    finish()
    return
  }
  try { sessionStorage.setItem('nik-splash', '1') } catch { /* private mode */ }
  failsafe = setTimeout(skip, FAILSAFE_MS)
  window.addEventListener('keydown', onKey)

  if (!root.value) return
  const { gsap } = await import('gsap')
  gsapInstance = gsap

  const letters = [letterN.value, letterI.value, letterK.value]
  const collapsibles = [restNew.value, dotA.value, restIconic.value, dotB.value, restKnown.value]
  // Measure natural widths up front (while everything is still hidden via
  // opacity/visibility, which doesn't affect layout) so the later width->0
  // collapse animates from each span's real rendered size instead of
  // snapping from an un-tweenable "auto".
  const naturalWidths = collapsibles.map((el) => el.getBoundingClientRect().width)

  ctx = gsap.context(() => {
    gsap.set(sentenceEl.value, { autoAlpha: 0, scale: 0.92, gap: '2px' })
    collapsibles.forEach((el, i) => {
      gsap.set(el, { width: naturalWidths[i], display: 'inline-block', overflow: 'hidden' })
    })
    gsap.set(taglineEl.value, { autoAlpha: 0, y: 8 })
    gsap.set(loadingEl.value, { autoAlpha: 0 })

    const tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete: startExit,
    })

    // 01 — the whole sentence stretches out (fades in as the gap between
    // words widens), nothing hidden yet
    tl.addLabel('stretch-out')
    tl.to(sentenceEl.value, {
      autoAlpha: 1,
      scale: 1,
      duration: 0.7,
      ease: 'power2.out',
    }, 'stretch-out')
    tl.to(sentenceEl.value, {
      gap: '7px',
      duration: 0.8,
      ease: 'power2.out',
    }, 'stretch-out')

    tl.addLabel('hold', '+=0.4')

    // 02 — N · I · K (the first letters of NEW / ICONIC / KNOWN) highlight,
    // bolder and bigger, one word at a time — the mark is already latent in
    // the sentence, this just brings it forward
    tl.addLabel('highlight', '+=0.05')
    tl.to(letters, {
      scale: 1.45,
      color: '#FFFFFF',
      textShadow: '0 0 16px rgba(231,175,66,.85)',
      duration: 0.5,
      stagger: 0.16,
      ease: 'back.out(1.7)',
    }, 'highlight')

    tl.addLabel('hold2', '+=0.3')

    // 03 — everything else dissolves and collapses in place (never a hard
    // clear) so N · I · K flow together into NIK through the same
    // continuous motion, no separate element swapped in
    tl.addLabel('condense', '+=0.05')
    tl.to(collapsibles, {
      opacity: 0,
      width: 0,
      duration: 0.7,
      ease: 'power2.inOut',
    }, 'condense')
    tl.to(sentenceEl.value, {
      gap: '3px',
      duration: 0.7,
      ease: 'power2.inOut',
    }, 'condense')

    // 04 — settled
    tl.addLabel('settled', '+=0.35')
    tl.to(taglineEl.value, { autoAlpha: 1, y: 0, duration: 0.5 }, 'settled')
    tl.to(loadingEl.value, { autoAlpha: 1, duration: 0.4 }, 'settled+=0.15')
    tl.fromTo(
      fillEl.value,
      { xPercent: -100 },
      { xPercent: 0, duration: 0.9, ease: 'power1.inOut' },
      'settled+=0.25',
    )
  }, root.value)
})

function startExit() {
  leaving.value = true
  gsapInstance.to(root.value, {
    autoAlpha: 0,
    duration: 0.6,
    delay: 0.45,
    ease: 'power2.inOut',
    onComplete: finish,
  })
}

onUnmounted(() => {
  clearTimeout(failsafe)
  window.removeEventListener('keydown', onKey)
  ctx?.revert()
})
</script>

<style scoped>
.splash {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 26px;
  background: radial-gradient(120% 90% at 50% 20%, #16241C 0%, #0E1712 55%, #090F0C 100%);
  padding: 24px;
}

.splash__stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 84px;
  width: 100%;
  max-width: 480px;
  direction: ltr;
}

.splash__sentence {
  display: flex;
  align-items: baseline;
  justify-content: center;
  white-space: nowrap;
  font-family: 'Vazirmatn', Tahoma, sans-serif;
  font-size: clamp(15px, 4.2vw, 21px);
  font-weight: 700;
  color: rgba(231, 175, 66, .8);
  /* Baseline-hidden in plain CSS (not just via the JS gsap.set() call) so
     there's no flash of every splash element stacked on screen at once
     while the GSAP chunk is still being fetched/parsed before hydration. */
  opacity: 0;
  visibility: hidden;
}

.splash__letter {
  display: inline-block;
  font-weight: 800;
  color: rgba(231, 175, 66, .8);
  transform-origin: 50% 65%;
}

.splash__rest,
.splash__dot {
  display: inline-block;
}

.splash__tagline {
  direction: ltr;
  font-family: 'Vazirmatn', Tahoma, sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 4px;
  color: rgba(245, 247, 243, .65);
  opacity: 0;
  visibility: hidden;
}

.splash__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  opacity: 0;
  visibility: hidden;
}

.splash__loading-text {
  font-family: 'Vazirmatn', Tahoma, sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
  color: rgba(231, 175, 66, .85);
}

.splash__track {
  position: relative;
  width: 180px;
  height: 1.5px;
  overflow: hidden;
  background: rgba(231, 175, 66, .18);
}

.splash__fill {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, #E7C878, transparent);
}

.splash__skip {
  position: absolute;
  inset-block-end: max(20px, env(safe-area-inset-bottom));
  inset-inline-end: 18px;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 700;
  color: #C3D2C7;
  background: rgba(255, 255, 255, .10);
  border: 1px solid rgba(255, 255, 255, .22);
  cursor: pointer;
}
</style>

<style>
/* Set before first paint by the inline script in app.vue — no flash of splash. */
html.no-splash .splash { display: none !important; }
</style>
