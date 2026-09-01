import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('~/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import { useTheme } from './useTheme'

describe('useTheme', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('style')
  })

  afterEach(() => vi.restoreAllMocks())

  describe('applyFromSettings()', () => {
    it('sets primaryColor CSS variable when provided', () => {
      const { applyFromSettings } = useTheme()
      applyFromSettings({ primaryColor: '#FF5733' })
      const brandRgb = document.documentElement.style.getPropertyValue('--color-brand-rgb')
      expect(brandRgb).toBeTruthy()
    })

    it('ignores invalid hex colors', () => {
      const { applyFromSettings } = useTheme()
      const before = document.documentElement.style.getPropertyValue('--color-brand-rgb')
      applyFromSettings({ primaryColor: 'not-a-color' })
      const after = document.documentElement.style.getPropertyValue('--color-brand-rgb')
      expect(after).toBe(before)
    })

    it('does nothing when called with null', () => {
      const { applyFromSettings } = useTheme()
      expect(() => applyFromSettings(null)).not.toThrow()
    })
  })
})
