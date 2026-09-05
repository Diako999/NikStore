<template>
  <div v-if="visible" ref="root" class="splash">
    <div class="splash__stage">
      <div ref="wordsEl" class="splash__words">
        <span ref="wordNew" class="splash__word">NEW</span>
        <span ref="barA" class="splash__bar" />
        <span ref="wordIconic" class="splash__word">ICONIC</span>
        <span ref="barB" class="splash__bar" />
        <span ref="wordKnown" class="splash__word">KNOWN</span>
      </div>

      <div ref="markEl" class="splash__mark">
        <span class="splash__mark-n">N</span>
        <span ref="markBar" class="splash__mark-bar" />
        <span class="splash__mark-k">K</span>
      </div>
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
const wordsEl = ref(null)
const wordNew = ref(null)
const wordIconic = ref(null)
const wordKnown = ref(null)
const barA = ref(null)
const barB = ref(null)
const markEl = ref(null)
const markBar = ref(null)
const taglineEl = ref(null)
const loadingEl = ref(null)
const fillEl = ref(null)

let ctx = null
let gsapInstance = null

onMounted(async () => {
  if (!root.value) return
  const { gsap } = await import('gsap')
  gsapInstance = gsap

  ctx = gsap.context(() => {
    gsap.set([wordNew.value, wordIconic.value, wordKnown.value], { autoAlpha: 0, y: 10 })
    gsap.set([barA.value, barB.value], { scaleY: 0, autoAlpha: 0 })
    gsap.set(markEl.value, { autoAlpha: 0 })
    gsap.set(markBar.value, { scaleY: 0 })
    gsap.set(taglineEl.value, { autoAlpha: 0, y: 8 })
    gsap.set(loadingEl.value, { autoAlpha: 0 })

    const tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete: startExit,
    })

    tl.addLabel('words')
    tl.to([wordNew.value, wordIconic.value, wordKnown.value], {
      autoAlpha: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.1,
    }, 'words')

    tl.addLabel('moving', '+=0.3')
    tl.to([barA.value, barB.value], { autoAlpha: 1, scaleY: 1, duration: 0.35 }, 'moving')
    tl.to(wordNew.value, { x: 26, duration: 0.5, ease: 'power3.inOut' }, 'moving')
    tl.to(wordKnown.value, { x: -26, duration: 0.5, ease: 'power3.inOut' }, 'moving')
    tl.to(wordIconic.value, { scale: 0.96, duration: 0.5, ease: 'power3.inOut' }, 'moving')

    tl.addLabel('merging', '+=0.12')
    tl.to(wordNew.value, { x: 0, duration: 0.45, ease: 'power3.inOut' }, 'merging')
    tl.to(wordKnown.value, { x: 0, duration: 0.45, ease: 'power3.inOut' }, 'merging')
    tl.to(wordIconic.value, { autoAlpha: 0.55, duration: 0.45 }, 'merging')
    tl.to([barA.value, barB.value], { scaleY: 2.6, duration: 0.45, ease: 'power3.inOut' }, 'merging')

    tl.addLabel('shaping', '+=0.15')
    tl.to([wordNew.value, wordIconic.value, wordKnown.value], { autoAlpha: 0, duration: 0.35 }, 'shaping')
    tl.to(barB.value, { autoAlpha: 0, duration: 0.25 }, 'shaping')
    tl.to(barA.value, { scaleY: 1, duration: 0.35 }, 'shaping')
    tl.set(markEl.value, { autoAlpha: 1 }, 'shaping+=0.12')
    tl.set(wordsEl.value, { display: 'none' }, 'shaping+=0.12')
    tl.fromTo(
      markEl.value.querySelectorAll('.splash__mark-n, .splash__mark-k'),
      { autoAlpha: 0, y: 6 },
      { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.07 },
      'shaping+=0.12',
    )
    tl.to(markBar.value, { scaleY: 1, duration: 0.4, ease: 'power3.out' }, 'shaping+=0.12')

    tl.addLabel('settled', '+=0.12')
    tl.fromTo(markEl.value, { scale: 0.94 }, { scale: 1, duration: 0.45, ease: 'back.out(1.6)' }, 'settled')
    tl.to(taglineEl.value, { autoAlpha: 1, y: 0, duration: 0.45 }, 'settled+=0.1')
    tl.to(loadingEl.value, { autoAlpha: 1, duration: 0.35 }, 'settled+=0.2')
    tl.fromTo(
      fillEl.value,
      { xPercent: -100 },
      { xPercent: 0, duration: 0.7, ease: 'power1.inOut' },
      'settled+=0.3',
    )
  }, root.value)
})

function startExit() {
  gsapInstance.to(root.value, {
    autoAlpha: 0,
    duration: 0.55,
    delay: 0.3,
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
  min-height: 60px;
  width: 100%;
  max-width: 480px;
  direction: ltr;
}

.splash__words {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  font-family: 'Vazirmatn', Tahoma, sans-serif;
}

.splash__word {
  font-size: clamp(13px, 2.4vw, 18px);
  font-weight: 700;
  letter-spacing: 2px;
  white-space: nowrap;
  background: linear-gradient(135deg, #FBEFC8 0%, #E7C878 55%, #C7A45C 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.splash__bar {
  width: 2px;
  height: 24px;
  transform-origin: center;
  background: linear-gradient(180deg, transparent, #E7C878, transparent);
}

.splash__mark {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.splash__mark-n,
.splash__mark-k {
  font-family: 'Vazirmatn', Tahoma, sans-serif;
  font-size: clamp(42px, 7vw, 72px);
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(135deg, #FBEFC8 0%, #E7C878 50%, #C7A45C 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.splash__mark-bar {
  width: 3px;
  height: 58px;
  margin: 0 4px;
  transform-origin: center;
  background: linear-gradient(180deg, #FBEFC8, #E7C878 60%, #C7A45C);
  box-shadow: 0 0 14px rgba(231, 175, 66, .5);
}

.splash__tagline {
  direction: ltr;
  font-family: 'Vazirmatn', Tahoma, sans-serif;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 4px;
  color: rgba(245, 247, 243, .65);
}

.splash__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
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
