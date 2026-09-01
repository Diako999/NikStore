<template>
  <li class="relative" @mouseenter="onEnter" @mouseleave="onLeave">
    <NuxtLink
      :to="`/category/${item.slug}`"
      @click="$emit('close')"
      :class="[
        'flex items-center justify-between gap-2 w-full text-sm px-3 py-2 rounded-lg transition-colors whitespace-nowrap',
        open && item.children?.length
          ? 'text-brand bg-brand/5'
          : 'text-glass-text-secondary hover:text-brand hover:bg-brand/5',
      ]"
    >
      {{ item.name }}
      <svg v-if="item.children?.length"
        class="w-3 h-3 flex-shrink-0 transition-transform duration-200"
        :class="open ? 'text-brand' : 'text-glass-text-disabled'"
        style="transform: rotate(90deg);"
        fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"
        data-testid="sub-chevron">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
      </svg>
    </NuxtLink>

    <!-- Recursive sub-panel
         Positioned LEFT of the parent item (right: 100%) so it cascades outward in RTL layout.
         The parent dropdown container MUST NOT have overflow-hidden or this panel gets clipped. -->
    <div
      v-if="item.children?.length"
      v-show="open"
      class="absolute top-0 z-[320] min-w-44 rounded-xl shadow-xl nav-sub-panel p-1.5"
      style="right: calc(100% + 4px);"
      data-testid="sub-panel"
      @mouseenter="onEnter"
      @mouseleave="onLeave"
    >
      <ul class="flex flex-col gap-0.5">
        <NavDropdownItem
          v-for="child in item.children"
          :key="child._id"
          :item="child"
          @close="$emit('close')"
        />
      </ul>
    </div>
  </li>
</template>

<script setup>
import { ref } from 'vue'
import { logger } from '~/utils/logger'

const CTX = 'NavDropdownItem'

const props = defineProps({ item: { type: Object, required: true } })
defineEmits(['close'])

const open = ref(false)
let timer  = null

function onEnter() {
  clearTimeout(timer)
  if (!open.value && props.item.children?.length) {
    logger.debug('nav dropdown: opening sub-panel', { name: props.item.name }, CTX)
  }
  open.value = true
}
function onLeave() {
  timer = setTimeout(() => { open.value = false }, 150)
}
</script>

<style scoped>
.nav-sub-panel {
  background: var(--glass-strong);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid var(--glass-border);
}
</style>
