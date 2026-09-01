<template>
  <component
    :is="as"
    class="glass-card"
    :class="[`glass-card--pad-${padding}`, `glass-card--tint-${tint}`]"
    :style="{ '--gc-radius': radius }"
  >
    <slot />
  </component>
</template>

<script setup>
// Base glass surface primitive — the shared recipe every decorative glass
// component in this library (CategoryTile, product cards, etc. in later
// chunks) is built on. Matches the mockups' `.cat-tile`/`.p-card` recipe:
// a dual-background trick (flat --glass fill on the padding-box, a diagonal
// gradient on the border-box) plus a `::before` diagonal sheen layer.
defineProps({
  // Inner spacing preset. Consumers needing asymmetric padding (e.g. a tile
  // with less horizontal than vertical padding) should add their own utility
  // classes on top rather than extending this prop with new presets.
  padding: { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
  // Any valid CSS radius value (not restricted to the sm/md/lg preset style
  // of `padding`) since callers reasonably want e.g. '24px' or '50%'.
  radius: { type: String, default: '18px' },
  // Border-gradient / sheen flavor. 'default' is the neutral gold+purple mix
  // used by the mockups' cat-tile; the accent-* variants lean the border
  // gradient toward one accent color for later chunks that want a subtler
  // single-hue variant (e.g. a purple-leaning promo tile vs a gold-leaning one).
  tint: { type: String, default: 'default', validator: (v) => ['default', 'accent-purple', 'accent-gold'].includes(v) },
  // Root element/component tag — e.g. 'NuxtLink' for a clickable tile. Any
  // extra attrs (`to`, `href`, etc.) fall through automatically since this
  // component has a single root element.
  as: { type: [String, Object], default: 'div' },
})
</script>

<style scoped>
.glass-card {
  position: relative;
  overflow: hidden;
  border: 1.5px solid transparent;
  border-radius: var(--gc-radius, 18px);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  /* Dual-background trick: flat --glass fill painted into the padding-box,
     diagonal accent gradient painted into the border-box (visible only
     through the transparent border) — this is what makes the border read
     as a soft gradient ring instead of a flat color. */
  background:
    linear-gradient(var(--glass), var(--glass)) padding-box,
    var(--gc-border) border-box;
}

/* Diagonal sheen — a purely decorative highlight simulating a light source
   coming from the top-left-ish corner (135deg is a physical/visual angle,
   not a text-flow direction). Intentionally NOT flipped for RTL: this app
   mirrors text and layout direction, but a light source has no "reading
   direction" — flipping it would make the highlight appear to jump to a
   different corner on every RTL page, which reads as a bug (the light
   moved), not as correct RTL support. Verified visually in an RTL page. */
.glass-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--gc-sheen);
  pointer-events: none;
}

/* ── Padding presets ───────────────────────────────────────────────── */
.glass-card--pad-sm { padding: 0.75rem; }
.glass-card--pad-md { padding: 1rem; }
.glass-card--pad-lg { padding: 1.5rem; }

/* ── Dark theme (default — matches :root, [data-theme="dark"] in glass-theme.css) ── */
.glass-card {
  --gc-sheen: linear-gradient(135deg, rgba(255, 255, 255, .16) 0%, rgba(255, 255, 255, 0) 42%);
}
.glass-card--tint-default {
  --gc-border: linear-gradient(150deg, rgba(255, 255, 255, .45), rgba(255, 255, 255, .04) 55%, rgba(122, 90, 220, .30));
}
.glass-card--tint-accent-purple {
  --gc-border: linear-gradient(150deg, rgba(255, 255, 255, .45), rgba(255, 255, 255, .05) 55%, rgba(122, 90, 220, .45));
}
.glass-card--tint-accent-gold {
  --gc-border: linear-gradient(150deg, rgba(255, 255, 255, .42), rgba(255, 255, 255, .03) 55%, rgba(231, 175, 66, .32));
}

/* ── Light theme ───────────────────────────────────────────────────── */
[data-theme='light'] .glass-card {
  --gc-sheen:
    linear-gradient(135deg, rgba(255, 255, 255, .9) 0%, rgba(255, 255, 255, 0) 45%),
    radial-gradient(120% 100% at 100% 100%, rgba(122, 90, 220, .14), transparent 60%);
}
[data-theme='light'] .glass-card--tint-default {
  --gc-border: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(122, 90, 220, .4) 55%, rgba(231, 175, 66, .5) 100%);
}
[data-theme='light'] .glass-card--tint-accent-purple {
  --gc-border: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(122, 90, 220, .5) 55%, rgba(122, 90, 220, .2) 100%);
}
[data-theme='light'] .glass-card--tint-accent-gold {
  --gc-border: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(231, 175, 66, .5) 55%, rgba(231, 175, 66, .2) 100%);
}
</style>
