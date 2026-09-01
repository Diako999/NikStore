<template>
  <component
    :is="rootTag"
    v-bind="rootProps"
    class="glass-btn"
    :class="[
      `glass-btn--${variant}`,
      `glass-btn--${size}`,
      block ? 'glass-btn--block' : '',
      (disabled || loading) ? 'glass-btn--disabled' : '',
    ]"
    :disabled="rootTag === 'button' ? (disabled || loading) : undefined"
    :aria-disabled="(disabled || loading) || undefined"
    :aria-busy="loading || undefined"
    @click="onClick"
  >
    <!-- Primary variant gets a motion-v press-feedback wrapper (proves
         motion-v is installed/working — see AGENT report for details).
         Other variants stay plain to keep this a light-touch smoke test,
         not a full micro-interaction system. -->
    <Motion
      v-if="variant === 'primary'"
      as="span"
      class="glass-btn__inner"
      :while-press="(disabled || loading) ? undefined : { scale: 0.96 }"
      :transition="{ duration: 0.12 }"
    >
      <span v-if="loading" class="glass-btn__spinner" aria-hidden="true" />
      <slot />
    </Motion>
    <span v-else class="glass-btn__inner">
      <span v-if="loading" class="glass-btn__spinner" aria-hidden="true" />
      <slot />
    </span>
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { Motion } from 'motion-v'

const props = defineProps({
  variant:  { type: String, default: 'primary', validator: (v) => ['primary', 'secondary', 'ghost'].includes(v) },
  size:     { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
  loading:  { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  block:    { type: Boolean, default: false },
  // Explicit root tag override (rarely needed — `to`/`href` normally decide it).
  as:   { type: [String, Object], default: null },
  to:   { type: [String, Object], default: null },
  href: { type: String, default: null },
})

const emit = defineEmits(['click'])

const rootTag = computed(() => {
  // 'NuxtLink' as a string resolves via the global component registry at
  // render time — no need for resolveComponent() (which needs an active
  // render context that a computed getter isn't guaranteed to have).
  if (props.to) return 'NuxtLink'
  if (props.href) return 'a'
  return props.as || 'button'
})

const rootProps = computed(() => {
  if (props.to) return { to: props.to }
  if (props.href) return { href: props.href }
  if (rootTag.value === 'button') return { type: 'button' }
  return {}
})

function onClick(event) {
  if (props.disabled || props.loading) {
    event.preventDefault()
    event.stopPropagation()
    return
  }
  emit('click', event)
}
</script>

<style scoped>
.glass-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 700;
  border-radius: 9999px;
  cursor: pointer;
  text-decoration: none;
  transition: transform 150ms ease, box-shadow 150ms ease, background-color 150ms ease, color 150ms ease;
  -webkit-tap-highlight-color: transparent;
}
.glass-btn__inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.glass-btn--block { display: flex; width: 100%; }
.glass-btn--disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }

/* Sizes */
.glass-btn--sm { padding: 8px 14px; font-size: 12.5px; }
.glass-btn--md { padding: 12px 20px; font-size: 13.5px; }
.glass-btn--lg { padding: 15px 26px; font-size: 15px; }

/* Primary — exact gradient fill from the mockups */
.glass-btn--primary {
  background: linear-gradient(135deg, #6EB082 0%, #3D8B52 55%, #2D6B3E 100%);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, .25);
  box-shadow: 0 8px 22px rgba(0, 0, 0, .35), inset 0 1px 0 rgba(255, 255, 255, .30);
}
[data-theme='light'] .glass-btn--primary {
  border-color: rgba(255, 255, 255, .3);
  box-shadow: 0 10px 22px rgba(40, 55, 46, .30), inset 0 1px 0 rgba(255, 255, 255, .35);
}
.glass-btn--primary:not(.glass-btn--disabled):hover { filter: brightness(1.05); }

/* Secondary — GlassCard-style translucent fill, brand-colored text */
.glass-btn--secondary {
  background: var(--glass);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid var(--glass-border);
  color: var(--brand-light);
}
[data-theme='light'] .glass-btn--secondary { color: var(--brand-dark); }
.glass-btn--secondary:not(.glass-btn--disabled):hover { background: var(--glass-strong); }

/* Ghost — text-only, no fill/border */
.glass-btn--ghost {
  background: transparent;
  border: 1px solid transparent;
  color: var(--brand-light);
  padding-inline: 10px;
}
[data-theme='light'] .glass-btn--ghost { color: var(--brand-dark); }
.glass-btn--ghost:not(.glass-btn--disabled):hover { background: var(--glass); }

/* Loading spinner */
.glass-btn__spinner {
  width: 1em;
  height: 1em;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-top-color: transparent;
  animation: glass-btn-spin 0.7s linear infinite;
}
@keyframes glass-btn-spin {
  to { transform: rotate(360deg); }
}
</style>
