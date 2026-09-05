<template>
  <div class="discounts">
    <div class="discounts__head">
      <h1 class="discounts__title">تخفیف‌ها</h1>
      <AdminButton icon="plus" @click="openCreate">تخفیف جدید</AdminButton>
    </div>

    <AdminCard flush>
      <AdminTable :columns="columns" :rows="discounts" :loading="loading">
        <template #cell-title="{ row }">
          <div class="discounts__title-cell">
            <span class="discounts__title-text">{{ row.title }}</span>
            <span v-if="row.code" class="discounts__code">{{ row.code }}</span>
          </div>
        </template>
        <template #cell-value="{ row }">
          {{ row.discountType === 'percentage' ? `${formatNumber(row.value)}٪` : formatPrice(row.value) }}
        </template>
        <template #cell-targetType="{ value }">{{ targetLabel(value) }}</template>
        <template #cell-isActive="{ row }">
          <AdminButton variant="ghost" size="sm" @click="toggle(row)">
            <AdminBadge :variant="row.isActive ? 'success' : 'neutral'">{{ row.isActive ? 'فعال' : 'غیرفعال' }}</AdminBadge>
          </AdminButton>
        </template>
        <template #cell-actions="{ row }">
          <div class="discounts__row-actions">
            <AdminButton variant="ghost" size="sm" icon="edit" @click="openEdit(row)">ویرایش</AdminButton>
            <AdminButton variant="ghost" size="sm" icon="trash" @click="confirmDelete(row)">حذف</AdminButton>
          </div>
        </template>
        <template #empty>هنوز تخفیفی ثبت نشده است</template>
      </AdminTable>
      <AdminPagination v-model:page="page" :page-size="limit" :total="total" />
    </AdminCard>

    <AdminModal v-model="modalOpen" :title="editing ? 'ویرایش تخفیف' : 'تخفیف جدید'" width="560px">
      <form class="discounts__form" @submit.prevent="submit">
        <AdminInput v-model="form.title" label="عنوان" />
        <AdminTextarea v-model="form.description" label="توضیحات" :rows="2" />
        <div class="discounts__row">
          <AdminSelect v-model="form.discountType" label="نوع تخفیف" :options="typeOptions" />
          <AdminInput v-model.number="form.value" type="number" :label="form.discountType === 'percentage' ? 'درصد تخفیف' : 'مبلغ تخفیف'" />
        </div>
        <AdminInput v-model.number="form.maxDiscountAmount" type="number" label="سقف مبلغ تخفیف (اختیاری)" />
        <AdminInput v-model="form.code" label="کد تخفیف (خالی = اعمال خودکار)" />
        <AdminSelect v-model="form.targetType" label="شمول" :options="targetOptions" />
        <div class="discounts__row">
          <AdminInput v-model="form.startDate" type="date" label="تاریخ شروع" />
          <AdminInput v-model="form.endDate" type="date" label="تاریخ پایان" />
        </div>
        <AdminInput v-model.number="form.minOrderAmount" type="number" label="حداقل مبلغ سفارش (اختیاری)" />
        <label class="discounts__checkbox">
          <input v-model="form.isActive" type="checkbox">
          فعال
        </label>
        <div class="discounts__form-actions">
          <AdminButton type="submit" :loading="saving">{{ editing ? 'ذخیره' : 'ایجاد' }}</AdminButton>
          <AdminButton variant="secondary" type="button" @click="modalOpen = false">انصراف</AdminButton>
        </div>
      </form>
    </AdminModal>

    <AdminConfirm
      v-model="confirmOpen"
      title="حذف تخفیف"
      :message="`آیا از حذف «${toDelete?.title ?? ''}» مطمئن هستید؟`"
      danger
      :loading="deleting"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import AdminCard from '../../components/common/AdminCard.vue'
import AdminTable from '../../components/common/AdminTable.vue'
import AdminButton from '../../components/common/AdminButton.vue'
import AdminBadge from '../../components/common/AdminBadge.vue'
import AdminPagination from '../../components/common/AdminPagination.vue'
import AdminModal from '../../components/common/AdminModal.vue'
import AdminInput from '../../components/common/AdminInput.vue'
import AdminSelect from '../../components/common/AdminSelect.vue'
import AdminTextarea from '../../components/common/AdminTextarea.vue'
import AdminConfirm from '../../components/common/AdminConfirm.vue'
import { discountService } from '../../services/discount.service'
import { formatNumber, formatPrice } from '../../utils/format'

