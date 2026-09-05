import { proxyRequest, getRequestURL } from 'h3'

const PROXIED_PREFIXES = ['/api/', '/uploads/', '/socket.io/']

// Reads API_INTERNAL_URL from runtime config at request time, not baked in
// at build time, so the backend URL can change across environments without
// a rebuild.
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)

  if (!PROXIED_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return

  const config = useRuntimeConfig(event)
  const base = (config.apiInternalUrl as string).replace(/\/$/, '')
  const target = base + url.pathname + url.search

  return proxyRequest(event, target, {
    headers: {
      'x-forwarded-host': event.node.req.headers.host ?? '',
      'x-forwarded-proto': 'https',
    },
  })
})
