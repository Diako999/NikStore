import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('~/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import { useApi } from './useApi'
import { logger } from '~/utils/logger'

describe('useApi', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('execute — success', () => {
    it('sets data and returns it', async () => {
      const fn = vi.fn().mockResolvedValue({ data: { id: 1, name: 'محصول' } })
      const { data, loading, error, execute } = useApi(fn)

      const result = await execute('arg1')

      expect(result).toEqual({ id: 1, name: 'محصول' })
      expect(data.value).toEqual({ id: 1, name: 'محصول' })
      expect(error.value).toBeNull()
      expect(loading.value).toBe(false)
      expect(fn).toHaveBeenCalledWith('arg1')
    })

    it('resets error from previous failure', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce({ response: { data: { message: 'خطا' } } })
        .mockResolvedValue({ data: { ok: true } })

      const { error, execute } = useApi(fn)

      await execute().catch(() => {})
      expect(error.value).toBe('خطا')

      await execute()
      expect(error.value).toBeNull()
    })
  })

  describe('execute — failure', () => {
    it('sets error message from response', async () => {
      const axiosErr = { response: { data: { message: 'موجودی کافی نیست' } } }
      const fn = vi.fn().mockRejectedValue(axiosErr)
      const { error, execute } = useApi(fn)

      await expect(execute()).rejects.toEqual(axiosErr)
      expect(error.value).toBe('موجودی کافی نیست')
    })

    it('falls back to generic message when no response body', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('network error'))
      const { error, execute } = useApi(fn)

      await expect(execute()).rejects.toThrow('network error')
      expect(error.value).toBe('خطایی رخ داده است')
    })

    it('calls logger.error with the caught error', async () => {
      const err = new Error('server error')
      const fn = vi.fn().mockRejectedValue(err)
      const { execute } = useApi(fn)

      await execute().catch(() => {})
      expect(logger.error).toHaveBeenCalledWith(
        'useApi: execute failed',
        err,
        expect.objectContaining({ message: 'خطایی رخ داده است' }),
        'useApi',
      )
    })

    it('loading resets to false after failure', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'))
      const { loading, execute } = useApi(fn)

      await execute().catch(() => {})
      expect(loading.value).toBe(false)
    })
  })

  describe('loading state', () => {
    it('is true during execution and false after', async () => {
      let capturedLoading = false
      const fn = vi.fn().mockImplementation(async () => {
        capturedLoading = true
        return { data: {} }
      })
      const { loading, execute } = useApi(fn)

      await execute()
      expect(capturedLoading).toBe(true)
      expect(loading.value).toBe(false)
    })
  })

  describe('multiple args', () => {
    it('forwards all args to the wrapped function', async () => {
      const fn = vi.fn().mockResolvedValue({ data: null })
      const { execute } = useApi(fn)

      await execute('a', 'b', { c: 3 })
      expect(fn).toHaveBeenCalledWith('a', 'b', { c: 3 })
    })
  })
})
