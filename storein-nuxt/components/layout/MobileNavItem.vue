<template>
  <div>
    <!-- Row -->
    <div
      class="flex items-center rounded-xl transition-colors duration-150"
      :class="open && depth === 0 ? 'bg-brand/10' : ''"
      @mouseenter="e => { if (!(open && depth === 0)) e.currentTarget.style.backgroundColor = 'var(--glass)' }"
      @mouseleave="e => { if (!(open && depth === 0)) e.currentTarget.style.backgroundColor = '' }"
    >
      <!-- Indent spacer for sub-items -->
      <span v-if="depth > 0" :style="`width: ${depth * 8}px; flex-shrink: 0;`" />

      <NuxtLink
        :to="`/category/${item.slug}`"
        @click="$emit('close')"
        class="flex-1 flex items-center gap-2 py-2.5 text-sm transition-colors"
        :class="depth === 0 ? 'px-3 font-semibold' : 'px-2 font-normal'"
        :style="open ? 'color: var(--brand);' : depth > 0 ? 'color: var(--text-secondary);' : 'color: var(--text-primary);'"
      >
        <span v-if="item.icon && depth === 0" class="text-base leading-none flex-shrink-0">{{ item.icon }}</span>
        <span v-else-if="depth > 0" class="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style="background-color: var(--text-disabled);" />
        {{ item.name }}
      </NuxtLink>

      <button
        v-if="item.children?.length"
        @click.stop="open = !open"
        class="px-3 py-2.5 flex-shrink-0"
        :style="open ? 'color: var(--brand);' : 'color: var(--text-disabled);'"
      >
        <svg
          class="w-4 h-4 transition-transform duration-200"
          :style="open ? 'transform: rotate(-90deg)' : ''"
          fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
        </svg>
      </button>
    </div>

    <!-- Children with tree line -->
    <div
      v-if="item.children?.length"
      v-show="open"
      class="mt-0.5 mb-1 flex flex-col gap-0.5"
      style="margin-right: 20px; padding-right: 10px; border-right: 2px solid var(--glass-border);"
    >
      <MobileNavItem
        v-for="child in item.children"
        :key="child._id"
        :item="child"
        :depth="depth + 1"
        @close="$emit('close')"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  item:  { type: Object, required: true },
  depth: { type: Number, default: 0 },
})
defineEmits(['close'])

const open = ref(false)
</script>
