<template>
  <div v-if="timeLeft" class="countdown-timer bg-red-50 border border-red-200 rounded-lg p-3">
    <p class="text-sm text-red-600 mb-2 text-center">⏰ پایان تخفیف تا:</p>
    <div class="flex gap-2 justify-center">
      <div v-for="unit in units" :key="unit.label" class="time-unit text-center">
        <span class="block text-2xl font-bold text-red-600 font-fanum">{{ unit.value }}</span>
        <span class="text-xs text-gray-500">{{ unit.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  endDate: { type: String, required: true },
})

const timeLeft = ref(null)
let timer = null

const { getTimeRemaining } = useDiscount()

const units = computed(() => {
  if (!timeLeft.value) return []
  return [
    { value: String(timeLeft.value.days).padStart(2, '0'),    label: 'روز' },
    { value: String(timeLeft.value.hours).padStart(2, '0'),   label: 'ساعت' },
    { value: String(timeLeft.value.minutes).padStart(2, '0'), label: 'دقیقه' },
    { value: String(timeLeft.value.seconds).padStart(2, '0'), label: 'ثانیه' },
  ]
})

onMounted(() => {
  const update = () => { timeLeft.value = getTimeRemaining(props.endDate) }
  update()
  timer = setInterval(update, 1000)
})

onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.time-unit { min-width: 3rem; }
</style>
