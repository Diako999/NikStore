import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoisted mock — persists across vi.resetModules() calls
vi.mock('~/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

const STORAGE_KEY = 'notif_asked'

/**
 * Load a fresh module with the given Notification.permission state.
 * vi.resetModules() ensures the module-level `permission` ref starts fresh.
 */
async function setup(permission = 'default', returnOnRequest = 'granted') {
  vi.resetModules()
  const requestPermission = vi.fn().mockResolvedValue(returnOnRequest)
  Object.defineProperty(window, 'Notification', {
    configurable: true,
    writable: true,
    value: { permission, requestPermission },
  })
  const mod = await import('./useNotificationPermission')
  return { ...mod, nativeRequest: requestPermission }
}

async function setupNoApi() {
  vi.resetModules()
  // Ensure property is configurable so we can delete it
  Object.defineProperty(window, 'Notification', { configurable: true, writable: true, value: undefined })
  delete window.Notification  // makes 'Notification' in window === false
  return import('./useNotificationPermission')
}

describe('useNotificationPermission', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  // ── canAsk ─────────────────────────────────────────────────────
  describe('canAsk', () => {
    it('is true when permission=default and localStorage is empty', async () => {
      const { useNotificationPermission } = await setup('default')
      const { canAsk } = useNotificationPermission()
      expect(canAsk.value).toBe(true)
    })

    it('is false when notif_asked is in localStorage', async () => {
      localStorage.setItem(STORAGE_KEY, '1')
      const { useNotificationPermission } = await setup('default')
      const { canAsk } = useNotificationPermission()
      expect(canAsk.value).toBe(false)
    })

    it('is false when permission=granted', async () => {
      const { useNotificationPermission } = await setup('granted')
      const { canAsk } = useNotificationPermission()
      expect(canAsk.value).toBe(false)
    })

    it('is false when permission=denied', async () => {
      const { useNotificationPermission } = await setup('denied')
      const { canAsk } = useNotificationPermission()
      expect(canAsk.value).toBe(false)
    })

    it('is false when Notification API is absent', async () => {
      const { useNotificationPermission } = await setupNoApi()
      const { canAsk } = useNotificationPermission()
      expect(canAsk.value).toBe(false)
    })
  })

  // ── isGranted ──────────────────────────────────────────────────
  describe('isGranted', () => {
    it('is false when permission=default', async () => {
      const { useNotificationPermission } = await setup('default')
      const { isGranted } = useNotificationPermission()
      expect(isGranted.value).toBe(false)
    })

    it('is true when permission=granted', async () => {
      const { useNotificationPermission } = await setup('granted')
      const { isGranted } = useNotificationPermission()
      expect(isGranted.value).toBe(true)
    })

    it('is false when permission=denied', async () => {
      const { useNotificationPermission } = await setup('denied')
      const { isGranted } = useNotificationPermission()
      expect(isGranted.value).toBe(false)
    })

    it('is false when Notification API is absent', async () => {
      const { useNotificationPermission } = await setupNoApi()
      const { isGranted } = useNotificationPermission()
      expect(isGranted.value).toBe(false)
    })
  })

  // ── requestPermission ──────────────────────────────────────────
  describe('requestPermission()', () => {
    it('calls Notification.requestPermission', async () => {
      const { useNotificationPermission, nativeRequest } = await setup()
      const { requestPermission } = useNotificationPermission()
      await requestPermission()
      expect(nativeRequest).toHaveBeenCalledOnce()
    })

    it('sets notif_asked in localStorage before calling native API', async () => {
      const { useNotificationPermission, nativeRequest } = await setup()
      nativeRequest.mockImplementationOnce(async () => {
        expect(localStorage.getItem(STORAGE_KEY)).toBe('1')
        return 'granted'
      })
      const { requestPermission } = useNotificationPermission()
      await requestPermission()
    })

    it('returns the result from Notification.requestPermission', async () => {
      const { useNotificationPermission } = await setup('default', 'denied')
      const { requestPermission } = useNotificationPermission()
      const result = await requestPermission()
      expect(result).toBe('denied')
    })

    it('updates isGranted to true when result is granted', async () => {
      const { useNotificationPermission } = await setup('default', 'granted')
      const { requestPermission, isGranted } = useNotificationPermission()
      await requestPermission()
      expect(isGranted.value).toBe(true)
    })

    it('leaves isGranted false when result is denied', async () => {
      const { useNotificationPermission } = await setup('default', 'denied')
      const { requestPermission, isGranted } = useNotificationPermission()
      await requestPermission()
      expect(isGranted.value).toBe(false)
    })

    it('makes canAsk false after granting (alreadyAsked=true)', async () => {
      const { useNotificationPermission } = await setup()
      const { requestPermission, canAsk } = useNotificationPermission()
      expect(canAsk.value).toBe(true)
      await requestPermission()
      expect(canAsk.value).toBe(false)
    })

    it('returns "denied" immediately when Notification API is absent', async () => {
      const { useNotificationPermission } = await setupNoApi()
      const { requestPermission } = useNotificationPermission()
      const result = await requestPermission()
      expect(result).toBe('denied')
    })
  })

  // ── dismiss ────────────────────────────────────────────────────
  describe('dismiss()', () => {
    it('sets notif_asked in localStorage', async () => {
      const { useNotificationPermission } = await setup()
      const { dismiss } = useNotificationPermission()
      dismiss()
      expect(localStorage.getItem(STORAGE_KEY)).toBe('1')
    })

    it('makes canAsk false after dismiss', async () => {
      const { useNotificationPermission } = await setup()
      const { dismiss, canAsk } = useNotificationPermission()
      expect(canAsk.value).toBe(true)
      dismiss()
      expect(canAsk.value).toBe(false)
    })

    it('does not change isGranted', async () => {
      const { useNotificationPermission } = await setup()
      const { dismiss, isGranted } = useNotificationPermission()
      dismiss()
      expect(isGranted.value).toBe(false)
    })
  })

  // ── shared singleton ───────────────────────────────────────────
  describe('shared module-level state', () => {
    it('two composable instances share the same permission ref', async () => {
      const { useNotificationPermission } = await setup('default', 'granted')
      const a = useNotificationPermission()
      const b = useNotificationPermission()
      await a.requestPermission()
      expect(b.isGranted.value).toBe(true)
    })
  })
})
