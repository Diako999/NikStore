// SSR-safe dark/light mode. Resolution order: cookie value, then (client-only)
// prefers-color-scheme, then 'dark' as the default/no-JS fallback — matching
// the design's primary look. useState keeps this reactive and shared across
// components without leaking between requests on the server (unlike a plain
// module-scoped ref would).
export function useTheme() {
  const themeCookie = useCookie('nik-theme', {
    default: () => null,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  const mode = useState('theme-mode', () => {
    if (themeCookie.value === 'dark' || themeCookie.value === 'light') return themeCookie.value
    return 'dark'
  })

  if (import.meta.client && !themeCookie.value) {
    mode.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  function setMode(next) {
    const value = next === 'light' ? 'light' : 'dark'
    mode.value = value
    themeCookie.value = value
  }

  function toggle() {
    setMode(mode.value === 'dark' ? 'light' : 'dark')
  }

  return { mode, setMode, toggle }
}
