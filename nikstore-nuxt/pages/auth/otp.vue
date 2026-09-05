<template>
  <div class="otp">
    <h1 class="otp__title">کد تایید را وارد کنید</h1>
    <p class="otp__sub">
      کد ۶ رقمی ارسال شده به شماره
      <bdi class="otp__phone">{{ displayPhone }}</bdi>
      را وارد کنید
    </p>

    <form class="otp__form" @submit.prevent="onSubmit">
      <div class="otp__boxes" dir="ltr">
        <input
          v-for="(d, i) in digits"
          :key="i"
          :ref="(el) => (inputs[i] = el)"
          v-model="digits[i]"
          class="otp__box"
          type="tel"
          inputmode="numeric"
          maxlength="1"
          @input="onDigitInput(i, $event)"
          @keydown="onKeydown(i, $event)"
          @paste="onPaste"
        >
      </div>

      <p v-if="error" class="otp__error">{{ error }}</p>

      <button type="submit" class="otp__submit" :disabled="loading || code.length !== 6">
        {{ loading ? 'در حال بررسی...' : 'تایید و ورود' }}
      </button>
    </form>

    <div class="otp__footer">
      <button type="button" class="otp__link" :disabled="cooldown > 0 || resending" @click="onResend">
        {{ resendLabel }}
      </button>
      <NuxtLink :to="editPhoneLink" class="otp__link otp__link--muted">ویرایش شماره موبایل</NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '~/services/auth.service'
import { useAuthStore } from '~/stores/auth.store'
import { toPersianDigits } from '~/utils/format'

definePageMeta({ layout: 'auth', middleware: 'guest' })
useSeoMeta({ title: 'تایید کد | نیک' })

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const phone = String(route.query.phone || '')

if (!phone) {
  router.replace('/auth/login')
}

const displayPhone = computed(() => toPersianDigits(phone))
const editPhoneLink = computed(() => ({
  path: '/auth/login',
  query: route.query.redirect ? { redirect: route.query.redirect } : {},
}))

const digits = ref(['', '', '', '', '', ''])
const inputs = ref([])
const code = computed(() => digits.value.join(''))
const loading = ref(false)
const resending = ref(false)
const error = ref('')

onMounted(() => {
  nextTick(() => inputs.value[0]?.focus())
  startCooldown()
})
onUnmounted(() => { if (timer) clearInterval(timer) })

function onDigitInput(index, event) {
  const raw = event.target.value.replace(/\D/g, '')
  digits.value[index] = raw.slice(-1)
  error.value = ''
  if (raw && index < 5) inputs.value[index + 1]?.focus()
}

function onKeydown(index, event) {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    inputs.value[index - 1]?.focus()
  }
}

function onPaste(event) {
  const text = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6)
  if (!text) return
  event.preventDefault()
  text.split('').forEach((ch, i) => { digits.value[i] = ch })
  nextTick(() => inputs.value[Math.min(text.length, 5)]?.focus())
}

async function onSubmit() {
  if (code.value.length !== 6) return
  loading.value = true
  error.value = ''
  try {
    await authStore.verifyOtp(phone, code.value)
    router.push(route.query.redirect ? String(route.query.redirect) : '/user')
  } catch (e) {
    error.value = e.response?.data?.message || 'کد وارد شده صحیح نیست'
    digits.value = ['', '', '', '', '', '']
    nextTick(() => inputs.value[0]?.focus())
  } finally {
    loading.value = false
  }
}

const COOLDOWN_SECONDS = 60
const cooldown = ref(0)
let timer = null

function startCooldown() {
  cooldown.value = COOLDOWN_SECONDS
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    cooldown.value -= 1
    if (cooldown.value <= 0) clearInterval(timer)
  }, 1000)
}

const resendLabel = computed(() => {
  if (resending.value) return 'در حال ارسال مجدد...'
  if (cooldown.value > 0) return `ارسال مجدد کد (${toPersianDigits(cooldown.value)})`
  return 'ارسال مجدد کد'
})

async function onResend() {
  if (cooldown.value > 0 || resending.value) return
  resending.value = true
  error.value = ''
  try {
    await authService.sendOtp(phone)
    startCooldown()
  } catch (e) {
    error.value = e.response?.data?.message || 'ارسال مجدد کد با خطا مواجه شد'
  } finally {
    resending.value = false
  }
}
</script>

<style scoped>
.otp {
  padding: 48px 24px 40px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.otp__title {
  font-size: 19px;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
  margin-bottom: 8px;
}
.otp__sub {
  font-size: 12.5px;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.6;
  margin-bottom: 32px;
}
.otp__phone { font-weight: 700; color: var(--text-primary); unicode-bidi: plaintext; }

.otp__form { display: flex; flex-direction: column; gap: 16px; }

.otp__boxes { display: flex; justify-content: center; gap: 8px; }
.otp__box {
  width: 42px;
  height: 52px;
  border-radius: 14px;
  text-align: center;
  font-size: 19px;
  font-weight: 700;
  font-family: inherit;
  color: var(--text-primary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  outline: none;
}
.otp__box:focus { border-color: var(--brand-light); }
[data-theme='light'] .otp__box {
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  box-shadow: var(--glass-shadow);
}

.otp__error {
  font-size: 12px;
  color: #E8837F;
  text-align: center;
}

.otp__submit {
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
.otp__submit:disabled { opacity: .55; cursor: not-allowed; }

.otp__footer {
  margin-top: auto;
  padding-top: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.otp__link {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--brand-light);
  cursor: pointer;
}
[data-theme='light'] .otp__link { color: var(--brand-dark); }
.otp__link:disabled { color: var(--text-disabled); cursor: not-allowed; }
.otp__link--muted { font-weight: 500; color: var(--text-secondary); }
</style>
