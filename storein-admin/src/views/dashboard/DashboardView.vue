<template>
  <div class="space-y-5">

    <!-- ① Header: welcome + date + refresh -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-black text-text-primary">
          خوش آمدید، {{ adminName }} 👋
        </h1>
        <p class="text-text-secondary text-sm mt-0.5 font-fanum">
          {{ todayDatePersian }}
        </p>
      </div>

      <button
        @click="loadAll"
        :class="[
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
          'border border-border text-text-secondary',
          'hover:border-primary hover:text-primary transition-all',
          loading ? 'opacity-70' : '',
        ]"
      >
        <svg
          :class="['w-4 h-4', loading ? 'animate-spin' : '']"
          fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0
               0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        بروزرسانی
      </button>
    </div>

    <!-- ② Quick actions -->
    <QuickActions
      :pending-orders="ui.pendingOrdersCount"
      :pending-reviews="ui.pendingReviewsCount"
    />

    <!-- ③ Stat cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        icon="💰" title="درآمد کل" color="blue" :loading="loading"
        :value="formatPrice(stats.overview?.totalRevenue)"
        sub-label="این ماه"
        :sub-value="formatPrice(stats.overview?.monthRevenue)"
      />
      <StatCard
        icon="📦" title="کل سفارشات" color="purple" :loading="loading"
        :value="formatNumber(stats.overview?.totalOrders)"
        sub-label="در انتظار"
        :sub-value="formatNumber(stats.overview?.pendingOrders)"
        :to="{ name: 'orders' }"
      />
      <StatCard
        icon="👥" title="کاربران" color="green" :loading="loading"
        :value="formatNumber(stats.overview?.totalUsers)"
        sub-label="سفارش امروز"
        :sub-value="formatNumber(stats.overview?.todayOrders)"
        :to="{ name: 'users' }"
      />
      <StatCard
        icon="🏪" title="محصولات" color="yellow" :loading="loading"
        :value="formatNumber(stats.overview?.totalProducts)"
        sub-label="درآمد امروز"
        :sub-value="formatPrice(stats.overview?.todayRevenue)"
        :to="{ name: 'products' }"
      />
    </div>

    <!-- ③ Revenue chart (3/5) + Order status doughnut (2/5) -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div class="lg:col-span-3">
        <RevenueChart :data="stats.revenueByDay ?? []" :loading="loading" />
      </div>
      <div class="lg:col-span-2">
        <OrderStatusChart :data="stats.orderStatusStats ?? {}" :loading="loading" />
      </div>
    </div>

    <!-- ④ Recent orders (3/5) + Top products bar (2/5) -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div class="lg:col-span-3">
        <RecentOrdersTable :orders="stats.recentOrders ?? []" :loading="loading" />
      </div>
      <div class="lg:col-span-2">
        <TopProductsChart :data="stats.topProducts ?? []" :loading="loading" />
      </div>
    </div>


  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore }       from '@/stores/auth.store'
import { useUiStore }         from '@/stores/ui.store'
import { dashboardService }   from '@/services/dashboard.service'
import { reviewService }      from '@/services/review.service'
import { formatPrice, formatNumber } from '@/utils/formatters'

import StatCard          from './components/StatCard.vue'
import RevenueChart      from './components/RevenueChart.vue'
import OrderStatusChart  from './components/OrderStatusChart.vue'
import TopProductsChart  from './components/TopProductsChart.vue'
import RecentOrdersTable from './components/RecentOrdersTable.vue'
import QuickActions      from './components/QuickActions.vue'

const auth = useAuthStore()
const ui   = useUiStore()

const loading = ref(true)
const stats   = ref({})

const adminName = computed(() => auth.user?.firstName || 'مدیر')

const todayDatePersian = computed(() =>
  new Intl.DateTimeFormat('fa-IR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date())
)

async function loadStats() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const today        = new Date().toISOString().slice(0, 10)

  const [dashRes, revenueRes, orderStatsRes, recentRes, topRes] = await Promise.allSettled([
    dashboardService.getStats(),
    dashboardService.getRevenue({ from: sevenDaysAgo, to: today }),
    dashboardService.getOrderStats(),
    dashboardService.getRecentOrders(10),
    dashboardService.getTopProducts(10),
  ])

  const dash       = dashRes.status       === 'fulfilled' ? (dashRes.value?.data       ?? {}) : {}
  const revenue    = revenueRes.status    === 'fulfilled' ? (revenueRes.value?.data    ?? {}) : {}
  const orderStats = orderStatsRes.status === 'fulfilled' ? (orderStatsRes.value?.data ?? {}) : {}
  const recent     = recentRes.status     === 'fulfilled' ? (recentRes.value?.data     ?? []) : []
  const top        = topRes.status        === 'fulfilled' ? (topRes.value?.data        ?? []) : []

  const pendingOrders = dash.orders?.pending ?? 0
  stats.value = {
    overview: {
      totalRevenue:  dash.revenue?.allTime   ?? 0,
      monthRevenue:  dash.revenue?.thisMonth ?? 0,
      todayRevenue:  dash.revenue?.today     ?? 0,
      totalOrders:   dash.orders?.total      ?? 0,
      pendingOrders,
      todayOrders:   orderStats.today        ?? 0,
      totalUsers:    dash.users?.total       ?? 0,
      totalProducts: dash.products?.total    ?? 0,
    },
    revenueByDay:     (revenue.byDay ?? []).map(d => ({ date: d.date, revenue: d.amount ?? 0, orders: d.count ?? 0 })),
    orderStatusStats: dash.orders        ?? {},
    recentOrders:     Array.isArray(recent) ? recent : [],
    topProducts:      Array.isArray(top)    ? top    : [],
  }
  ui.setPendingOrdersCount(pendingOrders)
}

async function loadPendingReviews() {
  try {
    const res = await reviewService.getAll({ status: 'pending', limit: 1 })
    ui.setPendingReviewsCount(res.data?.total ?? res.data ?? 0)
  } catch { /* non-critical */ }
}

async function loadAll() {
  loading.value = true
  try {
    await Promise.allSettled([
      loadStats(),
      loadPendingReviews(),
    ])
  } catch {
    ui.addToast('خطا در بارگذاری داشبورد', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAll()
})
</script>
