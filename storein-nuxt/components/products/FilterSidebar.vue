<template>
  <aside class="w-64 flex-shrink-0" aria-label="فیلتر محصولات">
    <GlassCard padding="sm" radius="20px" class="!p-0" tint="accent-gold">

      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-glass-border">
        <h3 class="font-bold text-glass-text-primary text-sm">فیلترها</h3>
        <button
          v-if="activeCount > 0"
          @click="clearAll"
          class="text-brand text-xs hover:underline"
        >
          حذف همه ({{ activeCount }})
        </button>
      </div>

      <!-- ① Category -->
      <div class="border-b border-glass-border">
        <button
          class="w-full flex items-center justify-between px-4 py-3
                 text-sm font-medium text-glass-text-primary hover:text-brand
                 transition-colors duration-150"
          :aria-expanded="open.category"
          aria-controls="filter-panel-category"
          @click="open.category = !open.category"
        >
          دسته‌بندی
          <svg :class="['w-4 h-4 transition-transform duration-200', open.category ? 'rotate-180' : '']"
               fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
          </svg>
        </button>
        <div id="filter-panel-category" v-show="open.category" class="pb-3 space-y-0.5">
          <label class="flex items-center gap-2 cursor-pointer group px-4 py-1">
            <input
              type="radio"
              :value="null"
              :checked="filters.category === null"
              @change="setFilter('category', null)"
              class="w-3.5 h-3.5 accent-brand flex-shrink-0"
            />
            <span class="text-sm text-glass-text-primary group-hover:text-brand transition-colors">
              همه محصولات
            </span>
          </label>
          <template v-for="cat in allCategories" :key="cat.slug || cat._id">
            <label class="flex items-center gap-2 cursor-pointer group py-1"
              :style="{ paddingRight: `${(cat.depth || 0) * 12 + 16}px`, paddingLeft: '16px' }">
              <input
                type="radio"
                :value="cat.slug"
                :checked="filters.category === cat.slug"
                @change="setFilter('category', cat.slug)"
                class="w-3.5 h-3.5 accent-brand flex-shrink-0"
              />
              <span class="text-sm group-hover:text-brand transition-colors"
                :class="cat.depth > 0 ? 'text-glass-text-secondary' : 'text-glass-text-primary'">
                {{ cat.name }}
              </span>
            </label>
          </template>
        </div>
      </div>

      <!-- ② Brand -->
      <div v-if="brands.length" class="border-b border-glass-border">
        <button
          class="w-full flex items-center justify-between px-4 py-3
                 text-sm font-medium text-glass-text-primary hover:text-brand
                 transition-colors duration-150"
          :aria-expanded="open.brand"
          aria-controls="filter-panel-brand"
          @click="open.brand = !open.brand"
        >
          برند
          <svg :class="['w-4 h-4 transition-transform duration-200', open.brand ? 'rotate-180' : '']"
               fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
          </svg>
        </button>
        <div id="filter-panel-brand" v-show="open.brand" class="pb-3 space-y-0.5">
          <label class="flex items-center gap-2 cursor-pointer group px-4 py-1">
            <input
              type="radio"
              :value="null"
              :checked="!filters.brand"
              @change="setFilter('brand', null)"
              class="w-3.5 h-3.5 accent-brand flex-shrink-0"
            />
            <span class="text-sm text-glass-text-primary group-hover:text-brand transition-colors">همه برندها</span>
          </label>
          <label
            v-for="b in brands"
            :key="b._id"
            class="flex items-center gap-2 cursor-pointer group px-4 py-1"
          >
            <input
              type="radio"
              :value="b._id"
              :checked="filters.brand === b._id"
              @change="setFilter('brand', b._id)"
              class="w-3.5 h-3.5 accent-brand flex-shrink-0"
            />
            <span class="text-sm text-glass-text-primary group-hover:text-brand transition-colors">
              {{ b.name }}
            </span>
          </label>
        </div>
      </div>

      <!-- ③ Gender -->
      <div class="border-b border-glass-border">
        <button
          class="w-full flex items-center justify-between px-4 py-3
                 text-sm font-medium text-glass-text-primary hover:text-brand
                 transition-colors duration-150"
          :aria-expanded="open.gender"
          aria-controls="filter-panel-gender"
          @click="open.gender = !open.gender"
        >
          جنسیت
          <svg :class="['w-4 h-4 transition-transform duration-200', open.gender ? 'rotate-180' : '']"
               fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
          </svg>
        </button>
        <div id="filter-panel-gender" v-show="open.gender" class="px-4 pb-3 space-y-2">
          <label
            v-for="opt in GENDER_OPTIONS"
            :key="opt.value"
            class="flex items-center gap-2 cursor-pointer group"
          >
            <input
              type="checkbox"
              :value="opt.value"
              :checked="filters.genders.includes(opt.value)"
              @change="toggleArray('genders', opt.value)"
              class="w-4 h-4 accent-brand rounded"
            />
            <span class="text-sm text-glass-text-primary group-hover:text-brand transition-colors">
              {{ opt.label }}
            </span>
          </label>
        </div>
      </div>

      <!-- ④ Price Range -->
      <div class="border-b border-glass-border">
        <button
          class="w-full flex items-center justify-between px-4 py-3
                 text-sm font-medium text-glass-text-primary hover:text-brand
                 transition-colors duration-150"
          :aria-expanded="open.price"
          aria-controls="filter-panel-price"
          @click="open.price = !open.price"
        >
          محدوده قیمت
          <svg :class="['w-4 h-4 transition-transform duration-200', open.price ? 'rotate-180' : '']"
               fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
          </svg>
        </button>
        <div id="filter-panel-price" v-show="open.price" class="px-4 pb-4 space-y-3">
          <div class="flex gap-2">
            <div class="flex-1">
              <GlassInput
                label="از (تومان)"
                type="text"
                inputmode="numeric"
                :model-value="filters.minPrice ? formatNumber(filters.minPrice) : ''"
                placeholder="۰"
                class="font-fanum"
                @blur="onPriceInput('min', $event)"
              />
            </div>
            <div class="flex-1">
              <GlassInput
                label="تا (تومان)"
                type="text"
                inputmode="numeric"
                :model-value="filters.maxPrice ? formatNumber(filters.maxPrice) : ''"
                placeholder="نامحدود"
                class="font-fanum"
                @blur="onPriceInput('max', $event)"
              />
            </div>
          </div>
          <p v-if="priceError" role="alert" class="text-xs text-error">{{ priceError }}</p>
        </div>
      </div>

      <!-- ⑤ In Stock only -->
      <div class="px-4 py-3">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            :checked="filters.inStock"
            @change="setFilter('inStock', $event.target.checked)"
            class="w-4 h-4 accent-brand rounded"
          />
          <span class="text-sm font-medium text-glass-text-primary">فقط کالاهای موجود</span>
        </label>
      </div>

    </GlassCard>
  </aside>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useCategoryStore } from '~/stores/category.store'
