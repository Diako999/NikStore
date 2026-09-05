<template>
  <component :is="to ? 'NuxtLink' : 'div'" :to="to || undefined" class="cat-tile">
    <div class="cat-tile__sheen" aria-hidden="true" />
    <div class="cat-tile__ico">
      <AppIcon :name="icon" :size="20" :stroke-width="1.6" />
    </div>
    <span class="cat-tile__lbl">{{ label }}</span>
    <span v-if="sub" class="cat-tile__sub">{{ sub }}</span>
  </component>
</template>

<script setup>
import AppIcon from '~/components/icons/AppIcon.vue'

defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
  sub: { type: String, default: '' },
  to: { type: [String, Object], default: null },
})
</script>

<style scoped>
.cat-tile {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  padding: 14px 8px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  border: 1px solid transparent;
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  background:
    linear-gradient(var(--glass), var(--glass)) padding-box,
    linear-gradient(150deg, rgba(255, 255, 255, .45), rgba(255, 255, 255, .04) 55%, rgba(122, 90, 220, .30)) border-box;
}
[data-theme='light'] .cat-tile {
  border-width: 1.5px;
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  box-shadow: var(--glass-shadow);
  background:
    linear-gradient(var(--glass), var(--glass)) padding-box,
    linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(122, 90, 220, .4) 55%, rgba(231, 175, 66, .5) 100%) border-box;
}

.cat-tile__sheen {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(135deg, rgba(255, 255, 255, .16) 0%, rgba(255, 255, 255, 0) 42%);
}
[data-theme='light'] .cat-tile__sheen {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, .9) 0%, rgba(255, 255, 255, 0) 45%),
    radial-gradient(120% 100% at 100% 100%, rgba(122, 90, 220, .14), transparent 60%);
}

.cat-tile__ico {
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(110, 176, 130, .30), rgba(231, 175, 66, .16));
  border: 1px solid rgba(255, 255, 255, .18);
  color: var(--brand-light);
}
[data-theme='light'] .cat-tile__ico {
  background: linear-gradient(135deg, rgba(61, 139, 82, .20), rgba(231, 175, 66, .14));
  border-color: rgba(255, 255, 255, .6);
  color: var(--brand-dark);
}

.cat-tile__lbl { font-size: 12.5px; font-weight: 700; color: var(--text-primary); position: relative; }
.cat-tile__sub { font-size: 9.5px; color: var(--text-secondary); line-height: 1.4; position: relative; }
</style>
