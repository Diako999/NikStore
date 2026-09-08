<template>
  <div class="trust-strip">
    <div v-for="item in items" :key="item.label" class="trust-strip__item">
      <div class="trust-strip__ico">
        <AppIcon :name="item.icon" :size="19" :stroke-width="2.6" />
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
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
[data-theme='light'] .trust-strip__ico {
  color: var(--brand-dark);
}

.trust-strip__item span {
  font-size: 9.5px;
  color: var(--text-secondary);
  line-height: 1.4;
  display: block;
}
</style>
