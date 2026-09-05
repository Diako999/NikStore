<template>
  <div class="orders-view">
    <div class="orders-view__head">
      <h1 class="orders-view__title">سفارش‌ها</h1>
    </div>

    <AdminCard flush>
      <template #header>
        <div class="orders-view__filters">
          <AdminInput
            v-model="search"
            placeholder="جستجو با شماره سفارش یا شماره تماس"
            icon="search"
            @keyup.enter="reload"
          />
          <AdminSelect v-model="status" :options="statusOptions" />
          <AdminButton variant="secondary" size="sm" icon="refresh" @click="reload">
            اعمال فیلتر
          </AdminButton>
        </div>
      </template>

      <div v-if="loadError" class="orders-view__error">{{ loadError }}</div>

      <AdminTable :columns="columns" :rows="orders" :loading="loading">
        <template #cell-orderNumber="{ row }">
          <RouterLink class="orders-view__link" :to="`/orders/${row._id}`">
            {{ row.orderNumber }}
          </RouterLink>
        </template>
        <template #cell-customer="{ row }">
          {{ customerName(row) }}
        </template>
        <template #cell-total="{ value }">
          {{ formatPrice(value) }}
        </template>
        <template #cell-status="{ value }">
          <AdminBadge :variant="ORDER_STATUS_BADGE[value] || 'neutral'">
            {{ ORDER_STATUS_LABELS[value] || value }}
          </AdminBadge>
        </template>
        <template #cell-createdAt="{ value }">
          {{ formatDateTime(value) }}
        </template>
        <template #empty>سفارشی یافت نشد</template>
      </AdminTable>

      <template #footer>
        <AdminPagination v-model:page="page" :page-size="limit" :total="total" />
      </template>
    </AdminCard>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import AdminCard from '../../components/common/AdminCard.vue'
import AdminTable from '../../components/common/AdminTable.vue'
import AdminBadge from '../../components/common/AdminBadge.vue'
import AdminInput from '../../components/common/AdminInput.vue'
import AdminSelect from '../../components/common/AdminSelect.vue'
import AdminButton from '../../components/common/AdminButton.vue'
import AdminPagination from '../../components/common/AdminPagination.vue'
import { orderService } from '../../services/order.service'
import { formatPrice, formatDateTime } from '../../utils/format'
import { ORDER_STATUSES, ORDER_STATUS_LABELS, ORDER_STATUS_BADGE } from '../../constants/orderStatus'

const columns = [
  { key: 'orderNumber', label: 'شماره سفارش' },
  { key: 'customer', label: 'مشتری' },
  { key: 'total', label: 'مبلغ', align: 'end' },
  { key: 'status', label: 'وضعیت' },
  { key: 'createdAt', label: 'تاریخ ثبت' },
]

const statusOptions = [
  { value: '', label: 'همه وضعیت‌ها' },
  ...ORDER_STATUSES.map((value) => ({ value, label: ORDER_STATUS_LABELS[value] })),
]

const orders = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const search = ref('')
const status = ref('')
const loading = ref(false)
const loadError = ref('')

function customerName(row) {
  const user = row.userId
  if (!user || typeof user !== 'object') return '—'
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return name || user.phone || '—'
}

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await orderService.adminList({
      page: page.value,
      limit: limit.value,
      status: status.value || undefined,
      search: search.value || undefined,
    })
    orders.value = data?.items ?? []
    total.value = data?.total ?? 0
  } catch (error) {
    loadError.value = error.response?.data?.message || 'دریافت سفارش‌ها با خطا مواجه شد'
    orders.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function reload() {
  page.value = 1
  load()
}

watch(page, load)
watch(status, reload)
onMounted(load)
</script>

<style scoped>
.orders-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.orders-view__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}
.orders-view__filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  width: 100%;
}
.orders-view__filters :deep(.admin-field) {
  min-width: 200px;
}
.orders-view__link {
  color: var(--brand-light);
  font-weight: 700;
  text-decoration: none;
}
.orders-view__link:hover {
  text-decoration: underline;
}
.orders-view__error {
  margin: 16px 20px 0;
  font-size: 13px;
  color: #D9534F;
  background: rgba(217, 83, 79, .12);
  border: 1px solid rgba(217, 83, 79, .3);
  border-radius: 10px;
  padding: 12px 14px;
}
</style>
