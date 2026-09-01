<template>
  <AdminModal :modelValue="modelValue" :title="title" size="sm" persistent>
    <p class="text-text-secondary text-sm leading-6">{{ message }}</p>
    <template #footer>
      <div class="flex gap-3 justify-end">
        <AdminButton variant="ghost" @click="$emit('update:modelValue', false)">
          انصراف
        </AdminButton>
        <AdminButton :variant="confirmVariant" :loading="loading" @click="$emit('confirm')">
          {{ confirmLabel }}
        </AdminButton>
      </div>
    </template>
  </AdminModal>
</template>

<script setup>
import AdminModal  from './AdminModal.vue'
import AdminButton from './AdminButton.vue'

defineProps({
  modelValue:     { type: Boolean, default: false },
  title:          { type: String,  default: 'تأیید عملیات' },
  message:        { type: String,  default: 'آیا از انجام این عملیات مطمئن هستید؟' },
  confirmLabel:   { type: String,  default: 'تأیید' },
  confirmVariant: { type: String,  default: 'danger' },
  loading:        { type: Boolean, default: false },
})
defineEmits(['update:modelValue', 'confirm'])
</script>