import GlassCard from '~/components/glass/GlassCard.vue'
import GlassInput from '~/components/glass/GlassInput.vue'
import { GENDER_OPTIONS } from '~/utils/constants'
import { formatNumber } from '~/utils/formatters'

const props = defineProps({
  filters: { type: Object, required: true },
  brands:  { type: Array,  default: () => [] },
})
const emit = defineEmits(['change'])

const categoryStore = useCategoryStore()

const open = reactive({
  category: true,
  brand:    true,
  gender:   true,
  price:    true,
})

const priceError = ref('')

const allCategories = computed(() =>
  [...categoryStore.categories].sort((a, b) => (a.depth || 0) - (b.depth || 0) || a.name.localeCompare(b.name, 'fa'))
)

const activeCount = computed(() => {
  let count = 0
  if (props.filters.category)               count++
  if (props.filters.brand)                  count++
  if (props.filters.genders?.length)        count++
  if (props.filters.minPrice)               count++
  if (props.filters.maxPrice)               count++
  if (props.filters.inStock)                count++
  return count
})

function setFilter(key, value) {
  props.filters[key] = value
  emit('change')
}

function toggleArray(key, value) {
  const arr = props.filters[key] || []
  const idx = arr.indexOf(value)
  if (idx > -1) {
    props.filters[key] = arr.filter(v => v !== value)
  } else {
    props.filters[key] = [...arr, value]
  }
  emit('change')
}

function onPriceInput(type, event) {
  const raw = event.target.value.replace(/\D/g, '')
  const val = raw ? Number(raw) : null
  if (type === 'min') props.filters.minPrice = val
  else                props.filters.maxPrice = val

  const min = props.filters.minPrice
  const max = props.filters.maxPrice
  if (min && max && min > max) {
    priceError.value = 'حداقل قیمت نباید از حداکثر بیشتر باشد'
    return
  }
  priceError.value = ''
  emit('change')
}

function clearAll() {
  props.filters.category = null
  props.filters.brand    = null
  props.filters.genders  = []
  props.filters.minPrice = null
  props.filters.maxPrice = null
  props.filters.inStock  = false
  emit('change')
}
</script>
