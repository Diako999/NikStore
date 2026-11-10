<template>
  <div class="guest-form">
    <p class="guest-form__note">
      برای ثبت سفارش نیازی به حساب کاربری نیست. اطلاعات شما فقط در همین مرورگر ذخیره می‌شود تا دفعه بعد سریع‌تر سفارش دهید.
    </p>
    <div class="guest-form__grid">
      <label class="gf">
        <span>نام و نام خانوادگی گیرنده</span>
        <input v-model.trim="model.recipientName" type="text" maxlength="60" autocomplete="name">
      </label>
      <label class="gf">
        <span>شماره موبایل</span>
        <input v-model.trim="model.recipientPhone" type="tel" inputmode="numeric" dir="ltr" placeholder="09xxxxxxxxx" autocomplete="tel">
      </label>
      <label class="gf">
        <span>استان</span>
        <input v-model.trim="model.province" type="text" maxlength="50" autocomplete="address-level1">
      </label>
      <label class="gf">
        <span>شهر</span>
        <input v-model.trim="model.city" type="text" maxlength="50" autocomplete="address-level2">
      </label>
      <label class="gf gf--full">
        <span>خیابان</span>
        <input v-model.trim="model.street" type="text" maxlength="100" autocomplete="address-line1">
      </label>
      <label class="gf gf--full">
        <span>آدرس تکمیلی (پلاک، واحد و ...)</span>
        <textarea v-model.trim="model.detail" rows="2" maxlength="200" autocomplete="address-line2" />
      </label>
      <label class="gf">
        <span>کد پستی (۱۰ رقم)</span>
        <input v-model.trim="model.postalCode" type="text" inputmode="numeric" dir="ltr" maxlength="10" autocomplete="postal-code">
      </label>
    </div>
  </div>
</template>

<script setup>
// `model` is a reactive object owned by the checkout page.
defineProps({ model: { type: Object, required: true } })
</script>

<style scoped>
.guest-form {
  padding: 14px;
  border-radius: 16px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
}
.guest-form__note { font-size: 12px; line-height: 1.9; color: var(--text-secondary); margin-bottom: 12px; }
.guest-form__grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px; }
.gf--full { grid-column: 1 / -1; }
.gf { min-width: 0; display: flex; flex-direction: column; gap: 5px; font-size: 12px; color: var(--text-secondary); }
.gf input, .gf textarea {
  border-radius: 10px;
  border: 1px solid var(--glass-border);
  background: rgba(9, 15, 12, .18);
  color: var(--text-primary);
  padding: 9px 10px;
  font-size: 13px;
  resize: none;
}
[data-theme='light'] .gf input, [data-theme='light'] .gf textarea { background: rgba(255, 255, 255, .55); }
.gf input:focus, .gf textarea:focus { outline: none; border-color: var(--brand-light); }
[data-theme='light'] .gf input:focus, [data-theme='light'] .gf textarea:focus { border-color: var(--brand-dark); }
</style>
