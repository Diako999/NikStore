import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterMobileDrawer from './FilterMobileDrawer.vue'

vi.mock('~/stores/category.store', () => ({
  useCategoryStore: () => ({
    categories: [
      { _id: 'cat1', name: 'عینک آفتابی',   slug: 'sunglasses', depth: 0 },
      { _id: 'cat2', name: 'عینک طبی',      slug: 'optical',    depth: 0 },
      { _id: 'cat3', name: 'زیر-دسته-عمیق', slug: 'sub-deep',   depth: 1 },
    ],
  }),
}))

vi.mock('~/utils/constants', () => ({
  GENDER_OPTIONS: [
    { label: 'مردانه', value: 'male' },
    { label: 'زنانه',  value: 'female' },
  ],
}))

vi.mock('~/utils/formatters', () => ({
  formatNumber: (n) => String(n),
}))

const defaultFilters = () => ({
  category: '', brand: null, genders: [],
  minPrice: null, maxPrice: null, inStock: false,
})

function mountDrawer(open = true) {
  return mount(FilterMobileDrawer, {
    props:   { modelValue: open, filters: defaultFilters() },
    global: { stubs: { Teleport: true, Transition: true } },
  })
}

describe('FilterMobileDrawer', () => {

  describe('rootCategories computed', () => {
    it('exposes only depth-0 categories in category section', async () => {
      const w = mountDrawer()
      const texts = w.findAll('button').map(b => b.text())
      expect(texts).toContain('عینک آفتابی')
      expect(texts).toContain('عینک طبی')
      expect(texts).not.toContain('زیر-دسته-عمیق') // depth 1 — excluded
    })
  })

  describe('applyAndClose', () => {
    it('emits apply with full filter object including arrays', async () => {
      const w = mountDrawer()
      const applyBtn = w.findAll('button').find(b => b.text() === 'نمایش نتایج')
      await applyBtn.trigger('click')
      const payload = w.emitted('apply')[0][0]
      expect(payload).toMatchObject({
        genders: expect.any(Array),
      })
    })

    it('emits update:modelValue false to close the drawer', async () => {
      const w = mountDrawer()
      const applyBtn = w.findAll('button').find(b => b.text() === 'نمایش نتایج')
      await applyBtn.trigger('click')
      expect(w.emitted('update:modelValue')?.[0]).toEqual([false])
    })
  })

  describe('clearAndClose', () => {
    it('emits clear event', async () => {
      const w = mountDrawer()
      const clearBtn = w.findAll('button').find(b => b.text() === 'حذف فیلترها')
      await clearBtn.trigger('click')
      expect(w.emitted('clear')).toBeTruthy()
    })
  })
})
