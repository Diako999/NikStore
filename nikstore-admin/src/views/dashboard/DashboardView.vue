<template>
  <div class="dashboard">
    <h1 class="dashboard__title">داشبورد</h1>

    <div v-if="statsError" class="dashboard__error">
      دریافت آمار با خطا مواجه شد. {{ statsError }}
    </div>

    <div class="dashboard__stats">
      <AdminCard class="stat-card">
        <p class="stat-card__label">درآمد کل</p>
        <p class="stat-card__value">
          <span v-if="loadingStats">—</span>
          <span v-else>{{ formatToman(dashboard?.revenue?.allTime) }}</span>
        </p>
      </AdminCard>
      <AdminCard class="stat-card">
        <p class="stat-card__label">درآمد این ماه</p>
        <p class="stat-card__value">
          <span v-if="loadingStats">—</span>
          <span v-else>{{ formatToman(dashboard?.revenue?.thisMonth) }}</span>
        </p>
      </AdminCard>
      <AdminCard class="stat-card">
        <p class="stat-card__label">کل سفارش‌ها</p>
        <p class="stat-card__value">
          <span v-if="loadingStats">—</span>
          <span v-else>{{ formatNumber(dashboard?.orders?.total) }}</span>
        </p>
      </AdminCard>
      <AdminCard class="stat-card stat-card--warning">
        <p class="stat-card__label">محصولات کم‌موجود</p>
        <p class="stat-card__value">
          <span v-if="loadingStats">—</span>
          <span v-else>{{ formatNumber(dashboard?.products?.lowStock) }}</span>
        </p>
      </AdminCard>
    </div>

    <div class="dashboard__panels">
      <AdminCard title="کم‌موجودی‌ترین محصولات" flush>
        <AdminTable :columns="lowStockColumns" :rows="lowStock" :loading="loadingLowStock">
          <template #cell-totalStock="{ value }">
            <AdminBadge variant="danger">{{ formatNumber(value) }} عدد</AdminBadge>
          </template>
          <template #empty>محصول کم‌موجودی وجود ندارد</template>
        </AdminTable>
      </AdminCard>

      <AdminCard title="پرفروش‌ترین محصولات" flush>
        <AdminTable :columns="topSellingColumns" :rows="topSelling" :loading="loadingTopSelling">
          <template #cell-soldCount="{ value }">
            {{ formatNumber(value) }}
          </template>
          <template #empty>هنوز فروشی ثبت نشده است</template>
        </AdminTable>
      </AdminCard>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import AdminCard from '../../components/common/AdminCard.vue'
import AdminTable from '../../components/common/AdminTable.vue'
import AdminBadge from '../../components/common/AdminBadge.vue'
import { adminService } from '../../services/admin.service'

const dashboard = ref(null)
const lowStock = ref([])
const topSelling = ref([])

const loadingStats = ref(true)
const loadingLowStock = ref(true)
const loadingTopSelling = ref(true)
const statsError = ref('')

const lowStockColumns = [
  { key: 'name', label: 'محصول' },
  { key: 'totalStock', label: 'موجودی', align: 'end' },
]
const topSellingColumns = [
  { key: 'name', label: 'محصول' },
  { key: 'soldCount', label: 'تعداد فروش', align: 'end' },
]

function formatToman(value) {
  if (value === undefined || value === null) return '—'
  return `${Number(value).toLocaleString('fa-IR')} تومان`
}

function formatNumber(value) {
  if (value === undefined || value === null) return '—'
  return Number(value).toLocaleString('fa-IR')
}

onMounted(async () => {
  try {
    const { data } = await adminService.getDashboard()
    dashboard.value = data
  } catch (error) {
    statsError.value = error.response?.data?.message || 'خطای غیرمنتظره'
  } finally {
    loadingStats.value = false
  }

  try {
    const { data } = await adminService.getLowStockProducts()
    lowStock.value = data ?? []
  } catch {
    lowStock.value = []
  } finally {
    loadingLowStock.value = false
  }

  try {
    const { data } = await adminService.getTopSellingProducts()
    topSelling.value = data ?? []
  } catch {
    topSelling.value = []
  } finally {
    loadingTopSelling.value = false
  }
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dashboard__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.dashboard__error {
  font-size: 13px;
  color: #D9534F;
  background: rgba(217, 83, 79, .12);
  border: 1px solid rgba(217, 83, 79, .3);
  border-radius: 10px;
  padding: 12px 14px;
}

.dashboard__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
@media (max-width: 1023px) {
  .dashboard__stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card {
  padding: 4px;
}
.stat-card :deep(.admin-card__body) {
  padding: 18px 20px;
}
.stat-card__label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.stat-card__value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}
.stat-card--warning .stat-card__value {
  color: #D9534F;
}

.dashboard__panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
@media (max-width: 1023px) {
  .dashboard__panels {
    grid-template-columns: 1fr;
  }
}
</style>
