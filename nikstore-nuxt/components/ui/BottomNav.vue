<template>
  <nav ref="navEl" class="bottomnav">
    <div ref="blobEl" class="nav-blob" aria-hidden="true" />
    <NuxtLink
      v-for="(tab, i) in tabs"
      :key="tab.to"
      :ref="(el) => setItemRef(el, i)"
      :to="tab.to"
      class="nav-item"
      :class="{ 'nav-item--active': isActive(tab) }"
    >
      <span v-if="tab.badge" class="nav-item__cbadge">{{ toPersianDigits(tab.badge) }}</span>
      <AppIcon :name="tab.icon" :size="21" :stroke-width="2" />
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
const blobEl = ref(null)
const itemEls = []
function setItemRef(el, i) {
  if (el) itemEls[i] = el.$el ?? el
}

let gsapInstance = null
let hasPositioned = false

async function moveBlobTo(index, animate) {
  await nextTick()
  const nav = navEl.value
  const target = itemEls[index]
  const blob = blobEl.value
  if (!nav || !target || !blob) return

  // getBoundingClientRect is always in real viewport (LTR) space even on an
  // RTL page, so plain left-based math here is direction-correct without
  // any RTL-specific handling.
  const navRect = nav.getBoundingClientRect()
  const itemRect = target.getBoundingClientRect()
  const size = 46
  const centerX = itemRect.left - navRect.left + itemRect.width / 2
  const left = centerX - size / 2

  if (!animate || !gsapInstance) {
    if (gsapInstance) gsapInstance.set(blob, { left, width: size, opacity: 1 })
    else blob.style.left = `${left}px`
    hasPositioned = true
    return
  }

  const fromLeft = gsapInstance.getProperty(blob, 'left')
  const fromCenter = fromLeft + size / 2
  const travel = centerX - fromCenter
  const stretch = Math.min(Math.abs(travel) * 0.6, 34)
  const midLeft = travel > 0 ? fromLeft : fromLeft - stretch

  const tl = gsapInstance.timeline()
  tl.to(blob, {
    left: midLeft,
    width: size + stretch,
    duration: 0.22,
    ease: 'power2.out',
  })
  tl.to(blob, {
    left,
    width: size,
    duration: 0.36,
    ease: 'elastic.out(1, 0.55)',
  })
}

onMounted(async () => {
  const { gsap } = await import('gsap')
  gsapInstance = gsap
  gsap.set(blobEl.value, { width: 46, opacity: 0 })
  await moveBlobTo(activeIndex.value, false)
  gsap.to(blobEl.value, { opacity: 1, duration: 0.3 })
})

watch(activeIndex, (index) => {
  if (!hasPositioned) return
  moveBlobTo(index, true)
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

.nav-blob {
  position: absolute;
  top: 4px;
  left: 0;
  height: 40px;
  border-radius: 20px;
  background: radial-gradient(120% 140% at 50% 20%, rgba(110, 176, 130, .35), rgba(61, 139, 82, .16) 70%, transparent 100%);
  border: 1px solid rgba(110, 176, 130, .3);
  pointer-events: none;
  will-change: transform, width;
}
[data-theme='light'] .nav-blob {
  background: radial-gradient(120% 140% at 50% 20%, rgba(61, 139, 82, .22), rgba(61, 139, 82, .08) 70%, transparent 100%);
  border-color: rgba(45, 107, 62, .28);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  position: relative;
  z-index: 1;
  color: var(--text-disabled);
  transition: color .25s ease;
}
.nav-item span:last-child { font-size: 9.5px; font-weight: 600; }

.nav-item--active { color: var(--brand-light); }
[data-theme='light'] .nav-item--active { color: var(--brand-dark); }

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
