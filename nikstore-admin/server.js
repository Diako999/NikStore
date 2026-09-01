import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app  = express()
const PORT = process.env.PORT || 4000

// Railway: set API_INTERNAL_URL to the backend private URL (Railway internal networking).
// e.g. http://nikstore.railway.internal:3000
const API_TARGET =
  process.env.API_INTERNAL_URL ||
  process.env.VITE_API_BASE_URL?.replace(/\/api(\/v\d+)?\/?$/, '') ||
  'http://localhost:3001'

console.log(`[nikstore-admin] port=${PORT}  proxy-target=${API_TARGET}`)

if (!process.env.API_INTERNAL_URL && !process.env.VITE_API_BASE_URL) {
  console.warn('[nikstore-admin] WARNING: API_INTERNAL_URL is not set — proxy will target localhost:3001')
}

// Shared error handler for both HTTP and WebSocket proxy errors.
// For WebSocket upgrades, `res` is a net.Socket (no writeHead/headersSent).
// Calling writeHead on a socket causes TypeError and corrupts the proxy state.
function onProxyError(label) {
  return function (err, req, res) {
    console.error(`[nikstore-admin] ${label} proxy error: ${req.method ?? 'WS'} ${req.url} → ${err.message}`)
    if (typeof res.writeHead !== 'function') {
      // WebSocket upgrade failure — destroy the socket cleanly
      res.destroy()
      return
    }
    if (res.headersSent) return
    res.writeHead(502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      statusCode: 502,
      message:    'پروکسی نتوانست به سرور متصل شود. لطفاً بعداً دوباره امتحان کنید.',
    }))
  }
}

// ── Uploads proxy ─────────────────────────────────────────────────────────────
// Images live on the backend; /uploads/* must be forwarded so <img src="/uploads/...">
// works when the admin SPA is served from a different origin than the API.
app.use(createProxyMiddleware({
  target:       API_TARGET,
  changeOrigin: true,
  pathFilter:   '/uploads',
  on: { error: onProxyError('uploads') },
}))

// ── Socket.IO proxy — MUST be before static files, MUST have ws:true ──────────
// Socket.IO connects to /socket.io on THIS domain; proxy forwards the WebSocket
// upgrade to the backend. This is how Safari/Firefox cross-origin cookie issues
// are avoided: the browser sees same-origin WebSocket traffic.
const socketProxy = createProxyMiddleware({
  target:       API_TARGET,
  changeOrigin: true,
  pathFilter:   '/socket.io',
  ws:           true,
  on: { error: onProxyError('socket.io') },
})
app.use(socketProxy)

// ── REST API proxy ─────────────────────────────────────────────────────────────
// IMPORTANT: use pathFilter (NOT app.use('/api', proxy)).
// app.use('/api', proxy) strips the /api prefix before forwarding →
// backend sees /v1/auth/change-password instead of /api/v1/auth/change-password → 404.
const apiProxy = createProxyMiddleware({
  target:       API_TARGET,
  changeOrigin: true,
  pathFilter:   '/api',
  on: { error: onProxyError('api') },
})
app.use(apiProxy)

// ── Static SPA ─────────────────────────────────────────────────────────────────
const distPath = path.join(__dirname, 'dist')
app.use(express.static(distPath))

// Regex catch-all for Express 5 compatibility (app.get('*') syntax changed in v5)
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

const server = app.listen(PORT, () => {
  console.log(`[nikstore-admin] server ready on port ${PORT}`)
})

// Forward raw WebSocket upgrade events to the socket proxy.
// http-proxy-middleware needs access to the raw http.Server upgrade event
// to perform the WebSocket handshake; Express doesn't expose this automatically.
server.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith('/socket.io')) socketProxy.upgrade(req, socket, head)
})
