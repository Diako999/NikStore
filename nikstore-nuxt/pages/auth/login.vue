<template>
  <div class="login">
    <div class="login__mark">
      <div class="login__ring">NK</div>
      <p class="login__brand">نیک</p>
    </div>

    <h1 class="login__title">ورود به حساب کاربری</h1>
    <p class="login__sub">شماره موبایل خود را وارد کنید تا کد تایید برایتان پیامک شود</p>

    <form class="login__form" @submit.prevent="onSubmit">
      <label class="field">
        <span class="field__label">شماره موبایل</span>
        <span class="field__box">
          <AppIcon name="phone" :size="16" :stroke-width="1.8" />
          <input
            v-model="phone"
            class="field__input"
            type="tel"
            inputmode="numeric"
            dir="ltr"
            placeholder="09xxxxxxxxx"
            autocomplete="tel"
            @input="error = ''"
          >
        </span>
      </label>

      <p v-if="error" class="login__error">{{ error }}</p>

      <button type="submit" class="login__submit" :disabled="loading || !phone">
        {{ loading ? 'در حال ارسال...' : 'دریافت کد تایید' }}
      </button>
    </form>

    <p class="login__hint">با ورود، شرایط استفاده از خدمات نیک را می‌پذیرید.</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '~/components/icons/AppIcon.vue'
import { authService } from '~/services/auth.service'

definePageMeta({ layout: 'auth', middleware: 'guest' })
useSeoMeta({ title: 'ورود | نیک' })

const route = useRoute()
const router = useRouter()

const phone = ref('')
const loading = ref(false)
const error = ref('')

const PHONE_RE = /^(\+98|0)?9\d{9}$/

async function onSubmit() {
  const value = phone.value.trim()
  if (!PHONE_RE.test(value)) {
    error.value = 'شماره موبایل وارد شده معتبر نیست'
    return
  }

  loading.value = true
  error.value = ''
  try {
    await authService.sendOtp(value)
    router.push({
      path: '/auth/otp',
      query: {
        phone: value,
        ...(route.query.redirect ? { redirect: route.query.redirect } : {}),
      },
    })
  } catch (e) {
    error.value = e.response?.data?.message || 'ارسال کد با خطا مواجه شد. دوباره تلاش کنید'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login {
  padding: 48px 24px 40px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.login__mark {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 36px;
}
.login__ring {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: conic-gradient(from 200deg, #E7C878, #FBEFC8, #E7C878);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 18px;
  color: #16241C;
}
.login__brand {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.login__title {
  font-size: 19px;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
  margin-bottom: 8px;
}
.login__sub {
  font-size: 12.5px;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.6;
  margin-bottom: 32px;
}

.login__form { display: flex; flex-direction: column; gap: 16px; }

.field { display: flex; flex-direction: column; gap: 8px; }
.field__label { font-size: 12.5px; font-weight: 600; color: var(--text-secondary); }
.field__box {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 16px;
  padding: 14px 16px;
  color: var(--text-secondary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
}
[data-theme='light'] .field__box {
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  box-shadow: var(--glass-shadow);
}
.field__input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  font-family: inherit;
  font-size: 14px;
  letter-spacing: .5px;
  color: var(--text-primary);
}
.field__input::placeholder { color: var(--text-disabled); }

.login__error {
  font-size: 12px;
  color: #E8837F;
  margin-top: -4px;
}

.login__submit {
  margin-top: 4px;
  padding: 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, .3);
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  background: linear-gradient(135deg, #6EB082 0%, #3D8B52 55%, #2D6B3E 100%);
  box-shadow: 0 10px 22px rgba(40, 55, 46, .30), inset 0 1px 0 rgba(255, 255, 255, .35);
  cursor: pointer;
}
.login__submit:disabled { opacity: .55; cursor: not-allowed; }

.login__hint {
  margin-top: auto;
  padding-top: 32px;
  font-size: 11px;
  color: var(--text-disabled);
  text-align: center;
  line-height: 1.7;
}
</style>
