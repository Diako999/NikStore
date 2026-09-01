<template>
  <a
    class="link-pill"
    :class="iconClass"
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
  >
    <span class="link-pill__icon" aria-hidden="true">
      <slot name="icon" />
    </span>
    <span class="link-pill__label">{{ label }}</span>
  </a>
</template>

<script setup>
defineProps({
  href:      { type: String, required: true },
  label:     { type: String, required: true },
  /** one of: 'instagram' | 'telegram' | 'site' — controls the icon-circle background */
  iconClass: { type: String, default: '' },
})
</script>

<style scoped>
.link-pill {
  direction: ltr;
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  background: var(--links-pill-bg);
  border: 1px solid var(--links-pill-border);
  border-radius: 999px;
  padding: 10px 18px 10px 10px;
  text-decoration: none;
  backdrop-filter: blur(12px) saturate(140%);
  -webkit-backdrop-filter: blur(12px) saturate(140%);
  transition: background-color var(--transition-fast), transform var(--transition-fast);
}

.link-pill:hover {
  background: var(--links-pill-bg-hover);
  transform: translateY(-1px);
}

.link-pill:focus-visible {
  outline: 2px solid var(--links-gold);
  outline-offset: 3px;
}

.link-pill:active { transform: translateY(0); }

.link-pill__icon {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.link-pill--instagram .link-pill__icon {
  background: radial-gradient(circle at 30% 110%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285aeb 90%);
}

.link-pill--telegram .link-pill__icon { background: #2aabee; }

.link-pill--site .link-pill__icon { background: #fbf8f0; }

.link-pill__label {
  font-size: 15.5px;
  font-weight: 600;
  color: var(--links-gold-soft);
}
</style>
