<template>
  <div v-if="visible" ref="root" class="splash">
    <div class="splash__stage">
      <p ref="sentenceEl" class="splash__sentence">
        <span ref="letterN" class="splash__letter">N</span><span ref="restNew" class="splash__rest">EW</span><span ref="dotA" class="splash__dot">&middot;</span><span ref="letterI" class="splash__letter">I</span><span ref="restIconic" class="splash__rest">CONIC</span><span ref="dotB" class="splash__dot">&middot;</span><span ref="letterK" class="splash__letter">K</span><span ref="restKnown" class="splash__rest">NOWN</span>
      </p>
    </div>

    <p ref="taglineEl" class="splash__tagline">NEW &middot; ICONIC &middot; KNOWN</p>

    <div ref="loadingEl" class="splash__loading">
      <span class="splash__loading-text">در حال بارگذاری پنل مدیریت...</span>
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

onMounted(async () => {
  if (!root.value) return
  const { gsap } = await import('gsap')
  gsapInstance = gsap

  const letters = [letterN.value, letterI.value, letterK.value]
  const collapsibles = [restNew.value, dotA.value, restIconic.value, dotB.value, restKnown.value]
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

    tl.addLabel('stretch-out')
    tl.to(sentenceEl.value, {
      autoAlpha: 1,
      scale: 1,
      duration: 0.65,
      ease: 'power2.out',
    }, 'stretch-out')
    tl.to(sentenceEl.value, {
      gap: '6px',
      duration: 0.75,
      ease: 'power2.out',
    }, 'stretch-out')

    tl.addLabel('hold', '+=0.35')

    // N · I · K (the first letters of NEW / ICONIC / KNOWN) highlight,
    // bolder and bigger, one word at a time
    tl.addLabel('highlight', '+=0.05')
    tl.to(letters, {
      scale: 1.4,
      color: '#FFFFFF',
      textShadow: '0 0 16px rgba(231,175,66,.85)',
      duration: 0.45,
      stagger: 0.14,
      ease: 'back.out(1.7)',
    }, 'highlight')

    tl.addLabel('hold2', '+=0.25')

    // everything else dissolves and collapses in place so N · I · K flow
    // together into NIK — never a hard clear or a separate element swap
    tl.addLabel('condense', '+=0.05')
    tl.to(collapsibles, {
      opacity: 0,
      width: 0,
      duration: 0.6,
      ease: 'power2.inOut',
    }, 'condense')
    tl.to(sentenceEl.value, {
      gap: '3px',
      duration: 0.6,
      ease: 'power2.inOut',
    }, 'condense')

    tl.addLabel('settled', '+=0.3')
    tl.to(taglineEl.value, { autoAlpha: 1, y: 0, duration: 0.45 }, 'settled')
    tl.to(loadingEl.value, { autoAlpha: 1, duration: 0.35 }, 'settled+=0.12')
    tl.fromTo(
      fillEl.value,
      { xPercent: -100 },
      { xPercent: 0, duration: 0.7, ease: 'power1.inOut' },
      'settled+=0.2',
    )
  }, root.value)
})

function startExit() {
  gsapInstance.to(root.value, {
    autoAlpha: 0,
    duration: 0.55,
    delay: 0.4,
    ease: 'power2.inOut',
    onComplete: () => {
      visible.value = false
      emit('done')
    },
  })
}

onUnmounted(() => {
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
  gap: 24px;
  background: radial-gradient(120% 90% at 50% 20%, #16241C 0%, #0E1712 55%, #090F0C 100%);
  padding: 24px;
}

.splash__stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 72px;
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
  font-size: clamp(14px, 2.6vw, 19px);
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
  font-size: 10.5px;
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
  font-size: 10.5px;
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
</style>
