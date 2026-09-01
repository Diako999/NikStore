import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('~/utils/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}))

vi.mock('vue-router', () => ({
  RouterLink: {
    name: 'RouterLink',
    props: ['to'],
    template: '<a :href="JSON.stringify(to)"><slot /></a>',
  },
  useRouter: () => ({}),
  useRoute:  () => ({}),
}))

vi.mock('~/stores/settings.store', async () => {
  const { defineStore } = await import('pinia')
  return {
    useSettingsStore: defineStore('settings', {
      state: () => ({
        siteName:        'نیک',
        logoUrl:         '',
        tagline:         'فروشگاه تخصصی عینک',
        footerTagline:   '',
        footerCopyright: 'تمامی حقوق محفوظ است',
        footerLinks:     [],
        email:     'test@nikstore.ir',
        phone:     '09123456789',
        mobiles:   [],
        address:   '',
        addresses: [],
        social: {
          instagram: '',
          telegram:  '',
          whatsapp:  '',
          twitter:   '',
          linkedin:  '',
          youtube:   '',
        },
      }),
    }),
  }
})

import AppFooter from './AppFooter.vue'
import { useSettingsStore } from '~/stores/settings.store'

function factory(storeOverrides = {}) {
  setActivePinia(createPinia())
  const store = useSettingsStore()
  Object.assign(store, storeOverrides)
  return mount(AppFooter, { global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } } })
}

