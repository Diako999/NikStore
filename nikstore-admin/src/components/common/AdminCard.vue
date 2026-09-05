<template>
  <section class="admin-card" :class="{ 'admin-card--flush': flush }">
    <header v-if="$slots.header || title" class="admin-card__header">
      <slot name="header">
        <h3 class="admin-card__title">{{ title }}</h3>
      </slot>
    </header>
    <div class="admin-card__body">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="admin-card__footer">
      <slot name="footer" />
    </footer>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  flush: { type: Boolean, default: false },
})
</script>

<style scoped>
.admin-card {
  position: relative;
  border-radius: 18px;
  background:
    linear-gradient(var(--glass), var(--glass)) padding-box,
    linear-gradient(150deg, rgba(255, 255, 255, .42), rgba(255, 255, 255, .03) 55%, rgba(231, 175, 66, .28)) border-box;
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid transparent;
}
[data-theme='light'] .admin-card {
  background:
    linear-gradient(var(--glass), var(--glass)) padding-box,
    linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(231, 175, 66, .5) 55%, rgba(122, 90, 220, .4) 100%) border-box;
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  border: 1.5px solid transparent;
  box-shadow: var(--glass-shadow);
}

.admin-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid var(--glass-border);
}
.admin-card__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}
.admin-card__body {
  padding: 20px;
}
.admin-card--flush .admin-card__body {
  padding: 0;
}
.admin-card__footer {
  padding: 14px 20px;
  border-top: 1px solid var(--glass-border);
}
</style>
