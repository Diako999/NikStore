<template>
  <div class="variant-groups">
    <div v-for="group in groups" :key="group.key" class="variant-group">
      <h3 class="variant-group__label">{{ group.key }}</h3>

      <div class="variant-group__options">
        <template v-if="group.swatch">
          <button
            v-for="opt in group.values"
            :key="opt.value"
            type="button"
            class="variant-swatch"
            :class="{ 'variant-swatch--active': modelValue[group.key] === opt.value, 'variant-swatch--disabled': !opt.inStock }"
            :style="{ background: opt.hex || '#999' }"
            :title="opt.value"
            :aria-label="opt.value"
            @click="select(group.key, opt.value)"
          >
            <AppIcon v-if="modelValue[group.key] === opt.value" name="check" :size="13" :stroke-width="2.5" />
          </button>
        </template>
        <template v-else>
          <button
            v-for="opt in group.values"
            :key="opt.value"
            type="button"
            class="variant-chip"
            :class="{ 'variant-chip--active': modelValue[group.key] === opt.value, 'variant-chip--disabled': !opt.inStock }"
            @click="select(group.key, opt.value)"
          >
            {{ opt.value }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import AppIcon from '~/components/icons/AppIcon.vue'

defineProps({
  groups: { type: Array, default: () => [] },
  modelValue: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:modelValue'])

function select(key, value) {
  emit('update:modelValue', { key, value })
}
</script>

<style scoped>
.variant-group { margin-bottom: 16px; }
.variant-group__label { font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 9px; }

.variant-group__options { display: flex; flex-wrap: wrap; gap: 9px; }

.variant-chip {
  font-size: 12px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 12px;
  color: var(--text-primary);
  background: var(--glass);
  border: 1.5px solid var(--glass-border);
}
.variant-chip--active {
  color: #fff;
  background: linear-gradient(135deg, #6EB082 0%, #3D8B52 55%, #2D6B3E 100%);
  border-color: transparent;
}
.variant-chip--disabled { opacity: .35; text-decoration: line-through; }

.variant-swatch {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--glass-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .25);
}
.variant-swatch--active { border-color: var(--brand-light); }
.variant-swatch--disabled { opacity: .3; }
</style>
