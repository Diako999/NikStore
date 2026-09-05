<template>
  <div class="section-head">
    <h2>{{ title }}</h2>
    <NuxtLink v-if="to" :to="to">مشاهده همه ←</NuxtLink>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  to: { type: [String, Object], default: null },
})
</script>

<style scoped>
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 18px 12px;
}

h2 {
  font-size: 15.5px;
  font-weight: 700;
  color: var(--text-primary);
}

a {
  font-size: 12px;
  font-weight: 700;
  color: var(--brand-light);
}
[data-theme='light'] a { color: var(--brand-dark); }
</style>
