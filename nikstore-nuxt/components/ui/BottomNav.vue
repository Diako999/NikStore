<template>
  <nav ref="navEl" class="bottomnav">
    <NuxtLink
      v-for="(tab, i) in tabs"
      :key="tab.to"
      :to="tab.to"
      class="nav-item"
      :class="{ 'nav-item--active': isActive(tab) }"
    >
      <span v-if="tab.badge" class="nav-item__cbadge">{{ toPersianDigits(tab.badge) }}</span>

      <span ref="wrapEls" class="nav-item__icon-wrap">
        <span class="nav-item__icon nav-item__icon--base">
          <AppIcon :name="tab.icon" :size="20" :stroke-width="2" />
        </span>
        <span ref="liquidEls" class="nav-item__icon nav-item__icon--liquid">
          <AppIcon :name="tab.icon" :size="20" :stroke-width="2" />
          <span class="nav-item__meniscus" />
        </span>
      </span>

      <span>{{ tab.label }}</span>
    </NuxtLink>
  </nav>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '~/components/icons/AppIcon.vue'
import { toPersianDigits } from '~/utils/format'

const props = defineProps({
  cartCount: { type: Number, default: 0 },
})

const route = useRoute()

const tabs = computed(() => [
  { label: 'خانه', to: '/', icon: 'home' },
  { label: 'دسته‌بندی', to: '/category', icon: 'grid' },
  { label: 'سبد خرید', to: '/cart', icon: 'bag', badge: props.cartCount },
  { label: 'علاقه‌مندی', to: '/user/favorites', icon: 'heart' },
  { label: 'حساب من', to: '/user', icon: 'person' },
])

function isActive(tab) {
  if (tab.to === '/') return route.path === '/'
  return route.path.startsWith(tab.to)
}

const activeIndex = computed(() => {
  const idx = tabs.value.findIndex(isActive)
  return idx === -1 ? 0 : idx
})

const navEl = ref(null)
const wrapEls = ref([])
const liquidEls = ref([])

let gsapInstance = null
let previousIndex = null

function setFillImmediate(el, fillPercent) {
  el.style.setProperty('--fill', `${fillPercent}%`)
  const wave = Math.sin(((100 - fillPercent) / 100) * Math.PI)
  el.style.setProperty('--meniscus-opacity', wave.toFixed(3))
}

async function drainAndFill(nextIndex, animate) {
  await nextTick()
  const nextLiquid = liquidEls.value[nextIndex]
  if (!nextLiquid) return

  if (!animate || !gsapInstance) {
    tabs.value.forEach((_, i) => {
      const el = liquidEls.value[i]
      if (el) setFillImmediate(el, i === nextIndex ? 0 : 100)
    })
    previousIndex = nextIndex
    return
  }

  const gsap = gsapInstance
  const prevLiquid = previousIndex !== null ? liquidEls.value[previousIndex] : null
  const prevWrap = previousIndex !== null ? wrapEls.value[previousIndex] : null
  const nextWrap = wrapEls.value[nextIndex]

  const fillState = { fill: 100 }
  if (prevLiquid) {
    const drainState = { fill: 0 }
    gsap.to(drainState, {
      fill: 100,
      duration: 0.4,
      ease: 'power2.in',
      onUpdate: () => setFillImmediate(prevLiquid, drainState.fill),
    })
    gsap.to(prevWrap, { scaleY: 0.92, scaleX: 1.05, duration: 0.18, ease: 'power1.out' })
    gsap.to(prevWrap, { scaleY: 1, scaleX: 1, duration: 0.3, delay: 0.18, ease: 'power2.out' })
  }

  gsap.to(fillState, {
    fill: 0,
    duration: 0.46,
    ease: 'power2.out',
    onUpdate: () => setFillImmediate(nextLiquid, fillState.fill),
    onComplete: () => {
      gsap.fromTo(
        nextWrap,
        { scaleY: 1.22, scaleX: 0.88 },
        { scaleY: 1, scaleX: 1, duration: 0.5, ease: 'elastic.out(1, 0.55)' },
      )
    },
  })

  previousIndex = nextIndex
}

onMounted(async () => {
  const { gsap } = await import('gsap')
  gsapInstance = gsap
  await drainAndFill(activeIndex.value, false)
})

watch(activeIndex, (index) => {
  if (previousIndex === null) return
  drainAndFill(index, true)
})
</script>

<style scoped>
.bottomnav {
  position: fixed;
  bottom: 0;
  inset-inline: 0;
  z-index: 50;
  border-top: 1px solid var(--glass-border);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 10px 8px 14px;
  background: rgba(9, 15, 12, .55);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
}
[data-theme='light'] .bottomnav {
  background: rgba(255, 255, 255, .62);
  backdrop-filter: blur(22px) saturate(160%);
  -webkit-backdrop-filter: blur(22px) saturate(160%);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  position: relative;
  color: var(--text-disabled);
}
.nav-item span:last-child { font-size: 9.5px; font-weight: 600; transition: color .3s ease; }
.nav-item--active span:last-child { color: var(--brand-light); }
[data-theme='light'] .nav-item--active span:last-child { color: var(--brand-dark); }

.nav-item__icon-wrap {
  position: relative;
  width: 20px;
  height: 20px;
  transform-origin: bottom center;
}
.nav-item__icon {
  position: absolute;
  inset: 0;
  display: flex;
}
.nav-item__icon--base { color: var(--text-disabled); }

.nav-item__icon--liquid {
  --fill: 100%;
  color: #6EB082;
  clip-path: inset(var(--fill) -4px -4px -4px);
  filter: drop-shadow(0 0 3px rgba(110, 176, 130, .6));
}
[data-theme='light'] .nav-item__icon--liquid {
  color: #2D6B3E;
  filter: drop-shadow(0 0 3px rgba(45, 107, 62, .45));
}

.nav-item__meniscus {
  position: absolute;
  inset-inline: -4px;
  top: var(--fill);
  height: 2px;
  transform: translateY(-1px);
  border-radius: 1px;
  background: linear-gradient(90deg, transparent, #E7C878, #FBEFC8, #E7C878, transparent);
  opacity: var(--meniscus-opacity, 0);
}

.nav-item__cbadge {
  position: absolute;
  top: -4px;
  inset-inline-start: -8px;
  background: var(--brand);
  color: #fff;
  font-size: 8.5px;
  font-weight: 800;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
