// Plain $fetch (not the axios http.service) — it's the only client that
// resolves relative /api/v1 URLs correctly during SSR, since axios has no
// browser origin to resolve a relative baseURL against on the server.
// Cached via useAsyncData's key so every component sharing this call only
// hits /settings once.
const FALLBACK = { siteName: 'نیک', logoUrl: '', tagline: '' }

export function useSiteSettings() {
  const { data } = useAsyncData(
    'site-settings',
    () => $fetch('/api/v1/settings').then((r) => r?.data ?? r).catch(() => FALLBACK),
    { default: () => FALLBACK },
  )
  return { settings: data }
}
