<template>
  <div class="trust-row">
    <div v-for="(item, i) in items" :key="i" class="trust-row__item">
      <div class="trust-row__ico">
        <!-- Per-item scoped slot takes priority; falls back to rendering
             `item.icon` as a component reference if no slot content is given
             for that index. Either approach works — pick whichever is more
             convenient for the icon set you have (raw SVG components vs.
             an inline template per item). -->
        <slot name="icon" :item="item" :index="i">
          <component :is="item.icon" v-if="item.icon" />
        </slot>
      </div>
      <span>{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup>
// Matches the mockups' `.trust` strip — a 4-col grid of icon-circle + label.
defineProps({
  // Array of { icon, label }. `icon` is optional if you're using the #icon
  // scoped slot instead (see slot doc above).
  items: { type: Array, required: true },
})
</script>

<style scoped>
.trust-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.trust-row__item { text-align: center; }
.trust-row__ico {
  width: 40px;
  height: 40px;
  margin: 0 auto 7px;
  border-radius: 50%;
  background: var(--glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-light);
}
[data-theme='light'] .trust-row__ico { box-shadow: var(--glass-shadow); color: var(--brand-dark); }

.trust-row__item span {
  font-size: 9.5px;
  color: var(--text-secondary);
  line-height: 1.4;
  display: block;
}
</style>
