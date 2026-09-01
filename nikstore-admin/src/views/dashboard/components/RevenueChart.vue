<template>
  <div class="admin-card">

    <!-- Header -->
    <div class="flex items-center justify-between mb-5">
      <h3 class="section-title">درآمد ۷ روز اخیر</h3>
      <div class="flex items-center gap-4 text-xs text-text-secondary">
        <span class="flex items-center gap-1.5">
          <span class="w-3 h-0.5 bg-primary inline-block rounded" />
          درآمد
        </span>
        <span class="flex items-center gap-1.5">
          <span class="w-3 h-0.5 bg-success inline-block rounded" />
          سفارشات
        </span>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="flex items-end gap-2 h-48">
      <AdminSkeleton
        v-for="i in 7"
        :key="i"
        width="100%"
        :height="`${skeletonHeights[i - 1]}%`"
        class="rounded-lg"
      />
    </div>

    <!-- Chart -->
    <div v-else-if="hasData" class="h-56 relative">
      <Line :data="chartData" :options="chartOptions" />
    </div>

    <!-- Empty -->
    <div v-else class="h-56 flex flex-col items-center justify-center text-text-disabled">
      <span class="text-4xl mb-2">📈</span>
      <p class="text-sm">داده‌ای برای نمایش وجود ندارد</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import AdminSkeleton from '@/components/common/AdminSkeleton.vue'
import { formatNumber } from '@/utils/formatters'
import { useThemeMode } from '@/composables/useThemeMode'
import { resolveThemeColor } from '@/utils/chartTheme'

const props = defineProps({
  data:    { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false },
})

// Bug fix: this chart used to hardcode a blue (#1B4F8A) unrelated to the
// brand green. Resolve --brand/--text-secondary to literal colors (Chart.js
// needs real strings, not CSS var refs) — mode.value is read here purely so
// this computed re-runs and re-resolves when the theme toggles.
const { mode } = useThemeMode()
const themeColors = computed(() => {
  void mode.value
  return {
    brand:     resolveThemeColor('--brand', '#3D8B52'),
    brandSoft: resolveThemeColor('--brand', '#3D8B52', 0.1),
    axis:      resolveThemeColor('--text-secondary', '#94A3B8'),
    grid:      resolveThemeColor('--glass-border', '#F1F5F9'),
  }
})

const hasData = computed(() => props.data?.length > 0)

// Fixed skeleton heights so there's no reactivity issue with Math.random in template
const skeletonHeights = [55, 70, 45, 80, 60, 90, 65]

function toPersianDay(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('fa-IR', {
    weekday: 'short', month: 'numeric', day: 'numeric',
  }).format(new Date(iso))
}

const chartData = computed(() => ({
  labels: props.data.map(d => toPersianDay(d.date)),
  datasets: [
    {
      label:               'درآمد (تومان)',
      data:                props.data.map(d => d.revenue ?? 0),
      borderColor:         themeColors.value.brand,
      backgroundColor:     themeColors.value.brandSoft,
      borderWidth:         2.5,
      pointRadius:         4,
      pointHoverRadius:    6,
      pointBackgroundColor:themeColors.value.brand,
      fill:                true,
      tension:             0.4,
      yAxisID:             'y',
    },
    {
      label:               'سفارشات',
      data:                props.data.map(d => d.orders ?? 0),
      borderColor:         '#10B981',
      backgroundColor:     'rgba(16, 185, 129, 0)',
      borderWidth:         2,
      pointRadius:         3,
      pointHoverRadius:    5,
      pointBackgroundColor:'#10B981',
      fill:                false,
      tension:             0.4,
      yAxisID:             'y1',
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive:          true,
  maintainAspectRatio: false,
  interaction:         { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          if (ctx.datasetIndex === 0)
            return ` درآمد: ${formatNumber(ctx.raw)} تومان`
          return ` سفارشات: ${formatNumber(ctx.raw)}`
        },
      },
    },
  },
  scales: {
    x: {
      grid:  { display: false },
      ticks: { font: { size: 11 }, color: themeColors.value.axis },
    },
    y: {
      position: 'right',
      grid:     { color: themeColors.value.grid, drawBorder: false },
      ticks:    { font: { size: 11 }, color: themeColors.value.axis, callback: v => formatNumber(v) },
    },
    y1: {
      position: 'left',
      grid:     { display: false },
      ticks:    { font: { size: 11 }, color: '#10B981', callback: v => formatNumber(v) },
    },
  },
}))
</script>
