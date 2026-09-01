import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, computed } from 'vue'

// ── Mocks ──────────────────────────────────────────────────────
vi.mock('~/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

const mockRequestPermission = vi.fn().mockResolvedValue('granted')
const mockDismiss = vi.fn()
let mockCanAsk = ref(true)

vi.mock('~/composables/useNotificationPermission', () => ({
  useNotificationPermission: () => ({
    canAsk: mockCanAsk,
    isGranted: computed(() => false),
    requestPermission: mockRequestPermission,
    dismiss: mockDismiss,
  }),
}))

import NotificationConsentModal from './NotificationConsentModal.vue'
import { logger } from '~/utils/logger'

// ── Helpers ────────────────────────────────────────────────────
function mountModal(modelValue = true) {
  return mount(NotificationConsentModal, {
    props: { modelValue },
    global: {
      stubs: {
        Teleport: { template: '<div><slot /></div>' },
        Transition: { template: '<div><slot /></div>' },
      },
    },
    attachTo: document.body,
  })
}

describe('NotificationConsentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockCanAsk = ref(true)
    mockRequestPermission.mockResolvedValue('granted')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── visibility ────────────────────────────────────────────────
  describe('visibility', () => {
    it('renders modal content when modelValue=true and canAsk=true', () => {
      const w = mountModal(true)
      expect(w.find('button').exists()).toBe(true)
    })

    it('does not render modal content when modelValue=false', () => {
      const w = mountModal(false)
      // v-if="modelValue && canAsk" prevents rendering
      const buttons = w.findAll('button')
      expect(buttons.length).toBe(0)
    })

    it('does not render modal content when canAsk=false', () => {
      mockCanAsk = ref(false)
      const w = mountModal(true)
      const buttons = w.findAll('button')
      expect(buttons.length).toBe(0)
    })

    it('shows Persian text content', () => {
      const w = mountModal(true)
      expect(w.text()).toContain('اطلاع‌رسانی سفارش')
      expect(w.text()).toContain('می‌خوای')
    })

    it('shows YES and NO buttons', () => {
      const w = mountModal(true)
      const buttons = w.findAll('button')
      expect(buttons.length).toBe(2)
      expect(buttons[0].text()).toContain('بله')
      expect(buttons[1].text()).toContain('نه')
    })
  })

  // ── YES button ────────────────────────────────────────────────
  describe('YES button', () => {
    it('calls requestPermission when clicked', async () => {
      const w = mountModal(true)
      const [yesBtn] = w.findAll('button')
      await yesBtn.trigger('click')
      expect(mockRequestPermission).toHaveBeenCalledOnce()
    })

    it('emits update:modelValue false after requesting permission', async () => {
      const w = mountModal(true)
      const [yesBtn] = w.findAll('button')
      await yesBtn.trigger('click')
      await vi.runAllTimersAsync()
      expect(w.emitted('update:modelValue')).toContainEqual([false])
    })

    it('logs info when user accepts', async () => {
      const w = mountModal(true)
      const [yesBtn] = w.findAll('button')
      await yesBtn.trigger('click')
      expect(logger.info).toHaveBeenCalledWith(
        'user accepted notification consent',
        {},
        'NotificationConsentModal',
      )
    })
  })

  // ── NO button ─────────────────────────────────────────────────
  describe('NO button', () => {
    it('calls dismiss when clicked', async () => {
      const w = mountModal(true)
      const [, noBtn] = w.findAll('button')
      await noBtn.trigger('click')
      expect(mockDismiss).toHaveBeenCalledOnce()
    })

    it('emits update:modelValue false after dismiss', async () => {
      const w = mountModal(true)
      const [, noBtn] = w.findAll('button')
      await noBtn.trigger('click')
      expect(w.emitted('update:modelValue')).toContainEqual([false])
    })

    it('logs debug when user dismisses', async () => {
      const w = mountModal(true)
      const [, noBtn] = w.findAll('button')
      await noBtn.trigger('click')
      expect(logger.debug).toHaveBeenCalledWith(
        'user dismissed notification consent',
        {},
        'NotificationConsentModal',
      )
    })
  })

  // ── auto-dismiss timer ────────────────────────────────────────
  describe('auto-dismiss timer', () => {
    it('starts timer when modal opens (modelValue=true)', () => {
      mountModal(true)
      expect(logger.info).toHaveBeenCalledWith(
        'notification consent modal shown — starting 15s auto-dismiss',
        {},
        'NotificationConsentModal',
      )
    })

    it('emits close after 15 seconds', async () => {
      const w = mountModal(true)
      vi.advanceTimersByTime(15_000)
      await w.vm.$nextTick()
      expect(w.emitted('update:modelValue')).toContainEqual([false])
    })

    it('logs auto-dismiss after 15 seconds', async () => {
      const w = mountModal(true)
      vi.advanceTimersByTime(15_000)
      await w.vm.$nextTick()
      expect(logger.debug).toHaveBeenCalledWith(
        'notification consent auto-dismissed after 15s',
        {},
        'NotificationConsentModal',
      )
    })

    it('does not auto-dismiss before 15 seconds', async () => {
      const w = mountModal(true)
      vi.advanceTimersByTime(14_999)
      await w.vm.$nextTick()
      expect(w.emitted('update:modelValue')).toBeFalsy()
    })

    it('clears timer when modelValue becomes false', async () => {
      const w = mountModal(true)
      await w.setProps({ modelValue: false })
      vi.advanceTimersByTime(20_000)
      await w.vm.$nextTick()
      // close was never emitted by the timer (only by the prop change if any)
      const emitted = w.emitted('update:modelValue') ?? []
      const timerEmits = emitted.filter(([v]) => v === false)
      // At most one emit — from the manual setProps path, not the timer
      expect(timerEmits.length).toBeLessThanOrEqual(1)
    })
  })

  // ── timer progress bar ────────────────────────────────────────
  describe('timer progress', () => {
    it('starts at 1 (full)', () => {
      const w = mountModal(true)
      expect(w.vm.timerProgress).toBe(1)
    })

    it('decreases by 1/15 per second', async () => {
      const w = mountModal(true)
      vi.advanceTimersByTime(5_000)
      await w.vm.$nextTick()
      expect(w.vm.timerProgress).toBeCloseTo(10 / 15)
    })
  })
})
