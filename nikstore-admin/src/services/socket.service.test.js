import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── mock socket instance ─────────────────────────────────────────────────────
const mockSocket = {
  connected: false,
  id: 'test-socket-id',
  on: vi.fn(),
  off: vi.fn(),
  disconnect: vi.fn(),
}

vi.mock('socket.io-client', () => ({ io: vi.fn(() => mockSocket) }))

vi.mock('@/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

import { io } from 'socket.io-client'
import { logger } from '@/utils/logger'
import { socketService, resolveSocketUrl } from './socket.service'

// ── helpers ─────────────────────────────────────────────────────────────────
function getHandler(event) {
  const call = mockSocket.on.mock.calls.find(([e]) => e === event)
  return call?.[1]
}

// ── tests ────────────────────────────────────────────────────────────────────
describe('resolveSocketUrl', () => {
  it('returns VITE_SOCKET_URL when set', () => {
    const orig = import.meta.env.VITE_SOCKET_URL
    import.meta.env.VITE_SOCKET_URL = 'https://custom.example.com'
    expect(resolveSocketUrl()).toBe('https://custom.example.com')
    import.meta.env.VITE_SOCKET_URL = orig
  })

  it('strips /api/v1 from VITE_API_BASE_URL when no VITE_SOCKET_URL', () => {
    const origSocket = import.meta.env.VITE_SOCKET_URL
    const origApi    = import.meta.env.VITE_API_BASE_URL
    import.meta.env.VITE_SOCKET_URL   = ''
    import.meta.env.VITE_API_BASE_URL = 'https://backend.railway.app/api/v1'
    expect(resolveSocketUrl()).toBe('https://backend.railway.app')
    import.meta.env.VITE_SOCKET_URL   = origSocket
    import.meta.env.VITE_API_BASE_URL = origApi
  })

  it('strips /api (no version) from VITE_API_BASE_URL', () => {
    const origSocket = import.meta.env.VITE_SOCKET_URL
    const origApi    = import.meta.env.VITE_API_BASE_URL
    import.meta.env.VITE_SOCKET_URL   = ''
    import.meta.env.VITE_API_BASE_URL = 'https://backend.railway.app/api'
    expect(resolveSocketUrl()).toBe('https://backend.railway.app')
    import.meta.env.VITE_SOCKET_URL   = origSocket
    import.meta.env.VITE_API_BASE_URL = origApi
  })
})

describe('socketService', () => {
  beforeEach(() => {
    socketService._reset()
    mockSocket.connected = false
    vi.clearAllMocks()
    io.mockReturnValue(mockSocket)
  })

  describe('connect', () => {
    it('calls io() with correct namespace and token auth', () => {
      socketService.connect('user-token-abc')
      expect(io).toHaveBeenCalledWith(
        expect.stringContaining('/notifications'),
        expect.objectContaining({ auth: { token: 'user-token-abc' } }),
      )
    })

    it('logs info before connecting', () => {
      socketService.connect('tok')
      expect(logger.info).toHaveBeenCalledWith(
        'Socket connecting',
        expect.any(Object),
        'SocketService',
      )
    })

    it('registers connect / disconnect / connect_error handlers', () => {
      socketService.connect('tok')
      const events = mockSocket.on.mock.calls.map(([e]) => e)
      expect(events).toContain('connect')
      expect(events).toContain('disconnect')
      expect(events).toContain('connect_error')
    })

    it('returns the existing socket without reconnecting when already connected', () => {
      mockSocket.connected = true
      const first  = socketService.connect('tok')
      const second = socketService.connect('tok')
      expect(io).toHaveBeenCalledTimes(1)
      expect(first).toBe(second)
    })

    it('connect handler logs info with socket id', () => {
      socketService.connect('tok')
      getHandler('connect')()
      expect(logger.info).toHaveBeenCalledWith(
        'Socket connected',
        { id: mockSocket.id },
        'SocketService',
      )
    })

    it('disconnect handler logs warn with reason', () => {
      socketService.connect('tok')
      getHandler('disconnect')('transport close')
      expect(logger.warn).toHaveBeenCalledWith(
        'Socket disconnected',
        { reason: 'transport close' },
        'SocketService',
      )
    })

    it('connect_error handler logs error', () => {
      socketService.connect('tok')
      const err = new Error('websocket error')
      getHandler('connect_error')(err)
      expect(logger.error).toHaveBeenCalledWith(
        'Socket connection error',
        err,
        expect.objectContaining({ url: expect.stringContaining('/notifications') }),
        'SocketService',
      )
    })
  })

  describe('disconnect', () => {
    it('calls socket.disconnect() and clears internal reference', () => {
      socketService.connect('tok')
      socketService.disconnect()
      expect(mockSocket.disconnect).toHaveBeenCalled()
    })

    it('logs info after disconnecting', () => {
      socketService.connect('tok')
      vi.clearAllMocks()
      socketService.disconnect()
      expect(logger.info).toHaveBeenCalledWith(
        'Socket disconnected by client',
        {},
        'SocketService',
      )
    })

    it('does nothing when socket is null', () => {
      socketService.disconnect()
      expect(mockSocket.disconnect).not.toHaveBeenCalled()
    })

    it('allows reconnecting after disconnect', () => {
      socketService.connect('tok')
      socketService.disconnect()
      socketService.connect('tok2')
      expect(io).toHaveBeenCalledTimes(2)
    })
  })

  describe('on / off', () => {
    it('delegates on() to socket', () => {
      socketService.connect('tok')
      const handler = vi.fn()
      socketService.on('new_order', handler)
      expect(mockSocket.on).toHaveBeenCalledWith('new_order', handler)
    })

    it('delegates off() to socket', () => {
      socketService.connect('tok')
      const handler = vi.fn()
      socketService.off('new_order', handler)
      expect(mockSocket.off).toHaveBeenCalledWith('new_order', handler)
    })

    it('on() does nothing when socket is null', () => {
      expect(() => socketService.on('event', vi.fn())).not.toThrow()
    })

    it('off() does nothing when socket is null', () => {
      expect(() => socketService.off('event', vi.fn())).not.toThrow()
    })
  })

  describe('isConnected', () => {
    it('returns false when socket is null', () => {
      expect(socketService.isConnected()).toBe(false)
    })

    it('returns socket.connected value', () => {
      socketService.connect('tok')
      mockSocket.connected = true
      expect(socketService.isConnected()).toBe(true)
      mockSocket.connected = false
      expect(socketService.isConnected()).toBe(false)
    })
  })
})
