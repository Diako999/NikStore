import { io } from 'socket.io-client'

function resolveSocketUrl() {
  // Production: connect to same origin — Nuxt Nitro proxies /socket.io → backend
  if (process.env.NODE_ENV === 'production') {
    return typeof window !== 'undefined' ? window.location.origin : ''
  }
  // Local dev: connect directly to the running backend
  return 'http://localhost:3000'
}

const SOCKET_NAMESPACE = resolveSocketUrl() + '/notifications'

let socket     = null
let _getToken  = null   // updated on every connect() call; used in auth callback

export const socketService = {
  connect(getToken) {
    // Accept either a getter function (() => token) or a plain token string.
    _getToken = typeof getToken === 'function' ? getToken : () => getToken

    if (socket?.connected) return socket

    socket = io(SOCKET_NAMESPACE, {
      // auth as a callback so socket.io fetches the current token on every
      // reconnection attempt — prevents stale-token auth failures after refresh.
      auth:                 (cb) => cb({ token: _getToken?.() }),
      transports:           ['websocket', 'polling'],
      reconnection:         true,
      reconnectionDelay:    2000,
      reconnectionAttempts: 10,
    })

    socket.on('connect',       ()     => console.info('[Socket] connected', socket.id))
    socket.on('disconnect',    reason => console.warn('[Socket] disconnected', reason))
    socket.on('connect_error', err    => console.error('[Socket] error', err.message))

    return socket
  },

  on(event, handler)  { socket?.on(event, handler)  },
  off(event, handler) { socket?.off(event, handler) },

  disconnect() {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  },

  isConnected() { return socket?.connected ?? false },
}
