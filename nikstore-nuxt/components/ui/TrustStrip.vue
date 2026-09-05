<template>
  <div class="trust-strip">
    <div v-for="item in items" :key="item.label" class="trust-strip__item">
      <div class="trust-strip__ico">
        <AppIcon :name="item.icon" :size="16" :stroke-width="1.8" />
      </div>
      <span>{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup>
import AppIcon from '~/components/icons/AppIcon.vue'

defineProps({
  items: { type: Array, required: true },
})
</script>

<style scoped>
.trust-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin: 0 18px;
}
.trust-strip__item { text-align: center; }

.trust-strip__ico {
  width: 40px;
  height: 40px;
  margin: 0 auto 7px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: var(--brand-light);
}
[data-theme='light'] .trust-strip__ico {
  box-shadow: var(--glass-shadow);
  color: var(--brand-dark);
}

.trust-strip__item span {
  font-size: 9.5px;
  color: var(--text-secondary);
  line-height: 1.4;
  display: block;
}
</style>
