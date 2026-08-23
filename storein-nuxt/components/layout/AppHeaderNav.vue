<template>
  <nav class="hidden md:block border-t border-surface-border" style="background-color: var(--color-card);">
    <div class="container-main flex items-center h-11 gap-1">

      <!-- Quick links -->
      <NuxtLink
        v-for="link in quickLinks"
        :key="link.label"
        :to="link.to"
        :data-testid="`quick-${link.name}`"
        :class="[
          'flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-all duration-200',
          isLinkActive(link)
            ? 'bg-brand text-white shadow-sm'
            : 'text-text-secondary hover:text-brand hover:bg-brand/10',
        ]"
      >
        {{ link.label }}
      </NuxtLink>

      <!-- Divider -->
      <div class="mx-1.5 h-4 w-px rounded-full flex-shrink-0" style="background-color: var(--color-border);" />

      <!-- Dynamic categories
           NOTE: no overflow-x-auto here — it would create a scroll container that clips
           the absolutely-positioned dropdown panels -->
      <div class="flex items-center gap-0.5 flex-1">
        <div
          v-for="cat in categories"
          :key="cat._id"
          class="relative flex-shrink-0"
          :data-testid="`cat-item-${cat._id}`"
          @mouseenter="onEnter(cat._id)"
          @mouseleave="onLeave"
        >
          <NuxtLink
            :to="`/category/${cat.slug}`"
            :class="[
              'flex items-center gap-1.5 px-3.5 py-1.5 text-sm rounded-full whitespace-nowrap transition-all duration-200',
              hoveredId === cat._id
                ? 'bg-brand/10 text-brand font-semibold'
                : 'text-text-secondary font-medium hover:text-text-primary hover:bg-brand/5',
            ]"
          >
            <span v-if="cat.icon" class="text-sm leading-none">{{ cat.icon }}</span>
            {{ cat.name }}
            <svg
              v-if="cat.children?.length"
              class="w-3 h-3 flex-shrink-0 transition-transform duration-200"
              :class="hoveredId === cat._id ? 'rotate-180 text-brand' : 'text-text-disabled'"
              fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
            </svg>
          </NuxtLink>

          <!-- Dropdown -->
          <div
            v-show="hoveredId === cat._id && cat.children?.length"
            class="nav-drop absolute top-full right-0 z-[300] min-w-[11rem] pt-1.5"
            :data-testid="`dropdown-${cat._id}`"
            @mouseenter="onEnter(cat._id)"
            @mouseleave="onLeave"
          >
            <!-- NOTE: no overflow-hidden — it would clip absolutely-positioned sub-panels.
                 rounded-t-2xl on the header preserves corner rounding without clipping. -->
            <div class="rounded-2xl shadow-2xl"
                 style="border: 1px solid var(--color-border); background-color: var(--color-card);">
              <div class="px-4 py-3 flex items-center gap-2 bg-brand rounded-t-2xl">
                <span v-if="cat.icon" class="text-base leading-none">{{ cat.icon }}</span>
                <span class="text-xs font-bold text-white tracking-wide">{{ cat.name }}</span>
              </div>
              <ul class="p-2 flex flex-col gap-0.5">
                <NavDropdownItem
                  v-for="child in cat.children"
                  :key="child._id"
                  :item="child"
                  @close="hoveredId = null"
                />
              </ul>
            </div>
          </div>
        </div>
      </div>

    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useCategoryStore } from '~/stores/category.store'
import { storeToRefs } from 'pinia'
import NavDropdownItem from '~/components/layout/NavDropdownItem.vue'
import { logger } from '~/utils/logger'

const CTX = 'AppHeaderNav'

const route         = useRoute()
const categoryStore = useCategoryStore()
const { categories } = storeToRefs(categoryStore)

const hoveredId = ref(null)
let closeTimer  = null

const quickLinks = [
  { name: 'home', label: 'صفحه اصلی', to: '/' },
  { name: 'blog', label: 'بلاگ',      to: '/blog' },
]

function isLinkActive(link) {
  if (link.name === 'home') return route.path === '/'
  if (link.name === 'blog') return route.name === 'blog' || route.name === 'blog-detail'
  if (link.to?.params?.slug) return route.params?.slug === link.to.params.slug
  return false
}

function onEnter(id) {
  clearTimeout(closeTimer)
  if (hoveredId.value !== id) {
    logger.debug('desktop nav: hovering category', { id }, CTX)
  }
  hoveredId.value = id
}

function onLeave() {
  closeTimer = setTimeout(() => { hoveredId.value = null }, 150)
}
</script>

<style scoped>
.nav-drop {
  animation: dropIn 0.15s ease;
}
@keyframes dropIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
