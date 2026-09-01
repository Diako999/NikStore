<template>
  <div>
    <!-- Tag chips -->
    <div v-if="modelValue.length" class="flex flex-wrap gap-2 mb-2">
      <span
        v-for="tag in modelValue"
        :key="tag"
        class="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-medium"
      >
        {{ tag }}
        <button @click="remove(tag)" class="hover:text-primary-dark transition-colors ml-0.5">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </span>
    </div>

    <!-- Input row -->
    <div class="flex gap-2">
      <input
        v-model="inputValue"
        type="text"
        placeholder="تگ بنویسید و Enter بزنید..."
        class="field-input flex-1 text-sm"
        @keydown.enter.prevent="add"
        @keydown.,,prevent="add"
        @keydown.tab.prevent="add"
      />
      <AdminButton variant="secondary" size="sm" @click="add">+ افزودن</AdminButton>
    </div>
    <p class="text-text-disabled text-xs mt-1">Enter یا ویرگول برای افزودن تگ</p>

    <!-- Preset tags -->
    <div v-if="presetTags.length" class="mt-3">
      <p class="text-text-disabled text-xs mb-2">تگ‌های پیشنهادی:</p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="tag in presetTags"
          :key="tag"
          type="button"
          :disabled="modelValue.includes(tag)"
          :class="[
            'text-xs px-2.5 py-1 rounded-full border transition-all',
            modelValue.includes(tag)
              ? 'border-primary/20 text-primary/30 bg-primary/5 cursor-default'
              : 'border-border text-text-secondary hover:border-primary hover:text-primary hover:bg-primary/5 cursor-pointer',
          ]"
          @click="addPreset(tag)"
        >
          {{ tag }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AdminButton from '@/components/common/AdminButton.vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  presetTags: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

const inputValue = ref('')

function add() {
  const tag = inputValue.value.trim().replace(/,/g, '')
  if (tag && !props.modelValue.includes(tag)) {
    emit('update:modelValue', [...props.modelValue, tag])
  }
  inputValue.value = ''
}

function addPreset(tag) {
  if (!props.modelValue.includes(tag)) {
    emit('update:modelValue', [...props.modelValue, tag])
  }
}

function remove(tag) {
  emit('update:modelValue', props.modelValue.filter(t => t !== tag))
}
</script>
