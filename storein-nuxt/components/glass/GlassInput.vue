<template>
  <div class="glass-input-group">
    <label v-if="label" :for="uid" class="glass-input-label">{{ label }}</label>
    <div class="glass-input-wrap" :class="{ 'glass-input-wrap--error': !!error }">
      <div v-if="$slots.prepend || prepend" class="glass-input-affix glass-input-affix--prepend">
        <slot name="prepend"><span>{{ prepend }}</span></slot>
      </div>
      <input
        v-bind="$attrs"
        :id="uid"
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :dir="dir"
        class="glass-input"
        :class="[
          ($slots.prepend || prepend) ? 'glass-input--has-prepend' : '',
          ($slots.append || append) ? 'glass-input--has-append' : '',
        ]"
        @input="$emit('update:modelValue', $event.target.value)"
        @focus="$emit('focus', $event)"
        @blur="$emit('blur', $event)"
        @keydown.enter="$emit('enter', $event)"
      >
      <div v-if="$slots.append || append" class="glass-input-affix glass-input-affix--append">
        <slot name="append"><span>{{ append }}</span></slot>
      </div>
    </div>
    <p v-if="error" class="glass-input-msg glass-input-msg--error">{{ error }}</p>
    <p v-else-if="hint" class="glass-input-msg glass-input-msg--hint">{{ hint }}</p>
  </div>
</template>

<script setup>
// Form-field surface on the glass token system. IMPORTANT constraint (per
// design spec): inputs must stay high-contrast and easily readable — a
// light glass tint (bg-glass) with a solid, clearly-visible border and
// solid (non-transparent) text, NOT the heavy decorative blur treatment
// used on GlassCard/HeroBanner. Blur here is intentionally shallow (8px)
// and only for material consistency with the rest of the glass system.
defineProps({
  modelValue:  { type: [String, Number], default: '' },
  label:       { type: String, default: '' },
  placeholder: { type: String, default: '' },
  type:        { type: String, default: 'text' },
  error:       { type: String, default: '' },
  hint:        { type: String, default: '' },
  disabled:    { type: Boolean, default: false },
  prepend:     { type: String, default: '' },
  append:      { type: String, default: '' },
  dir:         { type: String, default: 'rtl' },
})

defineEmits(['update:modelValue', 'focus', 'blur', 'enter'])

// useId() (Vue 3.5+) generates a stable id that matches between SSR and
// client hydration — a random-string id (the pattern BaseInput.vue uses)
// mismatches on hydration because Math.random() produces a different value
// on the server render vs. the client's first render.
const uid = `glass-input-${useId()}`
</script>

<style scoped>
.glass-input-group { display: flex; flex-direction: column; gap: 6px; }
.glass-input-label { font-size: 13px; font-weight: 600; color: var(--text-primary); }

.glass-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 14px;
  background: var(--glass);
  backdrop-filter: blur(8px) saturate(140%);
  -webkit-backdrop-filter: blur(8px) saturate(140%);
  border: 1.5px solid var(--glass-border);
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.glass-input-wrap:focus-within {
  border-color: var(--brand-light);
  box-shadow: 0 0 0 3px rgb(var(--brand-rgb) / 0.18);
}
.glass-input-wrap--error { border-color: #EF4444; }

.glass-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  padding: 12px 16px;
  font-size: 13.5px;
  font-family: inherit;
  /* Solid, fully-opaque text — never let the glass tint reduce legibility */
  color: var(--text-primary);
}
.glass-input::placeholder { color: var(--text-disabled); }
.glass-input:disabled { opacity: 0.5; cursor: not-allowed; }
.glass-input--has-prepend { padding-inline-start: 4px; }
.glass-input--has-append { padding-inline-end: 4px; }

.glass-input-affix {
  display: flex;
  align-items: center;
  color: var(--text-secondary);
  padding-inline: 12px;
  flex-shrink: 0;
}

.glass-input-msg { font-size: 11.5px; }
.glass-input-msg--error { color: #EF4444; }
.glass-input-msg--hint { color: var(--text-secondary); }
</style>
