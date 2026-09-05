<template>
  <AdminModal v-model="open" :title="title" width="400px" :close-on-backdrop="!loading">
    <p class="admin-confirm__message">{{ message }}</p>
    <template #footer>
      <AdminButton variant="secondary" size="sm" :disabled="loading" @click="handleCancel">
        {{ cancelText }}
      </AdminButton>
      <AdminButton
        :variant="danger ? 'danger' : 'primary'"
        size="sm"
        :loading="loading"
        @click="$emit('confirm')"
      >
        {{ confirmText }}
      </AdminButton>
    </template>
  </AdminModal>
</template>

<script setup>
import AdminModal from './AdminModal.vue'
import AdminButton from './AdminButton.vue'

defineProps({
  title: { type: String, default: 'تایید عملیات' },
  message: { type: String, default: 'آیا از انجام این عملیات مطمئن هستید؟' },
  confirmText: { type: String, default: 'تایید' },
  cancelText: { type: String, default: 'انصراف' },
  danger: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel'])

const open = defineModel({ type: Boolean, default: false })

function handleCancel() {
  emit('cancel')
  open.value = false
}
</script>

<style scoped>
.admin-confirm__message {
  font-size: 13.5px;
  color: var(--text-secondary);
  line-height: 1.7;
}
</style>
