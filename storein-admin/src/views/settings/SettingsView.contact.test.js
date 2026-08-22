import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/services/settings.service', () => ({
  settingsService: {
    get:    vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('@/services/upload.service', () => ({
  uploadService: { uploadImage: vi.fn() },
}))

vi.mock('@/utils/logger', () => ({
  logger: { info: vi.fn(), debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

vi.mock('@/stores/ui.store', () => ({
  useUiStore: () => ({ addToast: vi.fn() }),
}))

vi.mock('@/components/common/AdminInput.vue', () => ({
  default: {
    name: 'AdminInput',
    props: ['modelValue', 'label', 'placeholder', 'dir', 'hint', 'class'],
    emits: ['update:modelValue'],
    template: `<div><label>{{ label }}</label><input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" /></div>`,
  },
}))

vi.mock('@/components/common/AdminTextarea.vue', () => ({
  default: {
    name: 'AdminTextarea',
    props: ['modelValue', 'label', 'placeholder', 'rows', 'hint', 'class'],
    emits: ['update:modelValue'],
    template: `<div><label>{{ label }}</label><textarea :value="modelValue" @input="$emit('update:modelValue', $event.target.value)"></textarea></div>`,
  },
}))

vi.mock('@/components/common/AdminButton.vue', () => ({
  default: {
    name: 'AdminButton',
    props: ['loading', 'disabled', 'variant', 'size'],
    emits: ['click'],
    template: `<button :disabled="loading || disabled" @click="$emit('click')"><slot /></button>`,
  },
}))

vi.mock('@/components/common/AdminSkeleton.vue', () => ({
  default: { name: 'AdminSkeleton', props: ['height'], template: '<div />' },
}))

import SettingsView from './SettingsView.vue'
import { settingsService } from '@/services/settings.service'
import { logger } from '@/utils/logger'

const baseSettings = {
  siteName: 'نیک', tagline: '', logoUrl: '', faviconUrl: '',
  description: '', keywords: '', ogImage: '',
  social: { instagram: '', telegram: '', twitter: '', whatsapp: '', linkedin: '', youtube: '' },
  footerTagline: '', footerCopyright: '', footerLinks: [],
  phone: '08733177189', mobiles: [], email: 'test@nikstore.ir',
  addresses: [],  // [{ text, mapsUrl }]
  payment: { gateway: 'mock', zarinpalMerchantId: '', zarinpalSandbox: true },
  sms: { provider: 'mock', kavenegarApiKey: '', kavenegarSender: '', kavenegarOtpTemplate: '' },
  trustItems: [], announcementBar: { isActive: false, text: '', bgColor: '#3b82f6', textColor: '#ffffff', link: '' },
}

async function mountView(settingsOverrides = {}) {
  settingsService.get.mockResolvedValue({ data: { ...baseSettings, ...settingsOverrides } })
  setActivePinia(createPinia())
  const wrapper = mount(SettingsView, { global: { plugins: [createPinia()] } })
  await wrapper.vm.$nextTick()
  await wrapper.vm.$nextTick()
  return wrapper
}

describe('SettingsView — contact tab', () => {
  beforeEach(() => vi.clearAllMocks())

  // ── load ─────────────────────────────────────────────────────
  describe('loading contact data', () => {
    it('populates form.phone from API response', async () => {
      const wrapper = await mountView({ phone: '08733177189' })
      expect(wrapper.vm.form.phone).toBe('08733177189')
    })

    it('populates form.mobiles from API array', async () => {
      const wrapper = await mountView({ mobiles: ['09121111111', '09122222222'] })
      expect(wrapper.vm.form.mobiles).toHaveLength(2)
      expect(wrapper.vm.form.mobiles[0].value).toBe('09121111111')
      expect(wrapper.vm.form.mobiles[1].value).toBe('09122222222')
    })

    it('populates form.addresses from API array of objects', async () => {
      const wrapper = await mountView({
        addresses: [
          { text: 'تهران، ولیعصر', mapsUrl: 'https://maps.google.com/?q=35,51' },
          { text: 'مشهد، احمدآباد', mapsUrl: '' },
        ],
      })
      expect(wrapper.vm.form.addresses).toHaveLength(2)
      expect(wrapper.vm.form.addresses[0].text).toBe('تهران، ولیعصر')
      expect(wrapper.vm.form.addresses[0].mapsUrl).toBe('https://maps.google.com/?q=35,51')
    })

    it('migrates legacy address string to addresses array', async () => {
      const wrapper = await mountView({ addresses: undefined, address: 'سنندج - بازار روز' })
      expect(wrapper.vm.form.addresses).toHaveLength(1)
      expect(wrapper.vm.form.addresses[0].text).toBe('سنندج - بازار روز')
      expect(wrapper.vm.form.addresses[0].mapsUrl).toBe('')
    })

    it('starts with empty mobiles when API returns empty array', async () => {
      const wrapper = await mountView({ mobiles: [] })
      expect(wrapper.vm.form.mobiles).toHaveLength(0)
    })

    it('logs loading info on mount', async () => {
      await mountView()
      expect(logger.info).toHaveBeenCalledWith(
        'settings: loading site settings', {}, 'SettingsView',
      )
    })
  })

  // ── addMobile / removeMobile ──────────────────────────────────
  describe('addMobile', () => {
    it('appends an empty mobile entry', async () => {
      const wrapper = await mountView()
      wrapper.vm.addMobile()
      expect(wrapper.vm.form.mobiles).toHaveLength(1)
      expect(wrapper.vm.form.mobiles[0].value).toBe('')
    })

    it('can add multiple mobile entries', async () => {
      const wrapper = await mountView()
      wrapper.vm.addMobile()
      wrapper.vm.addMobile()
      expect(wrapper.vm.form.mobiles).toHaveLength(2)
    })

    it('logs debug when mobile is added', async () => {
      const wrapper = await mountView()
      wrapper.vm.addMobile()
      expect(logger.debug).toHaveBeenCalledWith(
        'settings: mobile field added',
        expect.objectContaining({ count: 1 }),
        'SettingsView',
      )
    })
  })

  describe('removeMobile', () => {
    it('removes mobile at given index', async () => {
      const wrapper = await mountView({ mobiles: ['09121111111', '09122222222'] })
      wrapper.vm.removeMobile(0)
      expect(wrapper.vm.form.mobiles).toHaveLength(1)
      expect(wrapper.vm.form.mobiles[0].value).toBe('09122222222')
    })

    it('logs debug when mobile is removed', async () => {
      const wrapper = await mountView({ mobiles: ['09121111111'] })
      wrapper.vm.removeMobile(0)
      expect(logger.debug).toHaveBeenCalledWith(
        'settings: mobile field removed',
        expect.objectContaining({ idx: 0 }),
        'SettingsView',
      )
    })
  })

  // ── addAddress / removeAddress ────────────────────────────────
  describe('addAddress', () => {
    it('appends an empty address entry with text and mapsUrl', async () => {
      const wrapper = await mountView()
      wrapper.vm.addAddress()
      expect(wrapper.vm.form.addresses).toHaveLength(1)
      expect(wrapper.vm.form.addresses[0].text).toBe('')
      expect(wrapper.vm.form.addresses[0].mapsUrl).toBe('')
    })

    it('logs debug when address is added', async () => {
      const wrapper = await mountView()
      wrapper.vm.addAddress()
      expect(logger.debug).toHaveBeenCalledWith(
        'settings: address field added',
        expect.objectContaining({ count: 1 }),
        'SettingsView',
      )
    })
  })

  describe('removeAddress', () => {
    it('removes address at given index', async () => {
      const wrapper = await mountView({ addresses: [
        { text: 'آدرس اول', mapsUrl: '' },
        { text: 'آدرس دوم', mapsUrl: '' },
      ]})
      wrapper.vm.removeAddress(0)
      expect(wrapper.vm.form.addresses).toHaveLength(1)
      expect(wrapper.vm.form.addresses[0].text).toBe('آدرس دوم')
    })
  })

  // ── saveAll DTO ───────────────────────────────────────────────
  describe('saveAll — contact fields in DTO', () => {
    it('sends mobiles as trimmed string array (empty entries filtered)', async () => {
      settingsService.update.mockResolvedValue({ data: baseSettings })
      const wrapper = await mountView()
      wrapper.vm.form.mobiles = [{ value: '09121111111' }, { value: '  ' }, { value: '09122222222' }]
      await wrapper.vm.saveAll()
      const dto = settingsService.update.mock.calls[0][0]
      expect(dto.mobiles).toEqual(['09121111111', '09122222222'])
    })

    it('sends addresses as object array (empty text entries filtered)', async () => {
      settingsService.update.mockResolvedValue({ data: baseSettings })
      const wrapper = await mountView()
      wrapper.vm.form.addresses = [
        { text: 'تهران، ولیعصر', mapsUrl: '35.328,47.002' },
        { text: '', mapsUrl: '' },
      ]
      await wrapper.vm.saveAll()
      const dto = settingsService.update.mock.calls[0][0]
      expect(dto.addresses).toHaveLength(1)
      expect(dto.addresses[0].text).toBe('تهران، ولیعصر')
      expect(dto.addresses[0].mapsUrl).toBe('https://maps.google.com/?q=35.328,47.002')
    })

    it('normalizeMapsUrl converts bare coords to google maps URL', async () => {
      const wrapper = await mountView()
      expect(wrapper.vm.normalizeMapsUrl('35.32869, 47.002226')).toBe('https://maps.google.com/?q=35.32869,47.002226')
    })

    it('normalizeMapsUrl passes through full URLs unchanged', async () => {
      const wrapper = await mountView()
      const url = 'https://maps.google.com/?q=35,47'
      expect(wrapper.vm.normalizeMapsUrl(url)).toBe(url)
    })

    it('normalizeMapsUrl returns empty string for empty input', async () => {
      const wrapper = await mountView()
      expect(wrapper.vm.normalizeMapsUrl('')).toBe('')
    })

    it('logs save info with mobiles/addresses counts', async () => {
      settingsService.update.mockResolvedValue({ data: baseSettings })
      const wrapper = await mountView()
      wrapper.vm.form.mobiles   = [{ value: '09121111111' }]
      wrapper.vm.form.addresses = [{ text: 'تهران', mapsUrl: '' }, { text: 'مشهد', mapsUrl: '' }]
      await wrapper.vm.saveAll()
      expect(logger.info).toHaveBeenCalledWith(
        'settings: saving site settings',
        { mobiles: 1, addresses: 2 },
        'SettingsView',
      )
    })
  })
})
