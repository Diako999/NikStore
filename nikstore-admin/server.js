import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createProxyMiddleware } from 'http-proxy-middleware'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = process.env.PORT || 4001
const API_INTERNAL_URL = process.env.API_INTERNAL_URL || 'http://localhost:3001'

const app = express()

// The installed http-proxy-middleware major version (2.x) has no `pathFilter`
// option at all — that key is silently ignored, so this was proxying every
// request (including '/', SPA routes, and static assets) straight to the
// backend. v2's own filtering API takes the path list as the first
// positional argument instead — this is what actually restricts the proxy
// to /api, /uploads, /socket.io, leaving the SPA and static files alone.
const apiProxy = createProxyMiddleware(['/api', '/uploads', '/socket.io'], {
  target: API_INTERNAL_URL,
  changeOrigin: true,
  ws: true,
})

app.use(apiProxy)

app.use(express.static(path.join(__dirname, 'dist')))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

const server = app.listen(PORT, () => {
  console.log(`nikstore-admin listening on port ${PORT}`)
})

// Express never exposes the raw HTTP "upgrade" event on its own, so
// WebSocket traffic (Socket.IO) has to be wired to the proxy by hand.
server.on('upgrade', apiProxy.upgrade)