describe('AppFooter', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('brand column', () => {
    it('renders siteName text when no logoUrl', () => {
      const wrapper = factory({ siteName: 'نیک', logoUrl: '' })
      expect(wrapper.text()).toContain('نیک')
    })

    it('renders logo img when logoUrl is set', () => {
      const wrapper = factory({ logoUrl: 'https://cdn.test/logo.png', siteName: 'نیک' })
      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('https://cdn.test/logo.png')
    })

    it('shows footerTagline when set (takes priority over tagline)', () => {
      const wrapper = factory({ tagline: 'شعار اصلی', footerTagline: 'شعار فوتر خاص' })
      expect(wrapper.text()).toContain('شعار فوتر خاص')
    })

    it('falls back to tagline when footerTagline is empty', () => {
      const wrapper = factory({ tagline: 'فروشگاه عینک طبی و آفتابی', footerTagline: '' })
      expect(wrapper.text()).toContain('فروشگاه عینک طبی و آفتابی')
    })
  })

  describe('social links', () => {
    it('hides all social icons when all URLs are empty', () => {
      const wrapper = factory()
      expect(wrapper.find('[data-testid="social-instagram"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="social-telegram"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="social-whatsapp"]').exists()).toBe(false)
    })

    it('shows only the social icons that have a URL set', () => {
      const wrapper = factory({ social: { instagram: 'https://instagram.com/test', telegram: '', whatsapp: '', twitter: '', linkedin: '', youtube: '' } })
      expect(wrapper.find('[data-testid="social-instagram"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="social-telegram"]').exists()).toBe(false)
    })

    it('social link has correct href', () => {
      const wrapper = factory({ social: { telegram: 'https://t.me/nikstore', instagram: '', whatsapp: '', twitter: '', linkedin: '', youtube: '' } })
      const link = wrapper.find('[data-testid="social-telegram"]')
      expect(link.attributes('href')).toBe('https://t.me/nikstore')
    })

    it('social links open in new tab with rel=noopener', () => {
      const wrapper = factory({ social: { whatsapp: 'https://wa.me/123', instagram: '', telegram: '', twitter: '', linkedin: '', youtube: '' } })
      const link = wrapper.find('[data-testid="social-whatsapp"]')
      expect(link.attributes('target')).toBe('_blank')
      expect(link.attributes('rel')).toBe('noopener')
    })
  })

  describe('categories column', () => {
    it('renders the categories heading', () => {
      const wrapper = factory()
      expect(wrapper.find('[data-testid="heading-categories"]').text()).toBe('دسته‌بندی‌ها')
    })

    it('renders all 4 footer categories', () => {
      const wrapper = factory()
      const links = wrapper.findAll('a')
      const texts = links.map(l => l.text())
      expect(texts).toContain('عینک آفتابی')
      expect(texts).toContain('عینک طبی')
      expect(texts).toContain('لنز طبی')
      expect(texts).toContain('لوازم جانبی')
    })
  })

  describe('quick links / footer links', () => {
    it('shows default quick links when footerLinks is empty', () => {
      const wrapper = factory({ footerLinks: [] })
      expect(wrapper.text()).toContain('دسترسی سریع')
    })

    it('shows custom footerLinks when provided', () => {
      const wrapper = factory({ footerLinks: [{ url: '/blog', label: 'وبلاگ' }, { url: '/faq', label: 'سوالات متداول' }] })
      expect(wrapper.text()).toContain('لینک‌های سریع')
      expect(wrapper.text()).toContain('وبلاگ')
      expect(wrapper.text()).toContain('سوالات متداول')
    })

    it('custom footer link href is set correctly', () => {
      const wrapper = factory({ footerLinks: [{ url: 'https://blog.nikstore.ir', label: 'وبلاگ' }] })
      const link = wrapper.findAll('a').find(a => a.text() === 'وبلاگ')
      expect(link?.attributes('href')).toBe('https://blog.nikstore.ir')
    })
  })

  describe('contact section', () => {
    it('shows store email', () => {
      const wrapper = factory({ email: 'hello@nikstore.ir' })
      expect(wrapper.find('[data-testid="contact-email"]').text()).toContain('hello@nikstore.ir')
    })

    it('falls back to default email when store.email is empty', () => {
      const wrapper = factory({ email: '' })
      expect(wrapper.find('[data-testid="contact-email"]').text()).toContain('support@nikstore.ir')
    })

    it('shows store phone', () => {
      const wrapper = factory({ phone: '08733177189' })
      expect(wrapper.find('[data-testid="contact-phone"]').text()).toContain('08733177189')
    })

    it('shows single address text', () => {
      const wrapper = factory({ addresses: [{ text: 'کردستان - سنندج', mapsUrl: '' }] })
      expect(wrapper.find('[data-testid="contact-address-0"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="contact-address-0"]').text()).toContain('کردستان - سنندج')
    })

    it('uses mapsUrl as href when provided', () => {
      const mapsUrl = 'https://maps.google.com/?q=35.328,47.002'
      const wrapper = factory({ addresses: [{ text: 'سنندج', mapsUrl }] })
      const link = wrapper.find('[data-testid="contact-address-0"] a')
      expect(link.attributes('href')).toBe(mapsUrl)
    })

    it('falls back to text-based google maps link when mapsUrl is empty', () => {
      const wrapper = factory({ addresses: [{ text: 'سنندج', mapsUrl: '' }] })
      const link = wrapper.find('[data-testid="contact-address-0"] a')
      expect(link.attributes('href')).toContain('maps.google.com')
      expect(link.attributes('href')).toContain(encodeURIComponent('سنندج'))
    })

    it('shows multiple addresses', () => {
      const wrapper = factory({ addresses: [
        { text: 'آدرس اول', mapsUrl: '' },
        { text: 'آدرس دوم', mapsUrl: '' },
      ]})
      expect(wrapper.find('[data-testid="contact-address-0"]').text()).toContain('آدرس اول')
      expect(wrapper.find('[data-testid="contact-address-1"]').text()).toContain('آدرس دوم')
    })

    it('hides address items when addresses array is empty', () => {
      const wrapper = factory({ addresses: [] })
      expect(wrapper.find('[data-testid="contact-address-0"]').exists()).toBe(false)
    })

    it('shows single mobile via mobiles array', () => {
      const wrapper = factory({ mobiles: ['09121234567'] })
      expect(wrapper.find('[data-testid="contact-mobile-0"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="contact-mobile-0"]').text()).toContain('09121234567')
    })

    it('shows multiple mobiles when mobiles array has several items', () => {
      const wrapper = factory({ mobiles: ['09121111111', '09122222222'] })
      expect(wrapper.find('[data-testid="contact-mobile-0"]').text()).toContain('09121111111')
      expect(wrapper.find('[data-testid="contact-mobile-1"]').text()).toContain('09122222222')
    })

    it('hides mobile items when mobiles array is empty', () => {
      const wrapper = factory({ mobiles: [] })
      expect(wrapper.find('[data-testid="contact-mobile-0"]').exists()).toBe(false)
    })
  })

  describe('trust badges', () => {
    it('renders all 4 trust badges', () => {
      const wrapper = factory()
      expect(wrapper.find('[data-testid="badge-secure-pay"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="badge-return"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="badge-authentic"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="badge-fast-ship"]').exists()).toBe(true)
    })

    it('trust badge labels are visible', () => {
      const wrapper = factory()
      expect(wrapper.text()).toContain('پرداخت امن')
      expect(wrapper.text()).toContain('ضمانت بازگشت ۷ روزه')
      expect(wrapper.text()).toContain('اصالت کالا')
      expect(wrapper.text()).toContain('ارسال سریع')
    })
  })

  describe('copyright', () => {
    it('shows footerCopyright text', () => {
      const wrapper = factory({ footerCopyright: 'تمامی حقوق برای نیک محفوظ است' })
      expect(wrapper.find('[data-testid="copyright"]').text()).toContain('تمامی حقوق برای نیک محفوظ است')
    })

    it('shows current year in copyright', () => {
      const wrapper = factory()
      const year = new Date().getFullYear().toString()
      expect(wrapper.find('[data-testid="copyright"]').text()).toContain(year)
    })
  })
})
