<template>
  <nav class="bottomnav">
    <NuxtLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="nav-item"
      :class="{ 'nav-item--active': isActive(tab) }"
    >
      <span v-if="isActive(tab)" class="nav-item__dotline" aria-hidden="true" />
      <span v-if="tab.badge" class="nav-item__cbadge">{{ toPersianDigits(tab.badge) }}</span>
      <AppIcon :name="tab.icon" :size="21" :stroke-width="2" />
      <span>{{ tab.label }}</span>
    </NuxtLink>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
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
.nav-item span:last-child { font-size: 9.5px; font-weight: 600; }

.nav-item--active { color: var(--brand-light); }
[data-theme='light'] .nav-item--active { color: var(--brand-dark); }

.nav-item__dotline {
  position: absolute;
  top: -11px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 2.5px;
  border-radius: 2px;
  background: currentColor;
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
