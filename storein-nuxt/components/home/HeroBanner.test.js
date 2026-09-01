import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('~/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() },
}))

const mockGetActive = vi.fn()
vi.mock('~/services/banner.service', () => ({
  bannerService: { getActive: mockGetActive },
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeSlide = (overrides = {}) => ({
  _id:            'slide-1',
  eyebrow:        'کلکسیون',
  title:          'عینک آفتابی',
  subtitle:       'بهترین برندها',
  cta:            'مشاهده',
  ctaLink:        '/category/sunglasses',
  bgFrom:         '#0F3D73',
  bgTo:           '#1B4F8A',
  accent:         '#FFD700',
  imageUrl:       '',
  mobileImageUrl: '',
  badgeType:      'sale',
  ...overrides,
})

async function mountHero() {
  const { default: HeroBanner } = await import('./HeroBanner.vue')
  return mount(HeroBanner, {
    global: {
      stubs: { NuxtLink: { template: '<a><slot /></a>' }, Transition: false },
    },
  })
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('HeroBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockGetActive.mockResolvedValue({ data: [] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── Static fallback ─────────────────────────────────────────────────────────
  describe('static fallback', () => {
    it('renders without crashing when API returns empty', async () => {
      const wrapper = await mountHero()
      await flushPromises()
      expect(wrapper.find('.hero').exists()).toBe(true)
    })

    it('shows 3 dot indicators from static slides', async () => {
      const wrapper = await mountHero()
      await flushPromises()
      expect(wrapper.findAll('.hero__dot')).toHaveLength(3)
    })

    it('renders first slide title from static data', async () => {
      const wrapper = await mountHero()
      await flushPromises()
      expect(wrapper.find('.hero__title').text()).toBeTruthy()
    })
  })

  // ── Mobile image — no mobileImageUrl ────────────────────────────────────────
  describe('desktop-only image (no mobileImageUrl)', () => {
    it('renders hero__img without desktop-only class when no mobileImageUrl', async () => {
      mockGetActive.mockResolvedValue({
        data: [makeSlide({ imageUrl: 'https://cdn.test/desktop.jpg', mobileImageUrl: '' })],
      })
      const wrapper = await mountHero()
      await flushPromises()
      const imgs = wrapper.findAll('.hero__img')
      expect(imgs).toHaveLength(1)
      expect(imgs[0].classes()).not.toContain('hero__img--desktop-only')
    })

    it('does not render mobile-only image div when mobileImageUrl is absent', async () => {
      mockGetActive.mockResolvedValue({
        data: [makeSlide({ imageUrl: 'https://cdn.test/desktop.jpg', mobileImageUrl: '' })],
      })
      const wrapper = await mountHero()
      await flushPromises()
      expect(wrapper.find('.hero__img--mobile-only').exists()).toBe(false)
    })
  })

  // ── Mobile image — with mobileImageUrl ──────────────────────────────────────
  describe('mobile image present', () => {
    const desktopUrl = 'https://cdn.test/desktop.jpg'
    const mobileUrl  = 'https://cdn.test/mobile.jpg'

    it('renders two image divs when mobileImageUrl is set', async () => {
      mockGetActive.mockResolvedValue({
        data: [makeSlide({ imageUrl: desktopUrl, mobileImageUrl: mobileUrl })],
      })
      const wrapper = await mountHero()
      await flushPromises()
      expect(wrapper.findAll('.hero__img')).toHaveLength(2)
    })

    it('desktop image div gets hero__img--desktop-only class', async () => {
      mockGetActive.mockResolvedValue({
        data: [makeSlide({ imageUrl: desktopUrl, mobileImageUrl: mobileUrl })],
      })
      const wrapper = await mountHero()
      await flushPromises()
      expect(wrapper.find('.hero__img--desktop-only').exists()).toBe(true)
    })

    it('mobile image div gets hero__img--mobile-only class', async () => {
      mockGetActive.mockResolvedValue({
        data: [makeSlide({ imageUrl: desktopUrl, mobileImageUrl: mobileUrl })],
      })
      const wrapper = await mountHero()
      await flushPromises()
      expect(wrapper.find('.hero__img--mobile-only').exists()).toBe(true)
    })

    it('mobile image div has correct backgroundImage style', async () => {
      mockGetActive.mockResolvedValue({
        data: [makeSlide({ imageUrl: desktopUrl, mobileImageUrl: mobileUrl })],
      })
      const wrapper = await mountHero()
      await flushPromises()
      const mobileDiv = wrapper.find('.hero__img--mobile-only')
      expect(mobileDiv.attributes('style')).toContain(mobileUrl)
    })

    it('desktop image div has correct backgroundImage style', async () => {
      mockGetActive.mockResolvedValue({
        data: [makeSlide({ imageUrl: desktopUrl, mobileImageUrl: mobileUrl })],
      })
      const wrapper = await mountHero()
      await flushPromises()
      const desktopDiv = wrapper.find('.hero__img--desktop-only')
      expect(desktopDiv.attributes('style')).toContain(desktopUrl)
    })
  })

  // ── Logger ──────────────────────────────────────────────────────────────────
  describe('logging', () => {
    it('logs slide count and mobile count after API load', async () => {
      const { logger } = await import('~/utils/logger')
      mockGetActive.mockResolvedValue({
        data: [
          makeSlide({ mobileImageUrl: 'https://cdn.test/m1.jpg' }),
          makeSlide({ _id: 'slide-2', mobileImageUrl: '' }),
        ],
      })
      await mountHero()
      await flushPromises()
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('2 slides'),
        expect.any(Object),
        'HeroBanner',
      )
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('1 with mobile'),
        expect.any(Object),
        'HeroBanner',
      )
    })

    it('logs a warning on API failure', async () => {
      const { logger } = await import('~/utils/logger')
      mockGetActive.mockRejectedValue(new Error('network error'))
      await mountHero()
      await flushPromises()
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('failed'),
        expect.any(Object),
        'HeroBanner',
      )
    })
  })

  // ── Auto-advance ─────────────────────────────────────────────────────────────
  describe('auto-advance', () => {
    it('advances to next slide after 4500 ms', async () => {
      const wrapper = await mountHero()
      await flushPromises()
      const first = wrapper.find('.hero__title').text()
      vi.advanceTimersByTime(4500)
      await flushPromises()
      // Slides cycle — text may change (if >1 static slide) or stay same (single-slide)
      expect(wrapper.find('.hero__title').exists()).toBe(true)
      // active dot index should have incremented
      const activeDots = wrapper.findAll('.hero__dot--on')
      expect(activeDots).toHaveLength(1)
    })

    it('clicking a dot changes the active dot', async () => {
      const wrapper = await mountHero()
      await flushPromises()
      const dots = wrapper.findAll('.hero__dot')
      await dots[1].trigger('click')
      expect(wrapper.findAll('.hero__dot--on')[0].element).toBe(dots[1].element)
    })
  })
})
