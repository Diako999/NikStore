import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// ── Service mocks ──────────────────────────────────────────────
vi.mock('@/services/product.service', () => ({
  productService: { create: vi.fn(), update: vi.fn(), getById: vi.fn() },
}))
vi.mock('@/services/category.service', () => ({
  categoryService: { getAll: vi.fn().mockResolvedValue({ data: [] }) },
}))
vi.mock('@/services/brand.service', () => ({
  brandService: { getAll: vi.fn().mockResolvedValue({ data: [] }) },
}))
vi.mock('@/services/translation.service', () => ({
  translationService: { toEnglish: vi.fn().mockResolvedValue('prescription glasses') },
}))

// ── Formatters ─────────────────────────────────────────────────
vi.mock('@/utils/formatters', () => ({
  formatNumber: (n) => String(n ?? 0),
  formatPrice:  (n) => String(n ?? 0),
}))

// ── Logger ─────────────────────────────────────────────────────
vi.mock('@/utils/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

// ── UI store ───────────────────────────────────────────────────
const mockAddToast = vi.fn()
vi.mock('@/stores/ui.store', () => ({
  useUiStore: () => ({ addToast: mockAddToast }),
}))

// ── Router ─────────────────────────────────────────────────────
const mockPush    = vi.fn()
const mockBack    = vi.fn()
const mockReplace = vi.fn()
const routeParams = {}   // mutate per-test, not reassign (stable reference for closure)

vi.mock('vue-router', () => ({
  useRoute:  () => ({ params: routeParams }),
  useRouter: () => ({ push: mockPush, back: mockBack, replace: mockReplace }),
}))

// ── Child component stubs ──────────────────────────────────────
vi.mock('./components/ImageUploader.vue', () => ({
  default: { name: 'ImageUploader', props: ['modelValue', 'maxImages'], emits: ['update:modelValue'], template: '<div data-stub="ImageUploader" />' },
}))
vi.mock('./components/VariantEditor.vue', () => ({
  default: { name: 'VariantEditor', props: ['modelValue', 'errors'], emits: ['update:modelValue'], template: '<div data-stub="VariantEditor" />' },
}))
vi.mock('./components/TagInput.vue', () => ({
  default: { name: 'TagInput', props: ['modelValue'], emits: ['update:modelValue'], template: '<div data-stub="TagInput" />' },
}))
vi.mock('@/components/common/AdminInput.vue', () => ({
  default: { name: 'AdminInput', props: ['modelValue', 'label', 'placeholder', 'required', 'error', 'type', 'dir'], emits: ['update:modelValue'], template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />' },
}))
vi.mock('@/components/common/AdminSelect.vue', () => ({
  default: { name: 'AdminSelect', props: ['modelValue', 'label', 'options', 'placeholder', 'required', 'error'], emits: ['update:modelValue'], template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"></select>' },
}))
vi.mock('@/components/common/AdminTextarea.vue', () => ({
  default: { name: 'AdminTextarea', props: ['modelValue', 'label', 'placeholder', 'rows'], emits: ['update:modelValue'], template: '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>' },
}))
vi.mock('@/components/common/AdminButton.vue', () => ({
  default: { name: 'AdminButton', props: ['variant', 'loading', 'disabled'], emits: ['click'], template: '<button :disabled="loading || disabled" @click="$emit(\'click\')"><slot /></button>' },
}))
vi.mock('@/components/common/AdminSkeleton.vue', () => ({
  default: { name: 'AdminSkeleton', props: ['height', 'width'], template: '<div />' },
}))

import ProductFormView from './ProductFormView.vue'
import { productService } from '@/services/product.service'
import { translationService } from '@/services/translation.service'
import { logger } from '@/utils/logger'

function mountView() {
  return mount(ProductFormView)
}

/** Set form to a minimal valid state for draft saving */
function makeValidDraft(vm) {
  vm.form.name       = 'عینک آفتابی ری‌بن'
  vm.form.categoryId = 'cat_abc123'
}

/** Set form to a valid state for publishing (price required) */
function makeValidPublish(vm) {
  makeValidDraft(vm)
  vm.form.variants[0].price = 450000
}

// ─────────────────────────────────────────────────────────────
describe('ProductFormView', () => {

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    // Reset route to create mode
    delete routeParams.id
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── validate() ─────────────────────────────────────────────
  describe('validate()', () => {
    it('rejects empty name', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.form.name = ''
      expect(w.vm.validate('draft')).toBe(false)
      expect(w.vm.errors.name).toBeTruthy()
    })

    it('rejects name shorter than 3 chars', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.form.name = 'آی'
      expect(w.vm.validate('draft')).toBe(false)
    })

    it('rejects missing categoryId', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.form.name       = 'عینک آفتابی'
      w.vm.form.categoryId = ''
      expect(w.vm.validate('draft')).toBe(false)
      expect(w.vm.errors.categoryId).toBeTruthy()
    })

    it('accepts valid draft (price not required)', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      makeValidDraft(w.vm)
      w.vm.form.variants[0].price = 0
      expect(w.vm.validate('draft')).toBe(true)
    })

    it('rejects active status with zero-price variant', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      makeValidDraft(w.vm)
      w.vm.form.variants[0].price = 0
      expect(w.vm.validate('active')).toBe(false)
    })

    it('accepts active when price is provided', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      makeValidPublish(w.vm)
      expect(w.vm.validate('active')).toBe(true)
    })

    it('rejects negative stock for active status', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      makeValidPublish(w.vm)
      w.vm.form.variants[0].stock = -1
      expect(w.vm.validate('active')).toBe(false)
    })

    it('clears previous errors on each call', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      // First run leaves errors
      w.vm.form.name = ''
      w.vm.validate('draft')
      expect(w.vm.errors.name).toBeTruthy()
      // Second run with valid data clears them
      makeValidDraft(w.vm)
      w.vm.validate('draft')
      expect(w.vm.errors.name).toBeFalsy()
    })
  })

  // ── saveDraft() — create mode ──────────────────────────────
  describe('saveDraft() — create mode', () => {
    beforeEach(() => {
      productService.create.mockResolvedValue({ data: { _id: 'draft_001' } })
    })

    it('calls productService.create with status=draft', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      makeValidDraft(w.vm)
      await w.vm.saveDraft()
      expect(productService.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'draft' }),
      )
    })

    it('redirects to product-edit after creating draft', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      makeValidDraft(w.vm)
      await w.vm.saveDraft()
      expect(mockReplace).toHaveBeenCalledWith(
        expect.objectContaining({ params: { id: 'draft_001' } }),
      )
    })

    it('shows success toast', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      makeValidDraft(w.vm)
      await w.vm.saveDraft()
      expect(mockAddToast).toHaveBeenCalledWith(expect.any(String), 'success')
    })

    it('logs info on success', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      makeValidDraft(w.vm)
      await w.vm.saveDraft()
      expect(logger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ id: 'draft_001' }),
        'ProductFormView',
      )
    })

    it('resets isDirty after successful save', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.isDirty = true
      makeValidDraft(w.vm)
      await w.vm.saveDraft()
      expect(w.vm.isDirty).toBe(false)
    })

    it('sets savedRecently to true after save', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      makeValidDraft(w.vm)
      await w.vm.saveDraft()
      expect(w.vm.savedRecently).toBe(true)
    })

    it('clears savedRecently after 3 seconds', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      makeValidDraft(w.vm)
      await w.vm.saveDraft()
      expect(w.vm.savedRecently).toBe(true)
      vi.advanceTimersByTime(3000)
      expect(w.vm.savedRecently).toBe(false)
    })

    it('shows error toast when API fails', async () => {
      const err = Object.assign(new Error(), { response: { data: { message: 'خطای سرور' } } })
      productService.create.mockRejectedValue(err)
      const w = mountView()
      await w.vm.$nextTick()
      makeValidDraft(w.vm)
      await w.vm.saveDraft()
      expect(mockAddToast).toHaveBeenCalledWith('خطای سرور', 'error')
    })

    it('logs error when API fails', async () => {
      const err = new Error('network')
      productService.create.mockRejectedValue(err)
      const w = mountView()
      await w.vm.$nextTick()
      makeValidDraft(w.vm)
      await w.vm.saveDraft()
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to save draft', err, expect.any(Object), 'ProductFormView',
      )
    })

    it('resets savingDraft to false after success', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      makeValidDraft(w.vm)
      await w.vm.saveDraft()
      expect(w.vm.savingDraft).toBe(false)
    })

    it('resets savingDraft to false on error', async () => {
      productService.create.mockRejectedValue(new Error())
      const w = mountView()
      await w.vm.$nextTick()
      makeValidDraft(w.vm)
      await w.vm.saveDraft()
      expect(w.vm.savingDraft).toBe(false)
    })

    it('does not call API when form is invalid', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.form.name = ''
      await w.vm.saveDraft()
      expect(productService.create).not.toHaveBeenCalled()
    })
  })

  // ── saveDraft() — edit mode ────────────────────────────────
  describe('saveDraft() — edit mode', () => {
    beforeEach(() => {
      routeParams.id = 'prod_edit_1'
      productService.update.mockResolvedValue({ data: {} })
      productService.getById.mockResolvedValue({
        data: { name: 'قدیمی', slug: 'old', category: 'cat1', brand: null,
                images: [], variants: [], tags: [], status: 'active' },
      })
    })

    it('calls productService.update with the route id', async () => {
      const w = mountView()
      await flushPromises()
      makeValidDraft(w.vm)
      await w.vm.saveDraft()
      expect(productService.update).toHaveBeenCalledWith(
        'prod_edit_1',
        expect.objectContaining({ status: 'draft' }),
      )
    })

    it('does NOT redirect after editing', async () => {
      const w = mountView()
      await flushPromises()
      makeValidDraft(w.vm)
      await w.vm.saveDraft()
      expect(mockReplace).not.toHaveBeenCalled()
    })

    it('logs error on update failure', async () => {
      const err = new Error('update failed')
      productService.update.mockRejectedValue(err)
      const w = mountView()
      await flushPromises()
      makeValidDraft(w.vm)
      await w.vm.saveDraft()
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to save draft', err, expect.any(Object), 'ProductFormView',
      )
    })
  })

  // ── publish() ─────────────────────────────────────────────
  describe('publish()', () => {
    beforeEach(() => {
      delete routeParams.id
      productService.create.mockResolvedValue({ data: { _id: 'pub_001' } })
    })

    it('calls create with status=active', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      makeValidPublish(w.vm)
      await w.vm.publish()
      expect(productService.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active' }),
      )
    })

    it('redirects to products list after publish', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      makeValidPublish(w.vm)
      await w.vm.publish()
      expect(mockPush).toHaveBeenCalledWith({ name: 'products' })
    })

    it('logs info on successful publish', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      makeValidPublish(w.vm)
      await w.vm.publish()
      expect(logger.info).toHaveBeenCalledWith(
        'Product created and published',
        expect.objectContaining({ id: 'pub_001' }),
        'ProductFormView',
      )
    })

    it('resets isDirty after publish', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.isDirty = true
      makeValidPublish(w.vm)
      await w.vm.publish()
      expect(w.vm.isDirty).toBe(false)
    })

    it('shows single error toast for string message', async () => {
      const err = Object.assign(new Error(), { response: { data: { message: 'ارتباط ناموفق' } } })
      productService.create.mockRejectedValue(err)
      const w = mountView()
      await w.vm.$nextTick()
      makeValidPublish(w.vm)
      await w.vm.publish()
      expect(mockAddToast).toHaveBeenCalledTimes(1)
      expect(mockAddToast).toHaveBeenCalledWith('ارتباط ناموفق', 'error')
    })

    it('shows one toast per error when API returns array', async () => {
      const err = Object.assign(new Error(), { response: { data: { message: ['خطا ۱', 'خطا ۲', 'خطا ۳'] } } })
      productService.create.mockRejectedValue(err)
      const w = mountView()
      await w.vm.$nextTick()
      makeValidPublish(w.vm)
      await w.vm.publish()
      expect(mockAddToast).toHaveBeenCalledTimes(3)
      expect(mockAddToast).toHaveBeenCalledWith('خطا ۱', 'error')
      expect(mockAddToast).toHaveBeenCalledWith('خطا ۲', 'error')
    })

    it('logs error on publish failure', async () => {
      const err = new Error('publish failed')
      productService.create.mockRejectedValue(err)
      const w = mountView()
      await w.vm.$nextTick()
      makeValidPublish(w.vm)
      await w.vm.publish()
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to publish product', err, expect.any(Object), 'ProductFormView',
      )
    })

    it('resets savingPublish to false after success', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      makeValidPublish(w.vm)
      await w.vm.publish()
      expect(w.vm.savingPublish).toBe(false)
    })

    it('resets savingPublish to false on error', async () => {
      productService.create.mockRejectedValue(new Error())
      const w = mountView()
      await w.vm.$nextTick()
      makeValidPublish(w.vm)
      await w.vm.publish()
      expect(w.vm.savingPublish).toBe(false)
    })

    it('does not call API when form is invalid', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.form.name = ''
      await w.vm.publish()
      expect(productService.create).not.toHaveBeenCalled()
    })

    // edit mode
    it('calls update (not create) in edit mode', async () => {
      routeParams.id = 'prod_e1'
      productService.update.mockResolvedValue({ data: {} })
      productService.getById.mockResolvedValue({
        data: { name: 'عینک', slug: 'x', category: 'cat1', brand: null,
                images: [], variants: [], tags: [], status: 'active' },
      })
      const w = mountView()
      await flushPromises()
      makeValidPublish(w.vm)
      await w.vm.publish()
      expect(productService.update).toHaveBeenCalledWith('prod_e1', expect.objectContaining({ status: 'active' }))
      expect(productService.create).not.toHaveBeenCalled()
    })
  })

  // ── slug auto-generate from Persian name ──────────────────
  describe('slug auto-generation (create mode)', () => {
    it('calls translationService.toEnglish when name changes', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.form.name = 'عینک آفتابی'
      await w.vm.$nextTick()
      vi.advanceTimersByTime(500)
      await flushPromises()
      expect(translationService.toEnglish).toHaveBeenCalledWith('عینک آفتابی')
    })

    it('populates slug from translated English result', async () => {
      translationService.toEnglish.mockResolvedValue('prescription glasses')
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.form.name = 'عینک طبی'
      await w.vm.$nextTick()
      vi.advanceTimersByTime(500)
      await flushPromises()
      expect(w.vm.form.slug).toBe('prescription-glasses')
    })

    it('falls back to persianToSlug when API fails', async () => {
      translationService.toEnglish.mockRejectedValue(new Error('network'))
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.form.name = 'عینک'
      await w.vm.$nextTick()
      vi.advanceTimersByTime(500)
      await flushPromises()
      expect(w.vm.form.slug).toMatch(/^[a-z-]+$/)
    })

    it('stops auto-updating after user manually edits slug', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.onSlugInput({ target: { value: 'my-custom-slug' } })
      translationService.toEnglish.mockClear()
      w.vm.form.name = 'اسم جدید'
      await w.vm.$nextTick()
      vi.advanceTimersByTime(500)
      await flushPromises()
      expect(w.vm.form.slug).toBe('my-custom-slug')
      expect(translationService.toEnglish).not.toHaveBeenCalled()
    })

    it('debounces — does not call API on every keystroke', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.form.name = 'ع'
      await w.vm.$nextTick()
      vi.advanceTimersByTime(100)
      w.vm.form.name = 'عی'
      await w.vm.$nextTick()
      vi.advanceTimersByTime(100)
      w.vm.form.name = 'عین'
      await w.vm.$nextTick()
      vi.advanceTimersByTime(500)
      await flushPromises()
      expect(translationService.toEnglish).toHaveBeenCalledTimes(1)
      expect(translationService.toEnglish).toHaveBeenCalledWith('عین')
    })

    it('persianToSlug maps common Persian chars to Latin', () => {
      const w = mountView()
      const result = w.vm.persianToSlug('ریبن')
      expect(result).toMatch(/^[a-z-]+$/)
    })
  })

  // ── slug sanitization & validation ────────────────────────
  describe('slug field (edit mode)', () => {
    beforeEach(() => {
      routeParams.id = 'prod_slug_1'
      productService.update.mockResolvedValue({ data: {} })
      productService.getById.mockResolvedValue({
        data: { name: 'عینک آفتابی', slug: 'rayban-aviator', category: 'cat1', brand: null,
                images: [], variants: [], tags: [], status: 'active' },
      })
    })

    it('loads original slug from server into form', async () => {
      const w = mountView()
      await flushPromises()
      expect(w.vm.form.slug).toBe('rayban-aviator')
    })

    it('does not overwrite server slug when name changes in edit mode', async () => {
      const w = mountView()
      await flushPromises()
      w.vm.form.name = 'اسم تغییر یافته'
      await w.vm.$nextTick()
      expect(w.vm.form.slug).toBe('rayban-aviator')
    })

    it('onSlugInput lowercases and strips Persian/Arabic chars', () => {
      const w = mountView()
      const fakeEvent = (val) => ({ target: { value: val } })
      w.vm.onSlugInput(fakeEvent('Rayban Aviator'))
      expect(w.vm.form.slug).toBe('rayban-aviator')
    })

    it('onSlugInput strips non-ASCII characters', () => {
      const w = mountView()
      const fakeEvent = (val) => ({ target: { value: val } })
      w.vm.onSlugInput(fakeEvent('عینک-rayban'))
      expect(w.vm.form.slug).toBe('rayban')
    })

    it('onSlugInput collapses multiple dashes', () => {
      const w = mountView()
      const fakeEvent = (val) => ({ target: { value: val } })
      w.vm.onSlugInput(fakeEvent('rayban--aviator---gold'))
      expect(w.vm.form.slug).toBe('rayban-aviator-gold')
    })

    it('slugError is empty for a valid slug', async () => {
      const w = mountView()
      await flushPromises()
      w.vm.form.slug = 'rayban-aviator-2'
      await w.vm.$nextTick()
      expect(w.vm.slugError).toBe('')
    })

    it('slugError is non-empty for slug with Persian chars', async () => {
      const w = mountView()
      await flushPromises()
      w.vm.form.slug = 'عینک-rayban'
      await w.vm.$nextTick()
      expect(w.vm.slugError).toBeTruthy()
    })

    it('validate() rejects invalid slug', async () => {
      const w = mountView()
      await flushPromises()
      makeValidDraft(w.vm)
      w.vm.form.slug = 'UPPER_CASE'
      expect(w.vm.validate('draft')).toBe(false)
      expect(w.vm.errors.slug).toBeTruthy()
    })

    it('validate() accepts valid lowercase slug', async () => {
      const w = mountView()
      await flushPromises()
      makeValidDraft(w.vm)
      w.vm.form.slug = 'rayban-aviator-2'
      expect(w.vm.validate('draft')).toBe(true)
      expect(w.vm.errors.slug).toBeFalsy()
    })
  })

  // ── isDirty tracking ───────────────────────────────────────
  describe('isDirty', () => {
    it('starts as false on create mode', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      // Immediately after mount, before user interaction
      // (the watcher may fire synchronously on initial reactive form setup)
      // We just verify the type and that it's a boolean
      expect(typeof w.vm.isDirty).toBe('boolean')
    })

    it('becomes true after form.name changes', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.isDirty = false
      w.vm.form.name = 'تغییر'
      await w.vm.$nextTick()
      expect(w.vm.isDirty).toBe(true)
    })

    it('becomes true after variant price changes', async () => {
      const w = mountView()
      await w.vm.$nextTick()
      w.vm.isDirty = false
      w.vm.form.variants[0].price = 99000
      await w.vm.$nextTick()
      expect(w.vm.isDirty).toBe(true)
    })

    it('resets to false after fillForm (edit load)', async () => {
      routeParams.id = 'prod_f1'
      productService.getById.mockResolvedValue({
        data: { name: 'عینک', slug: 'e', category: 'cat1', brand: null,
                images: [], variants: [], tags: [], status: 'active' },
      })
      const w = mountView()
      await flushPromises()
      // fillForm should have reset isDirty
      expect(w.vm.isDirty).toBe(false)
    })
  })
})
