<template>
  <div class="admin-card">

    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="section-title">سفارشات اخیر</h3>
      <RouterLink
        :to="{ name: 'orders' }"
        class="text-primary text-xs font-medium hover:underline flex items-center gap-1"
      >
        مشاهده همه
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M15 19l-7-7 7-7"/>
        </svg>
      </RouterLink>
    </div>

    <AdminTable
      :columns="columns"
      :rows="orders"
      :loading="loading"
      :skeleton-rows="5"
      empty-text="هنوز سفارشی ثبت نشده است"
      row-key="_id"
    >

      <template #cell-orderNumber="{ row }">
        <RouterLink
          :to="{ name: 'order-detail', params: { id: row._id } }"
          class="text-primary hover:underline font-medium text-xs font-fanum"
        >
          {{ row.orderNumber }}
        </RouterLink>
      </template>

      <template #cell-user="{ row }">
        <div>
          <p class="text-text-primary text-xs font-medium">
            {{ row.user?.firstName ?? '' }} {{ row.user?.lastName ?? '' }}
          </p>
          <p class="text-text-disabled text-xs font-fanum" dir="ltr">
            {{ row.user?.phone ?? '' }}
          </p>
        </div>
      </template>

      <template #cell-status="{ row }">
        <AdminBadge :variant="ORDER_STATUSES[row.status]?.color ?? 'gray'" size="sm">
          {{ ORDER_STATUSES[row.status]?.label ?? row.status }}
        </AdminBadge>
      </template>

      <template #cell-total="{ row }">
        <span class="font-fanum font-bold text-text-primary text-xs">
          {{ formatPrice(row.total) }}
        </span>
      </template>

      <template #cell-createdAt="{ row }">
        <span class="font-fanum text-text-secondary text-xs">
          {{ formatDate(row.createdAt) }}
        </span>
      </template>

      <template #cell-action="{ row }">
        <RouterLink
          :to="{ name: 'order-detail', params: { id: row._id } }"
          class="text-primary hover:text-primary-dark transition-colors flex justify-center"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
        </RouterLink>
      </template>

    </AdminTable>
  </div>
</template>

<script setup>
import AdminTable from '@/components/common/AdminTable.vue'
import AdminBadge from '@/components/common/AdminBadge.vue'
import { ORDER_STATUSES } from '@/utils/constants'
import { formatPrice, formatDate } from '@/utils/formatters'

defineProps({
  orders:  { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false },
})

const columns = [
  { key: 'orderNumber', label: 'شماره سفارش', width: '140px' },
  { key: 'user',        label: 'مشتری',        width: '150px' },
  { key: 'status',      label: 'وضعیت',        width: '110px', align: 'center' },
  { key: 'total',       label: 'مبلغ',          width: '130px', align: 'center' },
  { key: 'createdAt',   label: 'تاریخ',         width: '120px' },
  { key: 'action',      label: '',              width: '48px',  align: 'center' },
]
</script>
