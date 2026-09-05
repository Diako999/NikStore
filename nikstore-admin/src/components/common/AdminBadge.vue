<template>
  <span class="admin-badge" :class="`admin-badge--${variant}`">
    <slot />
  </span>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'neutral' }, // pending | success | danger | neutral
})
</script>

<style scoped>
.admin-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  line-height: 1.5;
  white-space: nowrap;
}

.admin-badge--neutral {
  color: var(--text-secondary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
}

.admin-badge--pending {
  color: #7A5410;
  background: rgba(231, 175, 66, .28);
  border: 1px solid rgba(231, 175, 66, .5);
}
[data-theme='dark'] .admin-badge--pending {
  color: #FBEFC8;
  background: rgba(231, 175, 66, .18);
  border: 1px solid rgba(231, 175, 66, .4);
}

.admin-badge--success {
  color: var(--brand-dark);
  background: rgba(110, 176, 130, .22);
  border: 1px solid rgba(110, 176, 130, .45);
}
[data-theme='dark'] .admin-badge--success {
  color: var(--brand-light);
  background: rgba(110, 176, 130, .16);
  border: 1px solid rgba(110, 176, 130, .35);
}

.admin-badge--danger {
  color: #B84440;
  background: rgba(217, 83, 79, .16);
  border: 1px solid rgba(217, 83, 79, .38);
}
[data-theme='dark'] .admin-badge--danger {
  color: #F2938F;
  background: rgba(217, 83, 79, .18);
  border: 1px solid rgba(217, 83, 79, .4);
}
</style>
