<template>
  <div class="admin-card">
    <h3 class="section-title mb-5">پرفروش‌ترین محصولات</h3>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="(h, i) in skeletonWidths" :key="i" class="flex items-center gap-3">
        <AdminSkeleton height="0.875rem" :width="h.label" />
        <AdminSkeleton height="28px" :width="h.bar" class="rounded-lg flex-shrink-0" />
      </div>
    </div>

    <!-- Chart -->
    <div v-else-if="data?.length" class="h-52 relative">
      <Bar :data="chartData" :options="chartOptions" />
    </div>

    <!-- Empty -->
    <div v-else class="h-52 flex flex-col items-center justify-center text-text-disabled">
      <span class="text-4xl mb-2">📦</span>
      <p class="text-sm">داده‌ای موجود نیست</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import AdminSkeleton from '@/components/common/AdminSkeleton.vue'
import { truncate, formatNumber } from '@/utils/formatters'
import { useThemeMode } from '@/composables/useThemeMode'
import { resolveThemeColor } from '@/utils/chartTheme'

const props = defineProps({
  data:    { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false },
})

// Fixed skeleton widths (avoid Math.random in template)
const skeletonWidths = [
  { label: '55%', bar: '80%' },
  { label: '70%', bar: '65%' },
  { label: '45%', bar: '90%' },
  { label: '60%', bar: '50%' },
  { label: '50%', bar: '70%' },
]

// Bug fix: this chart used to hardcode a blue (#1B4F8A) unrelated to the
// brand green. Resolve --brand to a literal color at init (Chart.js needs
// real strings, not CSS var refs) and re-resolve on theme toggle.
const { mode } = useThemeMode()
const themeColors = computed(() => {
  void mode.value
  return {
    bars: [0.85, 0.70, 0.55, 0.40, 0.30].map(a => resolveThemeColor('--brand', '#3D8B52', a)),
    axis: resolveThemeColor('--text-secondary', '#94A3B8'),
    text: resolveThemeColor('--text-primary', '#374151'),
    grid: resolveThemeColor('--glass-border', '#F1F5F9'),
  }
})

const chartData = computed(() => ({
  labels: props.data.map(p => truncate(p.name, 18)),
  datasets: [{
    label:           'تعداد فروش',
    data:            props.data.map(p => p.totalSold ?? 0),
    backgroundColor: themeColors.value.bars,
    borderRadius:    6,
    borderWidth:     0,
  }],
}))

const chartOptions = computed(() => ({
  indexAxis:           'y',
  responsive:          true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${formatNumber(ctx.raw)} عدد فروخته شده`,
      },
    },
  },
  scales: {
    x: {
      grid:  { color: themeColors.value.grid, drawBorder: false },
      ticks: { font: { size: 11 }, color: themeColors.value.axis, callback: v => formatNumber(v) },
    },
    y: {
      grid:  { display: false },
      ticks: { font: { size: 11 }, color: themeColors.value.text },
    },
  },
}))
</script>
