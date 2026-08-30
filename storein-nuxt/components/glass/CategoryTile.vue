<template>
  <GlassCard
    :as="to ? 'NuxtLink' : 'div'"
    :to="to || undefined"
    tint="accent-purple"
    padding="sm"
    class="cat-tile"
  >
    <div class="cat-tile__ico">
      <slot name="icon">
        <component :is="icon" v-if="icon" />
      </slot>
    </div>
    <span class="cat-tile__lbl">{{ label }}</span>
    <span v-if="sub" class="cat-tile__sub">{{ sub }}</span>
  </GlassCard>
</template>

<script setup>
// Matches the mockups' `.cat-tile` — a 3-col grid item (icon circle + label
// + sub-label). Built on GlassCard (tint="accent-purple") rather than
// re-implementing the glass recipe.
import GlassCard from './GlassCard.vue'

defineProps({
  // Icon can be passed as a component reference (rendered via <component>)
  // or via the #icon slot (takes priority if both are given) — use whichever
  // is more convenient at the call site.
  icon:  { type: [Object, Function], default: null },
  label: { type: String, required: true },
  sub:   { type: String, default: '' },
  to:    { type: [String, Object], default: null },
})
</script>

<style scoped>
.cat-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  text-decoration: none;
}

.cat-tile__ico {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(110, 176, 130, .30), rgba(231, 175, 66, .16));
  border: 1px solid rgba(255, 255, 255, .18);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-light);
}
[data-theme='light'] .cat-tile__ico {
  background: linear-gradient(135deg, rgba(61, 139, 82, .20), rgba(231, 175, 66, .14));
  border-color: rgba(255, 255, 255, .6);
  color: var(--brand-dark);
}

.cat-tile__lbl { font-size: 12.5px; font-weight: 700; color: var(--text-primary); }
.cat-tile__sub { font-size: 9.5px; color: var(--text-secondary); line-height: 1.4; }
</style>
