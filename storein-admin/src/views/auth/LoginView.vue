<template>
  <div class="w-full max-w-[400px] relative z-10">
    <div class="login-card">

      <!-- Brand -->
      <div class="flex flex-col items-center mb-8">
        <div class="login-brand-icon">
          <img src="/favicon.svg" alt="لوگو نیک" class="w-11 h-11" draggable="false" />
        </div>
        <h1 class="text-[22px] font-bold text-white mt-4 tracking-tight">{{ settingsStore.siteName }}</h1>
        <p class="text-slate-500 text-sm mt-0.5">پنل مدیریت</p>
      </div>

      <!-- Tabs -->
      <div class="login-tab-bar mb-6">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['login-tab', mode === tab.id ? 'login-tab--active' : '']"
          @click="switchMode(tab.id)"
        >{{ tab.label }}</button>
      </div>

      <!-- Error banner -->
      <Transition name="slide-down">
        <div v-if="errorMsg" class="login-error mb-5">
          <svg class="w-4 h-4 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span class="text-red-300 text-sm">{{ errorMsg }}</span>
        </div>
      </Transition>

      <!-- ── PASSWORD MODE ──────────────────────────────────── -->
      <form v-if="mode === 'password'" @submit.prevent="handlePasswordLogin" autocomplete="off" novalidate>
        <input type="text"     name="username_fake" style="display:none" tabindex="-1" autocomplete="off" />
        <input type="password" name="password_fake" style="display:none" tabindex="-1" autocomplete="off" />

        <div class="space-y-4">

          <!-- Phone -->
          <div class="login-field">
            <label class="login-label">شماره موبایل</label>
            <div :class="['login-input-wrap', phoneError ? 'login-input-wrap--error' : '']">
              <input
                v-model="phone"
                type="tel"
                dir="ltr"
                placeholder="09xxxxxxxxx"
                autocomplete="off"
                class="login-input"
                @keydown.enter="handlePasswordLogin"
              />
            </div>
            <p v-if="phoneError" class="login-field-error">{{ phoneError }}</p>
          </div>

          <!-- Password -->
          <div class="login-field">
            <label class="login-label">رمز عبور</label>
            <div :class="['login-input-wrap', passwordError ? 'login-input-wrap--error' : '']">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                dir="ltr"
                placeholder="رمز عبور را وارد کنید"
                autocomplete="new-password"
                class="login-input pl-10"
                @keydown.enter="handlePasswordLogin"
              />
              <button
                type="button"
                tabindex="-1"
                class="login-eye-btn"
                @click="showPassword = !showPassword"
              >
                <svg v-if="showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </button>
            </div>
            <p v-if="passwordError" class="login-field-error">{{ passwordError }}</p>
          </div>

          <button type="submit" :disabled="auth.loading" class="login-btn mt-2">
            <svg v-if="auth.loading" class="animate-spin w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            ورود به پنل مدیریت
          </button>

        </div>
      </form>

      <!-- ── OTP: STEP 1 — phone ───────────────────────────── -->
      <div v-else-if="otpStep === 'phone'" class="space-y-4">
        <div class="login-field">
          <label class="login-label">شماره موبایل</label>
          <div :class="['login-input-wrap', phoneError ? 'login-input-wrap--error' : '']">
            <input
              v-model="phone"
              type="tel"
              dir="ltr"
              placeholder="09xxxxxxxxx"
              autocomplete="off"
              class="login-input"
              @keydown.enter="handleSendOtp"
            />
          </div>
          <p v-if="phoneError" class="login-field-error">{{ phoneError }}</p>
        </div>
        <button :disabled="auth.loading" class="login-btn" @click="handleSendOtp">
          <svg v-if="auth.loading" class="animate-spin w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          دریافت کد تأیید
        </button>
      </div>

      <!-- ── OTP: STEP 2 — code ────────────────────────────── -->
      <div v-else class="space-y-4">
        <div class="login-otp-hint">
          <svg class="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
          </svg>
          <span class="text-slate-400 text-sm leading-6">
            کد ۶ رقمی ارسال‌شده به
            <span class="font-bold text-white dir-ltr inline-block">{{ maskedPhone }}</span>
            را وارد کنید
          </span>
        </div>

        <div class="login-field">
          <label class="login-label">کد تأیید</label>
          <div :class="['login-input-wrap', otpError ? 'login-input-wrap--error' : '']">
            <input
              v-model="otpCode"
              type="text"
              dir="ltr"
              placeholder="- - - - - -"
              autocomplete="one-time-code"
              class="login-input text-center tracking-[0.4em] text-lg"
              @keydown.enter="handleVerifyOtp"
            />
          </div>
          <p v-if="otpError" class="login-field-error">{{ otpError }}</p>
        </div>

        <div class="text-center text-sm">
          <span v-if="countdown > 0" class="text-slate-500">
            ارسال مجدد تا
            <span class="font-medium tabular-nums text-slate-400">{{ formattedCountdown }}</span>
          </span>
          <button
            v-else
            class="text-primary-light hover:text-white font-medium transition-colors"
            @click="handleSendOtp"
          >
            ارسال مجدد کد
          </button>
        </div>

        <button :disabled="auth.loading" class="login-btn" @click="handleVerifyOtp">
          <svg v-if="auth.loading" class="animate-spin w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          تأیید و ورود
        </button>

        <button
          class="w-full text-center text-slate-500 text-sm hover:text-slate-300 transition-colors py-1"
          @click="otpStep = 'phone'; otpCode = ''; otpError = ''"
        >
          تغییر شماره موبایل
        </button>

        <div v-if="isDev" class="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-center text-xs text-amber-400">
          کد OTP را در لاگ‌های Railway بخوانید (MOCK SMS)
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore }     from '@/stores/auth.store'
import { useSettingsStore } from '@/stores/settings.store'

