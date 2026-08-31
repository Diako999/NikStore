<template>
  <div class="w-full max-w-sm mx-auto px-4">
    <GlassCard padding="lg" radius="24px">

      <div class="flex flex-col items-center mb-8">
        <NuxtLink to="/" class="flex flex-col items-center gap-2">
          <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-1 bg-glass-brand">
            <svg class="w-8 h-8 text-white" viewBox="0 0 48 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="4" width="18" height="16" rx="8" /><rect x="28" y="4" width="18" height="16" rx="8" /><path d="M20 12 Q24 6 28 12" />
            </svg>
          </div>
          <span class="text-glass-brand font-black text-xl tracking-tight">{{ settingsStore.siteName }}</span>
        </NuxtLink>
      </div>

      <div class="mb-7 text-center">
        <h1 class="text-xl font-bold text-glass-text-primary mb-3">کد تأیید را وارد کنید</h1>
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-glass border border-glass-border">
          <span class="text-glass-text-secondary">کد ۶ رقمی ارسال شد به</span>
          <span class="font-bold text-glass-text-primary" dir="ltr">{{ maskedPhone }}</span>
        </div>
      </div>

      <div class="mb-6">
        <OtpInput ref="otpInputRef" v-model="otpCode" :length="6" :error="!!otpError" :disabled="authStore.loading" @complete="handleComplete" />
        <Transition name="fade-down">
          <p v-if="otpError" class="text-center text-error text-sm mt-3 flex items-center justify-center gap-1.5">{{ otpError }}</p>
        </Transition>
      </div>

      <GlassButton variant="primary" size="lg" block class="mb-5" :loading="authStore.loading" :disabled="otpCode.length < 6 || authStore.loading" @click="verify">
        {{ authStore.loading ? 'در حال بررسی...' : 'تأیید و ورود' }}
      </GlassButton>

      <div class="flex items-center justify-center gap-3 text-sm">
        <button @click="resend" :disabled="cooldown > 0 || authStore.loading" :class="['font-medium transition-colors duration-150', cooldown > 0 ? 'text-glass-text-disabled cursor-not-allowed' : 'text-glass-brand hover:opacity-80']">
          ارسال مجدد کد
        </button>
        <Transition name="fade">
          <span v-if="cooldown > 0" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums bg-glass text-glass-text-secondary" dir="ltr">{{ formattedCooldown }}</span>
        </Transition>
      </div>

      <div class="mt-6 pt-5 border-t border-glass-border text-center">
        <button @click="goBack" class="text-glass-text-secondary text-sm hover:text-glass-brand inline-flex items-center gap-1.5 mx-auto transition-colors duration-150">
          <svg class="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
          ویرایش شماره موبایل
        </button>
      </div>
    </GlassCard>
  </div>
</template>

<script setup>
import OtpInput   from '~/components/auth/OtpInput.vue'
import GlassCard   from '~/components/glass/GlassCard.vue'
import GlassButton from '~/components/glass/GlassButton.vue'

definePageMeta({ layout: 'auth', middleware: ['guest'] })

const router        = useRouter()
const route         = useRoute()
const authStore     = useAuthStore()
const ui            = useUiStore()
const settingsStore = useSettingsStore()

useSeoMeta({ title: 'تأیید شماره موبایل', robots: 'noindex' })

const otpCode     = ref('')
const otpError    = ref('')
const otpInputRef = ref(null)

const RESEND_TIMEOUT = 120
const cooldown = ref(RESEND_TIMEOUT)
let countdownInterval = null

const formattedCooldown = computed(() => {
  const m = Math.floor(cooldown.value / 60)
  const s = cooldown.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

function startCountdown() {
  cooldown.value = RESEND_TIMEOUT
  clearInterval(countdownInterval)
  countdownInterval = setInterval(() => { if (cooldown.value > 0) cooldown.value--; else clearInterval(countdownInterval) }, 1000)
}

const maskedPhone = computed(() => {
  const p = authStore.pendingPhone
  if (!p || p.length < 8) return p
  return p.slice(0, 4) + ' ' + p.slice(4, 7) + ' ****'
})

onMounted(async () => {
  if (!authStore.pendingPhone) { router.replace('/auth/login'); return }
  startCountdown()
  await nextTick()
  otpInputRef.value?.focus()
})

onUnmounted(() => clearInterval(countdownInterval))

async function verify() {
  if (otpCode.value.length < 6 || authStore.loading) return
  otpError.value = ''
  try {
    await authStore.verifyOtp(authStore.pendingPhone, otpCode.value)
    ui.addToast('خوش آمدید! ورود موفقیت‌آمیز بود', 'success')
    const redirect = route.query.redirect
    router.push(redirect ? String(redirect) : '/')
  } catch (err) {
    const status = err.response?.status
    otpCode.value = ''
    if (status === 401) {
      otpError.value = err.response?.data?.message?.includes('منقضی')
        ? 'کد تأیید منقضی شده. کد جدید دریافت کنید'
        : 'کد تأیید اشتباه است. مجدداً تلاش کنید'
    } else { otpError.value = 'خطا در ورود. لطفاً دوباره تلاش کنید' }
    await nextTick()
    otpInputRef.value?.focus()
  }
}

function handleComplete(code) { otpCode.value = code; if (!authStore.loading) verify() }

async function resend() {
  if (cooldown.value > 0 || authStore.loading) return
  otpError.value = ''
  otpCode.value  = ''
  try {
    await authStore.sendOtp(authStore.pendingPhone)
    startCountdown()
    ui.addToast('کد جدید ارسال شد', 'success')
    await nextTick()
    otpInputRef.value?.focus()
  } catch (err) {
    if (err.response?.status === 429) ui.addToast('لطفاً کمی صبر کنید و دوباره تلاش کنید', 'warning')
    else ui.addToast('خطا در ارسال کد. دوباره تلاش کنید', 'error')
  }
}

function goBack() { clearInterval(countdownInterval); router.push('/auth/login') }
</script>

<style scoped>
.fade-down-enter-active, .fade-down-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-down-enter-from, .fade-down-leave-to { opacity: 0; transform: translateY(-4px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
