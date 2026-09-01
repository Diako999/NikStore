// Shared helper for Chart.js color theming (bug fix: dashboard charts used
// to hardcode a blue (#1B4F8A) with no relation to the actual brand green).
// Chart.js needs literal color strings, not CSS var references, so callers
// resolve --brand/--text-secondary/etc to a literal hex/rgba string at
// chart-init time via getComputedStyle — and re-resolve whenever the theme
// toggles (each chart component reads useThemeMode()'s `mode` inside a
// computed so it naturally re-renders on toggle).

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!m) return null
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

/**
 * Resolve a CSS custom property to a literal color string.
 * @param {string} varName  e.g. '--brand'
 * @param {string} fallback used if the var is unset or we're not in a browser (e.g. unit tests)
 * @param {number} [alpha]  if given, returns `rgba(r,g,b,alpha)` instead of the raw value
 */
export function resolveThemeColor(varName, fallback, alpha) {
  let raw = fallback
  if (typeof document !== 'undefined') {
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
    if (value) raw = value
  }
  if (alpha === undefined) return raw
  const rgb = hexToRgb(raw) ?? hexToRgb(fallback)
  if (!rgb) return raw
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}
