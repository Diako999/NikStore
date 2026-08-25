// ── Color helpers ─────────────────────────────────────────────────
function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}

function darken({ r, g, b }, amount = 0.18) {
  return {
    r: Math.round(r * (1 - amount)),
    g: Math.round(g * (1 - amount)),
    b: Math.round(b * (1 - amount)),
  }
}

function lighten({ r, g, b }, amount = 0.18) {
  return {
    r: Math.round(r + (255 - r) * amount),
    g: Math.round(g + (255 - g) * amount),
    b: Math.round(b + (255 - b) * amount),
  }
}

function rgbStr({ r, g, b }) {
  return `${r} ${g} ${b}`
}

// ── Apply primary color to CSS vars ──────────────────────────────
function applyPrimaryColor(hex) {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return
  const base = hexToRgb(hex)
  const root  = document.documentElement.style
  root.setProperty('--color-brand-rgb',       rgbStr(base))
  root.setProperty('--color-brand-dark-rgb',  rgbStr(darken(base)))
  root.setProperty('--color-brand-light-rgb', rgbStr(lighten(base)))
}

// ── Apply section colors ──────────────────────────────────────────
function applyColors(theme) {
  const root = document.documentElement.style

  function apply(cssVar, val) {
    if (val) root.setProperty(cssVar, val)
    else     root.removeProperty(cssVar)
  }

  apply('--color-header-bg',     theme.navbarBg)
  apply('--color-header-border', theme.navbarBorder)
  apply('--color-footer-bg',     theme.footerBg)
  apply('--color-footer-text',   theme.footerText)
  apply('--color-body-bg',       theme.pageBg)
}

export function useTheme() {

  // Called after settings are fetched from API
  function applyFromSettings(theme) {
    if (!theme) return
    if (theme.primaryColor) applyPrimaryColor(theme.primaryColor)
    applyColors(theme)
  }

  return { applyFromSettings }
}
