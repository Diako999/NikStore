<template>
  <div class="admin-card">
    <h3 class="section-title mb-4">تغییر وضعیت سفارش</h3>

    <!-- Visual stepper (excludes cancelled) -->
    <div class="flex items-center mb-5 overflow-x-auto py-2 scrollbar-hide">
      <template v-for="(step, idx) in statusSteps" :key="step.value">
        <div class="flex flex-col items-center flex-shrink-0">
          <div :class="[
            'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-200',
            stepState(step.value) === 'done'
              ? 'bg-success border-success text-white'
              : stepState(step.value) === 'current'
                ? 'bg-primary border-primary text-white scale-110 shadow-md'
                : 'bg-card border-border text-text-disabled',
          ]">
            <svg v-if="stepState(step.value) === 'done'" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M5 13l4 4L19 7"/>
            </svg>
            <span v-else class="text-xs">{{ idx + 1 }}</span>
          </div>
          <span class="text-xs mt-1.5 whitespace-nowrap"
            :class="stepState(step.value) === 'current' ? 'text-primary font-bold' : 'text-text-disabled'">
            {{ step.label }}
          </span>
        </div>

        <div v-if="idx < statusSteps.length - 1"
          :class="['h-0.5 flex-1 mx-2 rounded transition-colors duration-200 mb-5',
            isStepPassed(step.value) ? 'bg-success' : 'bg-border']"
        />
      </template>
    </div>

    <!-- Select + button -->
    <div class="flex items-end gap-3">
      <div class="flex-1">
        <label class="field-label">وضعیت جدید</label>
        <AdminSelect v-model="selectedStatus" :options="allowedTransitions" placeholder="وضعیت را انتخاب کنید" />
      </div>
      <AdminButton
        :loading="loading"
        :disabled="!selectedStatus || selectedStatus === currentStatus"
        @click="$emit('updated', selectedStatus)"
      >
        ثبت تغییر
      </AdminButton>
    </div>

    <p v-if="selectedStatus === 'cancelled'" class="text-warning text-xs mt-2 flex items-center gap-1">
      <span>⚠️</span> لغو سفارش برگشت‌ناپذیر است
    </p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AdminSelect from '@/components/common/AdminSelect.vue'
import AdminButton from '@/components/common/AdminButton.vue'
import { ORDER_STATUSES } from '@/utils/constants'

const props = defineProps({
  currentStatus: String,
  orderId:       String,
  loading:       Boolean,
})
defineEmits(['updated'])

const selectedStatus = ref('')

const statusSteps = [
  { value: 'pending',    label: 'در انتظار' },
  { value: 'paid',       label: 'پرداخت شده' },
  { value: 'processing', label: 'پردازش' },
  { value: 'shipped',    label: 'ارسال شده' },
  { value: 'delivered',  label: 'تحویل داده' },
]
const stepOrder = statusSteps.map(s => s.value)

function stepState(value) {
  const ci = stepOrder.indexOf(props.currentStatus)
  const ti = stepOrder.indexOf(value)
  if (ti < ci)  return 'done'
  if (ti === ci) return 'current'
  return 'upcoming'
}
function isStepPassed(value) {
  return stepOrder.indexOf(value) < stepOrder.indexOf(props.currentStatus)
}

const allowedTransitions = computed(() => {
  const all = Object.entries(ORDER_STATUSES).map(([v, d]) => ({ value: v, label: d.label }))
  if (['paid', 'processing', 'shipped', 'delivered'].includes(props.currentStatus)) {
    return all.filter(o => o.value !== 'pending')
  }
  return all
})
</script>
