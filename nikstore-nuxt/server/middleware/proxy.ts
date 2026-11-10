import { getProxyRequestHeaders, getRequestURL, readRawBody, sendProxy } from 'h3'

const PROXIED_PREFIXES = ['/api/', '/uploads/', '/socket.io/']
const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

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

  // The body is read in full and re-sent by fetch, which computes its own framing. The
  // client's Content-Length / Transfer-Encoding must therefore NOT be forwarded: if the
  // declared length ever differs from the bytes actually sent (or both framings are
  // present), the upstream request is rejected and every POST/PUT comes back as a 502.
  const body = BODY_METHODS.has(event.method) ? await readRawBody(event, false) : undefined
  const headers = getProxyRequestHeaders(event, { host: false })
  delete headers['content-length']
  delete headers['transfer-encoding']
  headers['x-forwarded-host'] = event.node.req.headers.host ?? ''
  headers['x-forwarded-proto'] = forwardedProto

  return sendProxy(event, target, { headers, fetchOptions: { method: event.method, body } })
})