const columns = [
  { key: 'title', label: 'عنوان' },
  { key: 'value', label: 'مقدار' },
  { key: 'targetType', label: 'شمول' },
  { key: 'isActive', label: 'وضعیت' },
  { key: 'actions', label: '', width: '180px', align: 'end' },
]

const typeOptions = [
  { label: 'درصدی', value: 'percentage' },
  { label: 'مبلغ ثابت', value: 'fixed' },
]

const targetOptions = [
  { label: 'همه محصولات', value: 'all' },
  { label: 'محصولات خاص', value: 'products' },
  { label: 'دسته‌بندی‌ها', value: 'categories' },
  { label: 'برندها', value: 'brands' },
  { label: 'برند و دسته‌بندی', value: 'brand_category' },
]

const discounts = ref([])
const total = ref(0)
const page = ref(1)
const limit = 20
const loading = ref(true)

const modalOpen = ref(false)
const editing = ref(null)
const saving = ref(false)
const form = ref(emptyForm())

const confirmOpen = ref(false)
const deleting = ref(false)
const toDelete = ref(null)

function emptyForm() {
  return {
    title: '', description: '', discountType: 'percentage', value: 0,
    maxDiscountAmount: undefined, code: '', targetType: 'all',
    startDate: '', endDate: '', minOrderAmount: undefined, isActive: true,
  }
}

function targetLabel(value) {
  return targetOptions.find((o) => o.value === value)?.label || value
}

async function fetchDiscounts() {
  loading.value = true
  try {
    const { data } = await discountService.list({ page: page.value, limit })
    discounts.value = data?.items ?? data?.discounts ?? []
    total.value = data?.total ?? discounts.value.length
  } catch {
    discounts.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.value = emptyForm()
  modalOpen.value = true
}

function openEdit(row) {
  editing.value = row
  form.value = {
    ...emptyForm(),
    ...row,
    startDate: row.startDate ? row.startDate.slice(0, 10) : '',
    endDate: row.endDate ? row.endDate.slice(0, 10) : '',
  }
  modalOpen.value = true
}

async function submit() {
  saving.value = true
  try {
    const payload = { ...form.value }
    if (!payload.code) delete payload.code
    if (!payload.startDate) delete payload.startDate
    if (!payload.endDate) delete payload.endDate
    if (editing.value) await discountService.update(editing.value._id, payload)
    else await discountService.create(payload)
    modalOpen.value = false
    await fetchDiscounts()
  } finally {
    saving.value = false
  }
}

async function toggle(row) {
  await discountService.toggle(row._id)
  await fetchDiscounts()
}

function confirmDelete(row) {
  toDelete.value = row
  confirmOpen.value = true
}

async function handleDelete() {
  if (!toDelete.value) return
  deleting.value = true
  try {
    await discountService.remove(toDelete.value._id)
    confirmOpen.value = false
    await fetchDiscounts()
  } finally {
    deleting.value = false
    toDelete.value = null
  }
}

watch(page, fetchDiscounts)
onMounted(fetchDiscounts)
</script>

<style scoped>
.discounts { display: flex; flex-direction: column; gap: 20px; }
.discounts__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.discounts__title { font-size: 20px; font-weight: 700; color: var(--text-primary); }
.discounts__title-cell { display: flex; flex-direction: column; gap: 2px; }
.discounts__title-text { font-weight: 600; color: var(--text-primary); }
.discounts__code { font-size: 11px; font-weight: 700; color: var(--brand); direction: ltr; text-align: start; }
.discounts__row-actions { display: flex; justify-content: flex-end; gap: 4px; }
.discounts__form { display: flex; flex-direction: column; gap: 14px; }
.discounts__row { display: flex; gap: 12px; }
.discounts__row > * { flex: 1; }
.discounts__checkbox { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-primary); }
.discounts__form-actions { display: flex; gap: 10px; margin-top: 6px; }
</style>
