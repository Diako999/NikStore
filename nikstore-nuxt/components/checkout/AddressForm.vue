<template>
  <form class="addr-form" @submit.prevent="submit">
    <div class="addr-form__grid">
      <label class="addr-field">
        <span>عنوان آدرس</span>
        <input v-model.trim="form.title" type="text" placeholder="مثلا خانه، محل کار" required maxlength="30">
      </label>

      <label class="addr-field">
        <span>نام گیرنده</span>
        <input v-model.trim="form.recipientName" type="text" required maxlength="60">
      </label>

      <label class="addr-field">
        <span>شماره تماس گیرنده</span>
        <input v-model.trim="form.recipientPhone" type="tel" inputmode="numeric" placeholder="09xxxxxxxxx" required>
      </label>

      <label class="addr-field">
        <span>استان</span>
        <input v-model.trim="form.province" type="text" required maxlength="50">
      </label>

      <label class="addr-field">
        <span>شهر</span>
        <input v-model.trim="form.city" type="text" required maxlength="50">
      </label>

      <label class="addr-field addr-field--full">
        <span>خیابان</span>
        <input v-model.trim="form.street" type="text" required maxlength="100">
      </label>

      <label class="addr-field addr-field--full">
        <span>آدرس تکمیلی (پلاک، واحد و ...)</span>
        <textarea v-model.trim="form.detail" rows="2" required maxlength="200" />
      </label>

      <label class="addr-field">
        <span>کد پستی</span>
        <input v-model.trim="form.postalCode" type="text" inputmode="numeric" placeholder="۱۰ رقم" required>
      </label>

      <label class="addr-field addr-field--check">
        <input v-model="form.isDefault" type="checkbox">
        <span>آدرس پیش‌فرض باشد</span>
      </label>
    </div>

    <p v-if="error" class="addr-form__error">{{ error }}</p>

    <div class="addr-form__actions">
      <button type="button" class="addr-form__cancel" @click="$emit('cancel')">انصراف</button>
      <button type="submit" class="addr-form__submit" :disabled="submitting">
        {{ submitting ? 'در حال ذخیره...' : 'ذخیره آدرس' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { reactive } from 'vue'

const props = defineProps({
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['submit', 'cancel'])

const form = reactive({
  title: '',
  recipientName: '',
  recipientPhone: '',
  province: '',
  city: '',
  street: '',
  detail: '',
  postalCode: '',
  isDefault: false,
})

function submit() {
  emit('submit', { ...form })
}
</script>

<style scoped>
.addr-form {
  padding: 14px;
  border-radius: 16px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
}
[data-theme='light'] .addr-form {
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  box-shadow: var(--glass-shadow);
}

.addr-form__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.addr-field--full { grid-column: 1 / -1; }

.addr-field { display: flex; flex-direction: column; gap: 5px; font-size: 11.5px; color: var(--text-secondary); }
.addr-field input,
.addr-field textarea {
  border-radius: 10px;
  border: 1px solid var(--glass-border);
  background: rgba(9, 15, 12, .18);
  color: var(--text-primary);
  padding: 9px 10px;
  font-size: 12.5px;
  resize: none;
}
[data-theme='light'] .addr-field input,
[data-theme='light'] .addr-field textarea {
  background: rgba(255, 255, 255, .55);
}
.addr-field input::placeholder,
.addr-field textarea::placeholder { color: var(--text-disabled); }
.addr-field input:focus,
.addr-field textarea:focus {
  outline: none;
  border-color: var(--brand-light);
}
[data-theme='light'] .addr-field input:focus,
[data-theme='light'] .addr-field textarea:focus {
  border-color: var(--brand-dark);
}

.addr-field--check {
  grid-column: 1 / -1;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-primary);
}
.addr-field--check input { width: 16px; height: 16px; accent-color: var(--brand); }

.addr-form__error {
  margin-top: 10px;
  font-size: 11.5px;
  color: #E8848C;
}

.addr-form__actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}
.addr-form__cancel,
.addr-form__submit {
  flex: 1;
  padding: 10px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid var(--glass-border);
}
.addr-form__cancel {
  background: transparent;
  color: var(--text-secondary);
}
.addr-form__submit {
  background: linear-gradient(135deg, #6EB082 0%, #3D8B52 55%, #2D6B3E 100%);
  color: #fff;
  border-color: rgba(255, 255, 255, .25);
}
.addr-form__submit:disabled { opacity: .6; cursor: default; }
</style>
