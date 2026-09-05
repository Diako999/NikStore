<template>
  <div class="product-filters">
    <AdminInput
      v-model="localSearch"
      icon="search"
      placeholder="جستجوی نام محصول..."
      class="product-filters__search"
      @keyup.enter="emitChange"
    />
    <AdminSelect
      v-model="filters.category"
      placeholder="همه دسته‌بندی‌ها"
      :options="categoryOptions"
      class="product-filters__field"
    />
    <AdminSelect
      v-model="filters.status"
      placeholder="همه وضعیت‌ها"
      :options="statusOptions"
      class="product-filters__field"
    />
    <AdminButton variant="secondary" icon="search" @click="emitChange">اعمال فیلتر</AdminButton>
    <AdminButton v-if="hasFilters" variant="ghost" icon="close" @click="reset">پاک کردن</AdminButton>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import AdminInput from '../../../components/common/AdminInput.vue'
import AdminSelect from '../../../components/common/AdminSelect.vue'
import AdminButton from '../../../components/common/AdminButton.vue'

const props = defineProps({
  categories: { type: Array, default: () => [] },
})

const modelValue = defineModel({
  type: Object,
  default: () => ({ search: '', category: '', status: '' }),
})

const filters = reactive({ ...modelValue.value })
const localSearch = ref(modelValue.value.search || '')

const statusOptions = [
  { label: 'در حال فروش', value: 'active' },
  { label: 'پیش‌نویس', value: 'draft' },
  { label: 'غیرفعال', value: 'inactive' },
]

const categoryOptions = computed(() =>
  props.categories.map((category) => ({
    label: `${'ـ '.repeat(category.depth || 0)}${category.name}`,
    value: category._id,
  })),
)

const hasFilters = computed(() => !!(filters.category || filters.status || localSearch.value))

function emitChange() {
  modelValue.value = { ...filters, search: localSearch.value }
}

function reset() {
  filters.category = ''
  filters.status = ''
  localSearch.value = ''
  emitChange()
}

watch(
  () => [filters.category, filters.status],
  () => emitChange(),
)
</script>

<style scoped>
.product-filters {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}
.product-filters__search {
  flex: 1 1 240px;
  min-width: 200px;
}
.product-filters__field {
  min-width: 180px;
}
</style>
