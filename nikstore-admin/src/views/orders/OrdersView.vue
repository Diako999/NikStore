<template>
  <div class="space-y-4">

    <div class="flex items-center justify-between">
      <div>
        <h1 class="page-title">سفارشات</h1>
        <p v-if="!loading" class="text-text-secondary text-sm mt-0.5 font-fanum">
          {{ formatNumber(total) }} سفارش
        </p>
      </div>
    </div>

    <OrderFilters :loading="loading" @change="onFilterChange" />

    <div class="admin-card p-0 overflow-hidden">
      <AdminTable
        :columns="columns"
        :rows="orders"
        :loading="loading"
        :skeleton-rows="10"
        empty-text="سفارشی یافت نشد"
      >

        <template #cell-orderNumber="{ row }">
          <RouterLink
            :to="{ name: 'order-detail', params: { id: row._id } }"
            class="font-bold text-primary hover:underline text-sm font-fanum"
            dir="ltr"
          >
            {{ row.orderNumber }}
          </RouterLink>
        </template>

        <template #cell-user="{ row }">
          <div>
            <p class="font-medium text-text-primary text-sm">
              {{ row.userId?.firstName ?? '' }} {{ row.userId?.lastName ?? '' }}
            </p>
            <p class="text-text-disabled text-xs font-fanum" dir="ltr">{{ row.userId?.phone }}</p>
          </div>
        </template>

        <template #cell-total="{ row }">
          <span class="font-fanum font-bold text-text-primary text-sm">
            {{ formatPrice(row.total) }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <AdminBadge :variant="ORDER_STATUSES[row.status]?.color ?? 'gray'" size="sm">
            {{ ORDER_STATUSES[row.status]?.label ?? row.status }}
          </AdminBadge>
        </template>

        <template #cell-createdAt="{ row }">
          <span class="text-text-secondary text-xs font-fanum">
            {{ formatDate(row.createdAt) }}
          </span>
        </template>

        <template #cell-action="{ row }">
          <RouterLink
            :to="{ name: 'order-detail', params: { id: row._id } }"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors mx-auto"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </RouterLink>
        </template>

      </AdminTable>
    </div>

    <AdminPagination
      v-model="page"
      :total-pages="totalPages"
      :loading="loading"
      @update:modelValue="fetchOrders"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { orderService }   from '@/services/order.service'
import { useUiStore }     from '@/stores/ui.store'
import { formatPrice, formatNumber, formatDate } from '@/utils/formatters'
import { ORDER_STATUSES, ITEMS_PER_PAGE }        from '@/utils/constants'

import OrderFilters    from './components/OrderFilters.vue'
import AdminTable      from '@/components/common/AdminTable.vue'
import AdminBadge      from '@/components/common/AdminBadge.vue'
import AdminPagination from '@/components/common/AdminPagination.vue'

const ui = useUiStore()

const orders        = ref([])
const loading       = ref(true)
const total         = ref(0)
const page          = ref(1)
const activeFilters = ref({})

const totalPages = computed(() => Math.ceil(total.value / ITEMS_PER_PAGE))

const columns = [
  { key: 'orderNumber', label: 'شماره سفارش', width: '180px' },
  { key: 'user',        label: 'مشتری',        width: '180px' },
  { key: 'total',       label: 'مبلغ کل',       width: '140px', align: 'center', sortable: true },
  { key: 'status',      label: 'وضعیت',         width: '120px', align: 'center' },
  { key: 'createdAt',   label: 'تاریخ ثبت',      width: '130px' },
  { key: 'action',      label: '',              width: '60px',  align: 'center' },
]

async function fetchOrders() {
  loading.value = true
  try {
    const { data } = await orderService.getAll({
      page:  page.value,
      limit: ITEMS_PER_PAGE,
      ...activeFilters.value,
    })
    orders.value = data?.items ?? []
    total.value  = data?.total ?? 0
  } catch {
    ui.addToast('خطا در بارگذاری سفارشات', 'error')
  } finally {
    loading.value = false
  }
}

function onFilterChange(filters) {
  activeFilters.value = filters
  page.value = 1
  fetchOrders()
}

onMounted(fetchOrders)
</script>
