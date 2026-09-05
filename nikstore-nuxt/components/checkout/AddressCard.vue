<template>
  <button
    type="button"
    class="addr-card"
    :class="{ 'addr-card--selected': selected }"
    @click="$emit('select')"
  >
    <span class="addr-card__radio" aria-hidden="true">
      <AppIcon v-if="selected" name="check" :size="12" :stroke-width="2.5" />
    </span>

    <span class="addr-card__body">
      <span class="addr-card__top">
        <span class="addr-card__title">{{ address.title }}</span>
        <span v-if="address.isDefault" class="addr-card__badge">پیش‌فرض</span>
      </span>
      <span class="addr-card__line">{{ address.province }}، {{ address.city }}، {{ address.street }}</span>
      <span class="addr-card__line addr-card__line--muted">{{ address.detail }}</span>
      <span class="addr-card__recipient">{{ address.recipientName }} · {{ toPersianDigits(address.recipientPhone) }}</span>
    </span>
  </button>
</template>

<script setup>
import AppIcon from '~/components/icons/AppIcon.vue'
import { toPersianDigits } from '~/utils/format'

defineProps({
  address: { type: Object, required: true },
  selected: { type: Boolean, default: false },
})

defineEmits(['select'])
</script>

<style scoped>
.addr-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  text-align: start;
  padding: 14px;
  border-radius: 16px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  cursor: pointer;
  color: inherit;
  font: inherit;
  transition: border-color .15s ease;
}
[data-theme='light'] .addr-card {
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  box-shadow: var(--glass-shadow);
}
.addr-card--selected {
  border-color: var(--brand-light);
}
[data-theme='light'] .addr-card--selected {
  border-color: var(--brand-dark);
}

.addr-card__radio {
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  margin-top: 2px;
  border-radius: 50%;
  border: 1.5px solid var(--glass-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.addr-card--selected .addr-card__radio {
  background: var(--brand);
  border-color: var(--brand);
}

.addr-card__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.addr-card__top { display: flex; align-items: center; gap: 8px; }
.addr-card__title { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.addr-card__badge {
  font-size: 9.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  color: var(--brand-light);
  background: rgba(110, 176, 130, .16);
}
[data-theme='light'] .addr-card__badge { color: var(--brand-dark); background: rgba(61, 139, 82, .14); }

.addr-card__line { font-size: 11.5px; color: var(--text-secondary); line-height: 1.5; }
.addr-card__line--muted { color: var(--text-disabled); }
.addr-card__recipient { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
</style>
