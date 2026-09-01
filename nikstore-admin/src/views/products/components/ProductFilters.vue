<template>
  <div class="admin-card mb-4">
    <div class="flex flex-wrap gap-3 items-end">

      <!-- Search -->
      <div class="flex-1 min-w-[200px]">
        <AdminInput v-model="filters.search" placeholder="جستجو در نام محصول..." prepend="🔍" />
      </div>

      <!-- Category -->
      <div class="w-44">
        <AdminSelect v-model="filters.categoryId" placeholder="همه دسته‌ها" :options="categoryOptions" />
      </div>

      <!-- Brand -->
      <div class="w-36">
        <AdminSelect v-model="filters.brandId" placeholder="همه برندها" :options="brandOptions" />
      </div>

      <!-- Status -->
      <div class="w-36">
        <AdminSelect v-model="filters.status" placeholder="همه وضعیت‌ها" :options="statusOptions" />
      </div>

      <!-- Sort -->
      <div class="w-40">
        <AdminSelect v-model="filters.sortBy" :options="sortOptions" />
      </div>

      <!-- Reset -->
      <AdminButton v-if="hasActiveFilters" variant="ghost" size="md" @click="reset">
        پاک کردن فیلتر
      </AdminButton>

    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'
import { useDebounce } from '@/composables/useDebounce'
import AdminInput  from '@/components/common/AdminInput.vue'
import AdminSelect from '@/components/common/AdminSelect.vue'
import AdminButton from '@/components/common/AdminButton.vue'
import { PRODUCT_STATUSES } from '@/utils/constants'

const props = defineProps({
  categories: { type: Array, default: () => [] },
  brands:     { type: Array, default: () => [] },
  loading:    Boolean,
})
const emit = defineEmits(['change'])

const filters = reactive({
  search:     '',
  categoryId: '',
  brandId:    '',
  status:     '',
  sortBy:     'newest',
})

const debouncedSearch = useDebounce(computed(() => filters.search))

watch(debouncedSearch, () => emitChange())
watch([() => filters.categoryId, () => filters.brandId, () => filters.status, () => filters.sortBy], () => emitChange())

function emitChange() {
  emit('change', {
    search:     debouncedSearch.value,
    categoryId: filters.categoryId,
    brandId:    filters.brandId,
    status:     filters.status,
    sortBy:     filters.sortBy,
  })
}

function reset() {
  filters.search = filters.categoryId = filters.brandId = filters.status = ''
  filters.sortBy = 'newest'
}

const hasActiveFilters = computed(() => filters.search || filters.categoryId || filters.brandId || filters.status)

const categoryOptions = computed(() =>
  props.categories.map(c => ({
    value: c._id,
    label: c.depth > 0 ? `${'— '.repeat(c.depth)}${c.name}` : c.name,
  }))
)

const brandOptions = computed(() =>
  props.brands.map(b => ({ value: b._id, label: b.name }))
)

const statusOptions = Object.entries(PRODUCT_STATUSES).map(([v, d]) => ({
  value: v, label: d.label,
}))

const sortOptions = [
  { value: 'newest',     label: 'جدیدترین' },
  { value: 'oldest',     label: 'قدیمی‌ترین' },
  { value: 'price_asc',  label: 'ارزان‌ترین' },
  { value: 'price_desc', label: 'گران‌ترین' },
  { value: 'stock_asc',  label: 'کمترین موجودی' },
]
</script>