const router        = useRouter()
const route         = useRoute()
const auth          = useAuthStore()
const settingsStore = useSettingsStore()

const tabs = [
  { id: 'password', label: 'رمز عبور' },
  { id: 'otp',      label: 'کد تأیید' },
]

const mode          = ref('password')
const otpStep       = ref('phone')
const phone         = ref('')
const password      = ref('')
const otpCode       = ref('')
const showPassword  = ref(false)
const phoneError    = ref('')
const passwordError = ref('')
const otpError      = ref('')
const errorMsg      = ref(route.query.error === 'forbidden' ? 'دسترسی غیرمجاز' : '')
const countdown     = ref(0)
const isDev         = import.meta.env.DEV

let timer = null

const maskedPhone = computed(() => {
  const p = phone.value
  if (!p || p.length < 8) return p
  return p.slice(0, 4) + ' ' + p.slice(4, 7) + ' ****'
})

const formattedCountdown = computed(() => {
  const m = Math.floor(countdown.value / 60)
  const s = countdown.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

function switchMode(m) {
  mode.value          = m
  otpStep.value       = 'phone'
  errorMsg.value      = ''
  phoneError.value    = ''
  passwordError.value = ''
  otpError.value      = ''
  otpCode.value       = ''
  clearInterval(timer)
  countdown.value     = 0
}

function startCountdown(seconds = 120) {
  countdown.value = seconds
  clearInterval(timer)
  timer = setInterval(() => {
    if (countdown.value > 0) countdown.value--
    else clearInterval(timer)
  }, 1000)
}

function validatePhone(p) {
  return /^09\d{9}$/.test(p)
}

async function handlePasswordLogin() {
  phoneError.value    = ''
  passwordError.value = ''
  errorMsg.value      = ''

  const p = phone.value.trim()
  if (!validatePhone(p)) { phoneError.value = 'شماره موبایل معتبر نیست'; return }
  if (!password.value || password.value.length < 6) { passwordError.value = 'رمز عبور حداقل ۶ کاراکتر است'; return }

  try {
    await auth.adminLogin(p, password.value)
    router.push(route.query.redirect ?? '/dashboard')
  } catch (e) {
    if (e.isAdminError) { errorMsg.value = e.message; return }
    const msg = e.response?.data?.message
    errorMsg.value = Array.isArray(msg) ? msg[0] : (msg ?? 'شماره یا رمز عبور اشتباه است')
  }
}

async function handleSendOtp() {
  phoneError.value = ''
  errorMsg.value   = ''

  const p = phone.value.trim()
  if (!validatePhone(p)) { phoneError.value = 'شماره موبایل معتبر نیست'; return }

  try {
    await auth.sendOtp(p)
    otpStep.value = 'code'
    startCountdown()
  } catch (e) {
    const msg = e.response?.data?.message
    phoneError.value = Array.isArray(msg) ? msg[0] : (msg ?? 'خطا در ارسال کد')
  }
}

async function handleVerifyOtp() {
  otpError.value = ''
  errorMsg.value = ''

  const code = otpCode.value.trim()
  if (!code || code.length < 6) { otpError.value = 'کد ۶ رقمی را وارد کنید'; return }

  try {
    await auth.verifyOtp(phone.value.trim(), code)
    router.push(route.query.redirect ?? '/dashboard')
  } catch (e) {
    if (e.isAdminError) {
      errorMsg.value = e.message
      otpStep.value  = 'phone'
      otpCode.value  = ''
      return
    }
    const msg = e.response?.data?.message
    otpError.value = Array.isArray(msg) ? msg[0] : (msg ?? 'کد اشتباه است')
  }
}

onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.dir-ltr { direction: ltr; }

/* Card */
.login-card {
  background: rgba(23, 23, 23, 0.86);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 24px;
  padding: 36px 32px;
  box-shadow:
    0 28px 60px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.04) inset;
}

/* Brand icon */
.login-brand-icon {
  width: 76px;
  height: 76px;
  background: linear-gradient(145deg, rgba(198, 255, 52, 0.28), rgba(162, 209, 42, 0.16));
  border: 1px solid rgba(198, 255, 52, 0.4);
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 0 36px rgba(198, 255, 52, 0.22),
    0 8px 20px rgba(0, 0, 0, 0.35);
}

/* Tabs */
.login-tab-bar {
  display: flex;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
}
.login-tab {
  flex: 1;
  padding: 8px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #64748B;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}
.login-tab:hover:not(.login-tab--active) { color: #94A3B8; }
.login-tab--active {
  background: #C6FF34;
  color: #171717;
  box-shadow: 0 2px 10px rgba(198, 255, 52, 0.4);
}

/* Error */
.login-error {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  padding: 10px 14px;
}

/* Field */
.login-field { display: flex; flex-direction: column; gap: 6px; }
.login-label { font-size: 13px; font-weight: 500; color: #94A3B8; }

.login-input-wrap {
  position: relative;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s;
}
.login-input-wrap:focus-within {
  border-color: rgba(198, 255, 52, 0.7);
  background: rgba(198, 255, 52, 0.06);
  box-shadow: 0 0 0 3px rgba(198, 255, 52, 0.15);
}
.login-input-wrap--error {
  border-color: rgba(239, 68, 68, 0.45) !important;
  background: rgba(239, 68, 68, 0.05) !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
}
.login-input {
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  color: #f1f5f9;
  font-size: 14px;
  outline: none;
  font-family: inherit;
}
.login-input::placeholder { color: #374151; }
.login-field-error { font-size: 12px; color: #F87171; margin-top: 2px; }

/* Eye button */
.login-eye-btn {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #475569;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  transition: color 0.15s;
}
.login-eye-btn:hover { color: #94A3B8; }

/* Submit button */
.login-btn {
  width: 100%;
  padding: 13px;
  background: #C6FF34;
  color: #171717;
  font-size: 15px;
  font-weight: 600;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 18px rgba(198, 255, 52, 0.3);
  font-family: inherit;
}
.login-btn:hover:not(:disabled) {
  background: #A2D12A;
  box-shadow: 0 6px 26px rgba(198, 255, 52, 0.4);
  transform: translateY(-1px);
}
.login-btn:active:not(:disabled) { transform: scale(0.98); box-shadow: none; }
.login-btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* OTP hint line */
.login-otp-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  padding: 10px 14px;
  text-align: center;
  justify-content: center;
}

/* Transitions */
.slide-down-enter-active { transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1); }
.slide-down-leave-active { transition: all 0.18s ease; }
.slide-down-enter-from  { transform: translateY(-10px); opacity: 0; }
.slide-down-leave-to    { opacity: 0; }
</style>
