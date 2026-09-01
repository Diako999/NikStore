<template>
  <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div class="text-5xl mb-4 select-none" aria-hidden="true">{{ icon }}</div>
    <h3 class="text-lg font-semibold text-glass-text-primary mb-2">{{ title }}</h3>
    <p v-if="subtitle" class="text-glass-text-secondary text-sm mb-6 max-w-xs leading-relaxed">{{ subtitle }}</p>
    <template v-if="action">
      <NuxtLink v-if="to" :to="to">
        <button class="btn-brand text-sm px-5 py-2.5">{{ action }}</button>
      </NuxtLink>
      <button v-else class="btn-brand text-sm px-5 py-2.5" @click="$emit('action')">{{ action }}</button>
    </template>
  </div>
</template>

<script setup>
defineProps({
  title:    { type: String, default: 'موردی یافت نشد' },
  subtitle: { type: String, default: '' },
  icon:     { type: String, default: '🔍' },
  action:   { type: String, default: '' },
  to:       { type: String, default: '' },
})

defineEmits(['action'])
</script>
