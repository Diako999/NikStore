import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('@/services/notification.service', () => ({
  notificationService: {
    broadcast:           vi.fn(),
    sendSms:             vi.fn(),
    getBroadcastLogs:    vi.fn(),
    getSmsLogs:          vi.fn(),
    deleteBroadcastLog:  vi.fn(),
  },
}))

vi.mock('@/utils/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

vi.mock('@/utils/formatters', () => ({
  formatNumber:   (n) => String(n ?? 0),
  formatDateTime: (s) => s ?? '',
  truncate:       (s) => s ?? '',
}))

vi.mock('@/components/common/AdminInput.vue', () => ({
  default: {
    name: 'AdminInput',
    props: ['modelValue', 'label', 'type', 'placeholder', 'dir', 'error'],
    emits: ['update:modelValue'],
    template: `<div>
      <label>{{ label }}</label>
      <input :value="modelValue" :type="type || 'text'" :data-testid="label"
             @input="$emit('update:modelValue', $event.target.value)" />
      <span v-if="error" class="error">{{ error }}</span>
    </div>`,
  },
}))

vi.mock('@/components/common/AdminButton.vue', () => ({
  default: {
    name: 'AdminButton',
    props: ['loading'],
    emits: ['click'],
    template: `<button :disabled="loading" @click="$emit('click')"><slot /></button>`,
  },
}))

vi.mock('@/components/common/AdminTable.vue', () => ({
  default: {
    name: 'AdminTable',
    props: ['columns', 'rows', 'loading', 'skeletonRows', 'emptyText'],
    template: `<div data-stub="AdminTable"><slot /></div>`,
  },
}))

vi.mock('@/components/common/AdminBadge.vue', () => ({
  default: {
    name: 'AdminBadge',
    props: ['variant', 'size'],
    template: `<span data-stub="AdminBadge"><slot /></span>`,
  },
}))

vi.mock('@/components/common/AdminPagination.vue', () => ({
  default: {
    name: 'AdminPagination',
    props: ['modelValue', 'totalPages', 'loading'],
    emits: ['update:modelValue'],
    template: `<div data-stub="AdminPagination"></div>`,
  },
}))

import NotificationsSendView from './NotificationsSendView.vue'
import { notificationService } from '@/services/notification.service'
import { logger } from '@/utils/logger'

const emptyLogsResp = { data: { logs: [], total: 0, totalPages: 1 } }

function mountView() {
  return mount(NotificationsSendView)
}

describe('NotificationsSendView', () => {

  beforeEach(() => {
    vi.clearAllMocks()
    notificationService.getBroadcastLogs.mockResolvedValue(emptyLogsResp)
    notificationService.getSmsLogs.mockResolvedValue(emptyLogsResp)
  })

  // ── tab switching ─────────────────────────────────────────────
  describe('tab switching', () => {
    it('starts on notification tab', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      expect(w.vm.activeTab).toBe('notification')
    })

    it('switches to sms tab on click', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      await w.vm.switchTab('sms')
      expect(w.vm.activeTab).toBe('sms')
    })

    it('switches to broadcast-logs and triggers load', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      // clear initial onMounted calls
      notificationService.getBroadcastLogs.mockClear()
      notificationService.getBroadcastLogs.mockResolvedValue(emptyLogsResp)

      await w.vm.switchTab('broadcast-logs')
      expect(w.vm.activeTab).toBe('broadcast-logs')
    })

    it('switches to sms-logs and triggers load', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      notificationService.getSmsLogs.mockClear()
      notificationService.getSmsLogs.mockResolvedValue(emptyLogsResp)

      await w.vm.switchTab('sms-logs')
      expect(w.vm.activeTab).toBe('sms-logs')
    })
  })

  // ── notification validation ───────────────────────────────────
  describe('notification — validation', () => {
    it('requires title', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.notifForm.body = 'متن'
      await w.vm.handleBroadcast()
      expect(w.vm.notifErrors.title).toBeTruthy()
      expect(notificationService.broadcast).not.toHaveBeenCalled()
    })

    it('requires body', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.notifForm.title = 'عنوان'
      await w.vm.handleBroadcast()
      expect(w.vm.notifErrors.body).toBeTruthy()
      expect(notificationService.broadcast).not.toHaveBeenCalled()
    })

    it('requires targetUserId when target is specific', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.notifForm.target = 'specific'
      w.vm.notifForm.title  = 'عنوان'
      w.vm.notifForm.body   = 'متن'
      await w.vm.handleBroadcast()
      expect(w.vm.notifErrors.targetUserId).toBeTruthy()
      expect(notificationService.broadcast).not.toHaveBeenCalled()
    })
  })

  // ── notification submit ───────────────────────────────────────
  describe('notification — submit', () => {
    it('calls broadcast with correct payload for all users', async () => {
      notificationService.broadcast.mockResolvedValue({ data: { sent: 5 } })
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.notifForm.title = 'تخفیف'
      w.vm.notifForm.body  = 'پیام ویژه'
      w.vm.notifForm.type  = 'promo'
      await w.vm.handleBroadcast()
      const call = notificationService.broadcast.mock.calls[0][0]
      expect(call).not.toHaveProperty('targetUserId')
      expect(call.type).toBe('promo')
    })

    it('includes targetUserId for specific user', async () => {
      notificationService.broadcast.mockResolvedValue({ data: { sent: 1 } })
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.notifForm.target       = 'specific'
      w.vm.notifForm.targetUserId = '64a1f2e3b4c5d6e7f8a9b0c1'
      w.vm.notifForm.title        = 'اعلان'
      w.vm.notifForm.body         = 'متن'
      await w.vm.handleBroadcast()
      expect(notificationService.broadcast).toHaveBeenCalledWith(
        expect.objectContaining({ targetUserId: '64a1f2e3b4c5d6e7f8a9b0c1' }),
      )
    })

    it('shows success with sent count and resets form', async () => {
      notificationService.broadcast.mockResolvedValue({ data: { sent: 12 } })
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.notifForm.title = 'عنوان'
      w.vm.notifForm.body  = 'متن'
      await w.vm.handleBroadcast()
      expect(w.vm.notif.success).toContain('12')
      expect(w.vm.notifForm.title).toBe('')
      expect(logger.info).toHaveBeenCalled()
    })

    it('shows error on API failure', async () => {
      const err = Object.assign(new Error(), { response: { data: { message: 'خطای سرور' } } })
      notificationService.broadcast.mockRejectedValue(err)
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.notifForm.title = 'عنوان'
      w.vm.notifForm.body  = 'متن'
      await w.vm.handleBroadcast()
      expect(w.vm.notif.error).toContain('خطای سرور')
      expect(logger.error).toHaveBeenCalled()
    })

    it('resets loading to false on error', async () => {
      notificationService.broadcast.mockRejectedValue(new Error('net'))
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.notifForm.title = 'عنوان'
      w.vm.notifForm.body  = 'متن'
      await w.vm.handleBroadcast()
      expect(w.vm.notif.loading).toBe(false)
    })
  })

  // ── sms validation ────────────────────────────────────────────
  describe('sms — validation', () => {
    it('requires message', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      await w.vm.handleSendSms()
      expect(w.vm.smsErrors.message).toBeTruthy()
      expect(notificationService.sendSms).not.toHaveBeenCalled()
    })

    it('requires phone when target is specific', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.smsForm.target  = 'specific'
      w.vm.smsForm.message = 'پیامک'
      await w.vm.handleSendSms()
      expect(w.vm.smsErrors.phone).toBeTruthy()
      expect(notificationService.sendSms).not.toHaveBeenCalled()
    })

    it('rejects invalid phone', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.smsForm.target  = 'specific'
      w.vm.smsForm.phone   = '123'
      w.vm.smsForm.message = 'پیامک'
      await w.vm.handleSendSms()
      expect(w.vm.smsErrors.phone).toContain('معتبر نیست')
    })
  })

  // ── sms submit ────────────────────────────────────────────────
  describe('sms — submit', () => {
    it('sends without phone when target=all', async () => {
      notificationService.sendSms.mockResolvedValue({ data: { sent: 20, failed: 0 } })
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.smsForm.message = 'پیامک انبوه'
      await w.vm.handleSendSms()
      expect(notificationService.sendSms.mock.calls[0][0]).not.toHaveProperty('phone')
    })

    it('sends with phone when target=specific', async () => {
      notificationService.sendSms.mockResolvedValue({ data: { sent: 1, failed: 0 } })
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.smsForm.target  = 'specific'
      w.vm.smsForm.phone   = '09121234567'
      w.vm.smsForm.message = 'پیامک'
      await w.vm.handleSendSms()
      expect(notificationService.sendSms).toHaveBeenCalledWith(
        expect.objectContaining({ phone: '09121234567' }),
      )
    })

    it('shows success with sent count', async () => {
      notificationService.sendSms.mockResolvedValue({ data: { sent: 7, failed: 0 } })
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.smsForm.message = 'پیامک'
      await w.vm.handleSendSms()
      expect(w.vm.sms.success).toContain('7')
    })

    it('mentions failed count in success message when some failed', async () => {
      notificationService.sendSms.mockResolvedValue({ data: { sent: 8, failed: 2 } })
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.smsForm.message = 'پیامک'
      await w.vm.handleSendSms()
      expect(w.vm.sms.success).toContain('2')
    })

    it('shows error and logs on failure', async () => {
      const err = Object.assign(new Error(), { response: { data: { message: 'اعتبار ناکافی' } } })
      notificationService.sendSms.mockRejectedValue(err)
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.smsForm.message = 'پیامک'
      await w.vm.handleSendSms()
      expect(w.vm.sms.error).toContain('اعتبار ناکافی')
      expect(logger.error).toHaveBeenCalled()
    })
  })

  // ── history loading ───────────────────────────────────────────
  describe('history — loading', () => {
    it('loads broadcast logs on mount', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      await new Promise(r => setTimeout(r, 10))
      expect(notificationService.getBroadcastLogs).toHaveBeenCalledWith({ page: 1, limit: 10 })
    })

    it('loads sms logs on mount', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      await new Promise(r => setTimeout(r, 10))
      expect(notificationService.getSmsLogs).toHaveBeenCalledWith({ page: 1, limit: 10 })
    })

    it('populates broadcastLogs.items from API', async () => {
      const mockLogs = [{ _id: '1', title: 'تخفیف', body: 'متن', type: 'promo', target: 'all', sent: 50, createdAt: new Date().toISOString() }]
      notificationService.getBroadcastLogs.mockResolvedValue({ data: { logs: mockLogs, total: 1, totalPages: 1 } })
      const w = mountView()
      await new Promise(r => setTimeout(r, 30))
      expect(w.vm.broadcastLogs.items).toHaveLength(1)
      expect(w.vm.broadcastLogs.total).toBe(1)
    })

    it('populates smsLogs.items from API', async () => {
      const mockLogs = [{ _id: '2', target: 'single', phone: '0912****', message: 'پیامک', sent: 1, failed: 0, createdAt: new Date().toISOString() }]
      notificationService.getSmsLogs.mockResolvedValue({ data: { logs: mockLogs, total: 1, totalPages: 1 } })
      const w = mountView()
      await new Promise(r => setTimeout(r, 30))
      expect(w.vm.smsLogs.items).toHaveLength(1)
    })

    it('logs error when broadcast logs fail to load', async () => {
      notificationService.getBroadcastLogs.mockRejectedValue(new Error('network'))
      const w = mountView()
      await new Promise(r => setTimeout(r, 30))
      expect(logger.error).toHaveBeenCalled()
    })

    it('sets broadcastLogs.error on API failure', async () => {
      notificationService.getBroadcastLogs.mockRejectedValue(new Error('network'))
      const w = mountView()
      await new Promise(r => setTimeout(r, 30))
      expect(w.vm.broadcastLogs.error).toBeTruthy()
    })

    it('clears broadcastLogs.error on successful reload', async () => {
      notificationService.getBroadcastLogs.mockRejectedValueOnce(new Error('net'))
      notificationService.getBroadcastLogs.mockResolvedValueOnce(emptyLogsResp)
      const w = mountView()
      await new Promise(r => setTimeout(r, 30))
      expect(w.vm.broadcastLogs.error).toBeTruthy()
      await w.vm.loadBroadcastLogs(1)
      expect(w.vm.broadcastLogs.error).toBe('')
    })

    it('sets smsLogs.error on API failure', async () => {
      notificationService.getSmsLogs.mockRejectedValue(new Error('network'))
      const w = mountView()
      await new Promise(r => setTimeout(r, 30))
      expect(w.vm.smsLogs.error).toBeTruthy()
    })

    it('clears smsLogs.error on successful reload', async () => {
      notificationService.getSmsLogs.mockRejectedValueOnce(new Error('net'))
      notificationService.getSmsLogs.mockResolvedValueOnce(emptyLogsResp)
      const w = mountView()
      await new Promise(r => setTimeout(r, 30))
      expect(w.vm.smsLogs.error).toBeTruthy()
      await w.vm.loadSmsLogs(1)
      expect(w.vm.smsLogs.error).toBe('')
    })

    it('uses API error message in broadcastLogs.error when available', async () => {
      const err = Object.assign(new Error(), { response: { data: { message: 'دسترسی مجاز نیست' } } })
      notificationService.getBroadcastLogs.mockRejectedValue(err)
      const w = mountView()
      await new Promise(r => setTimeout(r, 30))
      expect(w.vm.broadcastLogs.error).toContain('دسترسی مجاز نیست')
    })

    it('logs info with page and total on successful broadcast logs load', async () => {
      notificationService.getBroadcastLogs.mockResolvedValue({ data: { logs: [], total: 5, totalPages: 1 } })
      const w = mountView()
      await new Promise(r => setTimeout(r, 30))
      expect(logger.info).toHaveBeenCalledWith(
        'Broadcast logs loaded',
        expect.objectContaining({ page: 1, total: 5 }),
        'NotificationsSendView',
      )
    })

    it('logs info with page and total on successful SMS logs load', async () => {
      notificationService.getSmsLogs.mockResolvedValue({ data: { logs: [], total: 3, totalPages: 1 } })
      const w = mountView()
      await new Promise(r => setTimeout(r, 30))
      expect(logger.info).toHaveBeenCalledWith(
        'SMS logs loaded',
        expect.objectContaining({ page: 1, total: 3 }),
        'NotificationsSendView',
      )
    })
  })

  // ── helpers ───────────────────────────────────────────────────
  describe('helpers', () => {
    it('typeVariant returns correct variant for each type', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      expect(w.vm.typeVariant('promo')).toBe('success')
      expect(w.vm.typeVariant('system')).toBe('gray')
      expect(w.vm.typeVariant('order_update')).toBe('info')
      expect(w.vm.typeVariant('payment')).toBe('warning')
    })

    it('typeLabel returns Farsi label', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      expect(w.vm.typeLabel('system')).toBe('سیستمی')
      expect(w.vm.typeLabel('promo')).toBe('پروموشن')
    })
  })

  // ── reset ─────────────────────────────────────────────────────
  describe('reset', () => {
    it('resetNotif clears form and messages', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.notifForm.title = 'عنوان'
      w.vm.notif.success   = 'موفق'
      w.vm.resetNotif()
      expect(w.vm.notifForm.title).toBe('')
      expect(w.vm.notif.success).toBe('')
    })

    it('resetSms clears form and messages', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.smsForm.message = 'پیامک'
      w.vm.sms.error       = 'خطا'
      w.vm.resetSms()
      expect(w.vm.smsForm.message).toBe('')
      expect(w.vm.sms.error).toBe('')
    })
  })

  // ── broadcast log delete ───────────────────────────────────────
  describe('handleDeleteBroadcastLog()', () => {
    const mockLogs = [
      { _id: 'aaa', type: 'system', title: 'اعلان ۱', body: 'متن', target: 'all', sent: 3, createdAt: new Date().toISOString() },
      { _id: 'bbb', type: 'promo',  title: 'اعلان ۲', body: 'متن', target: 'all', sent: 5, createdAt: new Date().toISOString() },
    ]

    beforeEach(() => {
      notificationService.getBroadcastLogs.mockResolvedValue({ data: { logs: mockLogs, total: 2, totalPages: 1 } })
      notificationService.deleteBroadcastLog.mockResolvedValue({ data: { deleted: true } })
    })

    it('calls deleteBroadcastLog service with the correct id', async () => {
      const w = mountView()
      await new Promise(r => setTimeout(r, 30))
      await w.vm.handleDeleteBroadcastLog('aaa')
      expect(notificationService.deleteBroadcastLog).toHaveBeenCalledWith('aaa')
    })

    it('removes the deleted row from broadcastLogs.items', async () => {
      const w = mountView()
      await new Promise(r => setTimeout(r, 30))
      expect(w.vm.broadcastLogs.items).toHaveLength(2)
      await w.vm.handleDeleteBroadcastLog('aaa')
      expect(w.vm.broadcastLogs.items).toHaveLength(1)
      expect(w.vm.broadcastLogs.items[0]._id).toBe('bbb')
    })

    it('decrements broadcastLogs.total by 1', async () => {
      const w = mountView()
      await new Promise(r => setTimeout(r, 30))
      expect(w.vm.broadcastLogs.total).toBe(2)
      await w.vm.handleDeleteBroadcastLog('aaa')
      expect(w.vm.broadcastLogs.total).toBe(1)
    })

    it('logs info on successful delete', async () => {
      const w = mountView()
      await new Promise(r => setTimeout(r, 30))
      await w.vm.handleDeleteBroadcastLog('aaa')
      expect(logger.info).toHaveBeenCalledWith(
        'Admin deleted broadcast log',
        { id: 'aaa' },
        'NotificationsSendView',
      )
    })

    it('resets deletingBroadcastId and deleteBroadcastLoading after success', async () => {
      const w = mountView()
      await new Promise(r => setTimeout(r, 30))
      w.vm.deletingBroadcastId = 'aaa'   // refs auto-unwrap on vm
      await w.vm.handleDeleteBroadcastLog('aaa')
      expect(w.vm.deletingBroadcastId).toBeNull()
      expect(w.vm.deleteBroadcastLoading).toBeNull()
    })

    it('logs error and resets state on API failure', async () => {
      const err = Object.assign(new Error(), { response: { data: { message: 'سرور خطا داد' } } })
      notificationService.deleteBroadcastLog.mockRejectedValue(err)
      const w = mountView()
      await new Promise(r => setTimeout(r, 30))
      await w.vm.handleDeleteBroadcastLog('aaa')
      expect(logger.error).toHaveBeenCalledWith(
        'Admin delete broadcast log failed',
        err,
        { id: 'aaa' },
        'NotificationsSendView',
      )
      expect(w.vm.deletingBroadcastId).toBeNull()
      expect(w.vm.deleteBroadcastLoading).toBeNull()
    })

    it('does not remove any item on API failure', async () => {
      notificationService.deleteBroadcastLog.mockRejectedValue(new Error('net'))
      const w = mountView()
      await new Promise(r => setTimeout(r, 30))
      const countBefore = w.vm.broadcastLogs.items.length
      await w.vm.handleDeleteBroadcastLog('aaa')
      expect(w.vm.broadcastLogs.items).toHaveLength(countBefore)
    })

    it('broadcastCols includes an actions column', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      expect(w.vm.broadcastCols.some(c => c.key === 'actions')).toBe(true)
    })
  })
})
