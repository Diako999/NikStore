<template>
  <Teleport to="body">
    <Transition name="drawer-backdrop">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[300] flex flex-col justify-end"
        @click.self="close"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/40"
          @click="close"
        />

        <!-- Drawer panel -->
        <Transition name="drawer-panel" appear>
          <div
            v-if="modelValue"
            class="relative rounded-t-2xl max-h-[90vh] flex flex-col overflow-hidden"
            style="background-color: var(--color-card);"
          >
            <!-- Handle bar -->
            <div class="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div class="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <!-- Header (sticky) -->
            <div class="flex items-center justify-between px-4 py-3
                        border-b border-surface-border flex-shrink-0">
              <h3 class="font-bold text-text-primary">فیلترها</h3>
              <button @click="close" class="p-1 text-text-secondary hover:text-text-primary">
                <svg class="w-5 h-5" fill="none" stroke="currentColor"
                     stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Scrollable filter body -->
            <div class="overflow-y-auto flex-1">

              <!-- Category -->
              <div class="border-b border-surface-border px-4 py-3">
                <p class="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
                  دسته‌بندی
                </p>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    :class="[
                      'px-3 py-2 rounded-lg border text-sm transition-all',
                      localFilters.category === null
                        ? 'border-brand bg-brand/10 text-brand font-medium'
                        : 'border-surface-border text-text-secondary',
                    ]"
                    @click="localFilters.category = null"
                  >
                    همه
                  </button>
                  <button
                    v-for="cat in rootCategories"
                    :key="cat.slug || cat._id"
                    :class="[
                      'px-3 py-2 rounded-lg border text-sm transition-all',
                      localFilters.category === cat.slug
                        ? 'border-brand bg-brand/10 text-brand font-medium'
                        : 'border-surface-border text-text-secondary',
                    ]"
                    @click="localFilters.category = cat.slug"
                  >
                    {{ cat.name }}
                  </button>
                </div>
              </div>

              <!-- Gender -->
              <div class="border-b border-surface-border px-4 py-3">
                <p class="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
                  جنسیت
                </p>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="opt in GENDER_OPTIONS"
                    :key="opt.value"
                    @click="toggleArray('genders', opt.value)"
                    :class="[
                      'px-3 py-1.5 rounded-full border text-sm transition-all',
                      localFilters.genders.includes(opt.value)
                        ? 'border-brand bg-brand/10 text-brand font-medium'
                        : 'border-surface-border text-text-secondary',
                    ]"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>

              <!-- Price Range -->
              <div class="border-b border-surface-border px-4 py-3">
                <p class="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
                  محدوده قیمت (تومان)
                </p>
                <div class="flex gap-3">
                  <div class="flex-1">
                    <label class="text-xs text-text-secondary block mb-1">از</label>
                    <input
                      type="text"
                      inputmode="numeric"
                      :value="localFilters.minPrice ? formatNumber(localFilters.minPrice) : ''"
                      placeholder="۰"
                      @change="onPriceInput('min', $event)"
                      class="w-full border border-surface-border rounded-lg px-3 py-2
                             text-sm text-center font-fanum focus:border-brand
                             focus:ring-1 focus:ring-brand/20 outline-none
                             bg-surface text-text-primary placeholder:text-text-secondary"
                    />
                  </div>
                  <div class="flex-1">
                    <label class="text-xs text-text-secondary block mb-1">تا</label>
                    <input
                      type="text"
                      inputmode="numeric"
                      :value="localFilters.maxPrice ? formatNumber(localFilters.maxPrice) : ''"
                      placeholder="نامحدود"
                      @change="onPriceInput('max', $event)"
                      class="w-full border border-surface-border rounded-lg px-3 py-2
                             text-sm text-center font-fanum focus:border-brand
                             focus:ring-1 focus:ring-brand/20 outline-none
                             bg-surface text-text-primary placeholder:text-text-secondary"
                    />
                  </div>
                </div>
              </div>

              <!-- In Stock -->
              <div class="px-4 py-3">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="localFilters.inStock"
                    @change="localFilters.inStock = $event.target.checked"
                    class="w-4 h-4 accent-brand rounded"
                  />
                  <span class="text-sm font-medium text-text-primary">فقط کالاهای موجود</span>
                </label>
              </div>

            </div>

            <!-- Sticky footer -->
            <div class="flex-shrink-0 border-t border-surface-border p-4 flex gap-3">
              <button
                @click="clearAndClose"
                class="flex-1 py-3 rounded-xl border-2 border-surface-border
                       text-text-secondary font-medium text-sm
                       hover:border-error hover:text-error transition-colors"
              >
                حذف فیلترها
              </button>
              <button
                @click="applyAndClose"
                class="flex-1 py-3 rounded-xl bg-brand text-white
                       font-bold text-sm hover:bg-brand-dark transition-colors"
              >
                نمایش نتایج
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { reactive, watch, computed } from 'vue'
import { useCategoryStore } from '~/stores/category.store'
import { GENDER_OPTIONS } from '~/utils/constants'
import { formatNumber } from '~/utils/formatters'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  filters:    { type: Object,  required: true },
  brands:     { type: Array,   default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'apply', 'clear'])

const categoryStore = useCategoryStore()

// Local copy — allows "Cancel" without modifying the real filters
const localFilters = reactive({
  category: null,
  brand:    null,
  genders:  [],
  minPrice: null,
  maxPrice: null,
  inStock:  false,
})

// Sync local copy from props when drawer opens
watch(() => props.modelValue, (open) => {
  if (open) {
    localFilters.category = props.filters.category
    localFilters.brand    = props.filters.brand
    localFilters.genders  = [...(props.filters.genders || [])]
    localFilters.minPrice = props.filters.minPrice
    localFilters.maxPrice = props.filters.maxPrice
    localFilters.inStock  = props.filters.inStock
  }
})

const allCategories = computed(() =>
  [...categoryStore.categories].sort((a, b) => (a.depth || 0) - (b.depth || 0) || a.name.localeCompare(b.name, 'fa'))
)

const rootCategories = computed(() =>
  categoryStore.categories.filter(c => (c.depth ?? 0) === 0)
)

function toggleArray(key, value) {
  const arr = localFilters[key] || []
  const idx = arr.indexOf(value)
  if (idx > -1) localFilters[key] = arr.filter(v => v !== value)
  else          localFilters[key] = [...arr, value]
}

function onPriceInput(type, event) {
  const raw = event.target.value.replace(/\D/g, '')
  const val = raw ? Number(raw) : null
  if (type === 'min') localFilters.minPrice = val
  else                localFilters.maxPrice = val
}

function close()         { emit('update:modelValue', false) }
function applyAndClose() { emit('apply', { ...localFilters, genders: [...localFilters.genders] }); close() }
function clearAndClose() { emit('clear'); close() }
</script>

<style scoped>
.drawer-backdrop-enter-active,
.drawer-backdrop-leave-active {
  transition: opacity 0.3s ease;
}
.drawer-backdrop-enter-from,
.drawer-backdrop-leave-to {
  opacity: 0;
}

.drawer-panel-enter-active,
.drawer-panel-leave-active {
  transition: transform 0.3s ease;
}
.drawer-panel-enter-from,
.drawer-panel-leave-to {
  transform: translateY(100%);
}
</style>
