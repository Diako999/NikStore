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

  // x-forwarded-proto is only trustworthy from our own reverse proxy (nginx,
  // always on loopback — Nuxt's port is firewalled off from the outside). A
  // client can set this header directly, so never honor it from anyone else.
  const socket = event.node.req.socket as { encrypted?: boolean; remoteAddress?: string }
  const TRUSTED_PROXY_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])
  const fromTrustedProxy = TRUSTED_PROXY_ADDRESSES.has(socket.remoteAddress ?? '')
  const forwardedProto =
    fromTrustedProxy && event.node.req.headers['x-forwarded-proto']
      ? (event.node.req.headers['x-forwarded-proto'] as string)
      : (socket.encrypted ? 'https' : 'http')

  return proxyRequest(event, target, {
    headers: {
      'x-forwarded-host': event.node.req.headers.host ?? '',
      'x-forwarded-proto': forwardedProto,
    },
  })
})
