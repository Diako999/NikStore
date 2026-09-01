<template>
  <div class="admin-card">
    <h3 class="section-title mb-5">وضعیت سفارشات</h3>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center h-52">
      <AdminSkeleton circle width="160px" height="160px" />
    </div>

    <!-- Chart + legend -->
    <div v-else-if="total > 0">
      <div class="h-44 relative">
        <Doughnut :data="chartData" :options="chartOptions" />
      </div>

      <div class="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
        <div
          v-for="(item, i) in legendItems"
          :key="item.key"
          class="flex items-center gap-2"
        >
          <span
            class="w-2.5 h-2.5 rounded-full flex-shrink-0"
            :style="{ backgroundColor: COLORS[i] }"
          />
          <span class="text-xs text-text-secondary truncate">{{ item.label }}</span>
          <span class="text-xs font-bold font-fanum text-text-primary mr-auto">
            {{ formatNumber(item.value) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else class="h-52 flex flex-col items-center justify-center text-text-disabled">
      <span class="text-4xl mb-2">🍩</span>
      <p class="text-sm">هنوز سفارشی ثبت نشده</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import AdminSkeleton from '@/components/common/AdminSkeleton.vue'
import { formatNumber } from '@/utils/formatters'
import { ORDER_STATUSES } from '@/utils/constants'
import { useThemeMode } from '@/composables/useThemeMode'
import { resolveThemeColor } from '@/utils/chartTheme'

// Bug fix: the slice border used to be a hardcoded '#ffffff', which breaks
// (a solid white ring) on a dark card. Resolve the current card background
// so the border blends with the surface instead, in both themes.
const { mode } = useThemeMode()
const sliceBorderColor = computed(() => {
  void mode.value
  return resolveThemeColor('--color-card', '#ffffff')
})

const props = defineProps({
  data:    { type: Object,  default: () => ({}) },
  loading: { type: Boolean, default: false },
})

const COLORS = ['#F59E0B', '#3B82F6', '#8B5CF6', '#6366F1', '#10B981', '#EF4444']
const STATUS_KEYS = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']

const legendItems = computed(() =>
  STATUS_KEYS.map((key, i) => ({
    key,
    label: ORDER_STATUSES[key]?.label ?? key,
    value: props.data[key] ?? 0,
    color: COLORS[i],
  })).filter(i => i.value > 0)
)

const total = computed(() =>
  STATUS_KEYS.reduce((s, k) => s + (props.data[k] ?? 0), 0)
)

const chartData = computed(() => ({
  labels: legendItems.value.map(i => i.label),
  datasets: [{
    data:             legendItems.value.map(i => i.value),
    backgroundColor:  legendItems.value.map(i => i.color),
    borderWidth:      2,
    borderColor:      sliceBorderColor.value,
    hoverBorderWidth: 3,
    hoverOffset:      6,
  }],
}))

const chartOptions = {
  responsive:          true,
  maintainAspectRatio: false,
  cutout:              '68%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.label}: ${formatNumber(ctx.raw)} سفارش`,
      },
    },
  },
}
</script>
