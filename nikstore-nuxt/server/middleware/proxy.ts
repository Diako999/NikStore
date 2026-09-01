import { proxyRequest, getRequestURL } from 'h3'

const PROXIED_PREFIXES = ['/api/', '/uploads/', '/socket.io/']

// Runtime proxy — reads API_INTERNAL_URL from env at server startup,
// not baked in at build time like nuxt.config.ts routeRules would be.
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)

  if (!PROXIED_PREFIXES.some((p) => url.pathname.startsWith(p))) return

  const config = useRuntimeConfig(event)
  const base   = (config.apiInternalUrl as string).replace(/\/$/, '')
  const target = base + url.pathname + url.search

  return proxyRequest(event, target, {
    headers: {
      'x-forwarded-host':  event.node.req.headers.host ?? '',
      'x-forwarded-proto': 'https',
    },
  })
})
