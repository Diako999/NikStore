<template>
  <component :is="as" class="icon-btn" v-bind="$attrs">
    <slot />
    <span v-if="dot" class="icon-btn__dot" aria-hidden="true" />
  </component>
</template>

<script setup>
// Matches the mockups' `.icon-btn` — the 38px glass circle used for the
// hero's top-actions (heart/bag) and reused wherever a floating glass icon
// button is needed.
defineProps({
  as: { type: [String, Object], default: 'button' },
  dot: { type: Boolean, default: false },
})
</script>

<style scoped>
.icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: #fff;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  cursor: pointer;
}
[data-theme='light'] .icon-btn {
  /* Dark icon + dark-tinted glass, not light-on-light — these buttons sit
     over an admin-configurable hero photo of unknown brightness, and a
     white icon on a light glass tint disappears against a bright photo. */
  color: #1E2822;
  background: rgba(30, 40, 34, .16);
  border-color: rgba(30, 40, 34, .22);
}

.icon-btn__dot {
  position: absolute;
  top: 6px;
  inset-inline-end: 7px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--brand-light);
  border: 2px solid #0B1310;
}
[data-theme='light'] .icon-btn__dot {
  border-color: rgba(0, 0, 0, .3);
}
</style>
