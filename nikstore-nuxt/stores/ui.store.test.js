import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUiStore } from './ui.store'

describe('useUiStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => vi.useRealTimers())

  describe('addToast', () => {
    it('adds toast with correct fields', () => {
      const ui = useUiStore()
      ui.addToast('عملیات موفق', 'success')
      expect(ui.toasts).toHaveLength(1)
      expect(ui.toasts[0].message).toBe('عملیات موفق')
      expect(ui.toasts[0].type).toBe('success')
      expect(ui.toasts[0].id).toBeTypeOf('number')
    })

    it('removes toast after duration', () => {
      const ui = useUiStore()
      ui.addToast('موقت', 'info', 1000)
      expect(ui.toasts).toHaveLength(1)
      vi.advanceTimersByTime(1000)
      expect(ui.toasts).toHaveLength(0)
    })

    it('supports multiple toasts', () => {
      const ui = useUiStore()
      ui.addToast('اول', 'info')
      ui.addToast('دوم', 'error')
      expect(ui.toasts).toHaveLength(2)
    })
  })

  describe('removeToast', () => {
    it('removes toast by id', () => {
      const ui = useUiStore()
      ui.addToast('test', 'info')
      const id = ui.toasts[0].id
      ui.removeToast(id)
      expect(ui.toasts).toHaveLength(0)
    })

    it('leaves other toasts intact', () => {
      const ui = useUiStore()
      ui.addToast('اول', 'info')
      ui.addToast('دوم', 'error')
      ui.removeToast(ui.toasts[0].id)
      expect(ui.toasts).toHaveLength(1)
      expect(ui.toasts[0].message).toBe('دوم')
    })
  })

  describe('toggleMenu', () => {
    it('toggles isMenuOpen', () => {
      const ui = useUiStore()
      expect(ui.isMenuOpen).toBe(false)
      ui.toggleMenu()
      expect(ui.isMenuOpen).toBe(true)
      ui.toggleMenu()
      expect(ui.isMenuOpen).toBe(false)
    })
  })

  describe('toggleSearch', () => {
    it('toggles isSearchOpen', () => {
      const ui = useUiStore()
      expect(ui.isSearchOpen).toBe(false)
      ui.toggleSearch()
      expect(ui.isSearchOpen).toBe(true)
    })
  })

  describe('markAppReady', () => {
    it('starts as false', () => {
      const ui = useUiStore()
      expect(ui.appReady).toBe(false)
    })

    it('sets appReady to true', () => {
      const ui = useUiStore()
      ui.markAppReady()
      expect(ui.appReady).toBe(true)
    })

    it('is idempotent — calling twice keeps it true', () => {
      const ui = useUiStore()
      ui.markAppReady()
      ui.markAppReady()
      expect(ui.appReady).toBe(true)
    })
  })
})
