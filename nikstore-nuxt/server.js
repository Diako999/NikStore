import express       from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { spawn }     from 'child_process'
import { fileURLToPath } from 'url'
import path          from 'path'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))

// Wrapper listens on PORT; Nitro SSR runs internally on NITRO_PORT.
const PORT       = parseInt(process.env.PORT       ?? '3000', 10)
const NITRO_PORT = parseInt(process.env.NITRO_PORT ?? '3002', 10)

const API_TARGET   = process.env.API_INTERNAL_URL ?? 'http://localhost:3001'
const NITRO_TARGET = `http://127.0.0.1:${NITRO_PORT}`

console.log(`[nikstore-nuxt] wrapper port=${PORT}  nitro=${NITRO_PORT}  api=${API_TARGET}`)

// ── Start Nitro SSR on internal port ──────────────────────────────────────────
const nitro = spawn('node', ['.output/server/index.mjs'], {
  cwd:   __dirname,
  env:   { ...process.env, PORT: String(NITRO_PORT), HOST: '127.0.0.1' },
  stdio: 'inherit',
})

nitro.on('exit', (code) => {
  console.error(`[nikstore-nuxt] Nitro exited (code=${code}) — wrapper shutting down`)
  process.exit(code ?? 1)
})

function shutdown() { nitro.kill(); process.exit(0) }
process.on('SIGTERM', shutdown)
process.on('SIGINT',  shutdown)

// ── Proxy error handler (same pattern as nikstore-admin) ───────────────────────
function onProxyError(label) {
  return function (err, req, res) {
    console.error(`[nikstore-nuxt] ${label} proxy error: ${req.method ?? 'WS'} ${req.url} → ${err.message}`)
    if (typeof res.writeHead !== 'function') { res.destroy(); return }
    if (res.headersSent) return
    res.writeHead(502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ statusCode: 502, message: 'خطای اتصال به سرور. لطفاً دوباره امتحان کنید.' }))
  }
}

const app = express()

// ── Socket.IO proxy — MUST be first, MUST have ws:true ───────────────────────
// WebSocket upgrade is forwarded to backend; Origin header passes through
// unchanged so the backend CORS check sees the real browser origin.
const socketProxy = createProxyMiddleware({
  target:       API_TARGET,
  changeOrigin: false,   // preserve original Origin so backend CORS passes
  pathFilter:   '/socket.io',
  ws:           true,
  on: { error: onProxyError('socket.io') },
})
app.use(socketProxy)

// ── API proxy ─────────────────────────────────────────────────────────────────
app.use(createProxyMiddleware({
  target:       API_TARGET,
  changeOrigin: true,
  pathFilter:   '/api',
  on: { error: onProxyError('api') },
}))

// ── Uploads proxy ─────────────────────────────────────────────────────────────
app.use(createProxyMiddleware({
  target:       API_TARGET,
  changeOrigin: true,
  pathFilter:   '/uploads',
  on: { error: onProxyError('uploads') },
}))

// ── Nuxt SSR (Nitro) — catch-all ─────────────────────────────────────────────
app.use(createProxyMiddleware({
  target:       NITRO_TARGET,
  changeOrigin: true,
  on: { error: onProxyError('nitro') },
}))

const server = app.listen(PORT, () => {
  console.log(`[nikstore-nuxt] server ready on port ${PORT}`)
})

// Forward raw WebSocket upgrade events so http-proxy-middleware can handle them.
// Express does not expose the upgrade event automatically.
server.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith('/socket.io')) socketProxy.upgrade(req, socket, head)
})
