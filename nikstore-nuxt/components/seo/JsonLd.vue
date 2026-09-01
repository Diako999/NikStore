<script setup>
import { useHead } from '@unhead/vue'
import { computed } from 'vue'

const props = defineProps({
  schema: { type: Object, required: true },
})

const key = computed(() => `jsonld-${props.schema['@type'] || 'schema'}`)

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() => JSON.stringify(props.schema)),
      key: key,
    },
  ],
})
</script>

<template></template>
