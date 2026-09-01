<template>
  <input
    v-bind="$attrs"
    type="text"
    dir="ltr"
    inputmode="numeric"
    :value="displayValue"
    :placeholder="formattedPlaceholder"
    @focus="onFocus"
    @blur="onBlur"
    @input="onInput"
    @keydown="onKeydown"
  />
</template>

<script setup>
import { ref, computed, watch } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: Number, default: null },
  placeholder: { type: [String, Number], default: null },
})

const emit = defineEmits(['update:modelValue'])

const focused    = ref(false)
const rawString  = ref(props.modelValue != null ? String(props.modelValue) : '')

watch(() => props.modelValue, (v) => {
  if (!focused.value) rawString.value = v != null ? String(v) : ''
})

function separate(num) {
  if (num === '' || num == null) return ''
  return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, '،')
}

const displayValue = computed(() =>
  focused.value ? rawString.value : separate(rawString.value),
)

const formattedPlaceholder = computed(() =>
  props.placeholder != null ? separate(props.placeholder) : undefined,
)

function onFocus(e) {
  focused.value = true
  // Cursor at end after Vue updates DOM
  setTimeout(() => {
    e.target.setSelectionRange(e.target.value.length, e.target.value.length)
  }, 0)
}

function onBlur() {
  focused.value = false
  const n = parseInt(rawString.value, 10)
  if (isNaN(n) || rawString.value === '') {
    rawString.value = ''
    emit('update:modelValue', null)
  } else {
    rawString.value = String(n)
    emit('update:modelValue', n)
  }
}

function onInput(e) {
  // Strip everything except digits
  const digits = e.target.value.replace(/\D/g, '')
  rawString.value = digits
  // Keep cursor position stable
  const pos = e.target.selectionStart - (e.target.value.length - digits.length)
  e.target.value = digits
  e.target.setSelectionRange(pos, pos)
  emit('update:modelValue', digits === '' ? null : parseInt(digits, 10))
}

function onKeydown(e) {
  // Allow: digits, backspace, delete, arrows, tab, home, end, ctrl+a/c/v/x
  const allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab','Home','End','Enter']
  if (allowed.includes(e.key)) return
  if ((e.ctrlKey || e.metaKey) && ['a','c','v','x'].includes(e.key.toLowerCase())) return
  if (!/^\d$/.test(e.key)) e.preventDefault()
}
</script>
