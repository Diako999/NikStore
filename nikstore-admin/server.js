import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createProxyMiddleware } from 'http-proxy-middleware'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = process.env.PORT || 4001
const API_INTERNAL_URL = process.env.API_INTERNAL_URL || 'http://localhost:3001'

const app = express()

// pathFilter (rather than app.use('/api', proxy)) keeps the /api prefix
// intact when the request is forwarded to the backend.
const apiProxy = createProxyMiddleware({
  target: API_INTERNAL_URL,
  changeOrigin: true,
  pathFilter: ['/api', '/uploads', '/socket.io'],
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
