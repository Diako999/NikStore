<template>
  <div class="w-full max-w-sm mx-auto px-4">
    <GlassCard padding="lg" radius="24px">

      <div class="text-center mb-8">
        <NuxtLink to="/">
          <div class="inline-flex flex-col items-center">
            <img v-if="settingsStore.logoUrl" :src="settingsStore.logoUrl" :alt="settingsStore.siteName" class="h-12 w-auto mb-2" />
            <svg v-else class="w-12 h-12 text-glass-brand mb-2" viewBox="0 0 48 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="2" y="4" width="18" height="16" rx="8" />
              <rect x="28" y="4" width="18" height="16" rx="8" />
              <path d="M20 12 Q24 6 28 12" />
            </svg>
            <span class="text-glass-brand font-black text-2xl tracking-tight">{{ settingsStore.siteName }}</span>
            <span class="text-glass-text-secondary text-xs mt-0.5">{{ settingsStore.tagline }}</span>
          </div>
        </NuxtLink>
      </div>

      <div class="mb-6">
        <h1 class="text-xl font-bold text-glass-text-primary mb-1">ورود یا ثبت‌نام</h1>
        <p class="text-glass-text-secondary text-sm">شماره موبایل خود را وارد کنید</p>
      </div>

      <div class="mb-6" ref="phoneInputWrap">
        <GlassInput
          v-model="phone"
          label="شماره موبایل"
          type="tel"
          inputmode="numeric"
          dir="ltr"
          placeholder="912 345 6789"
          maxlength="11"
          :disabled="authStore.loading"
          :error="phoneError"
          @blur="validatePhone()"
          @enter="submit"
          @update:model-value="phoneError = ''; isBlocked = false"
        >
          <template #append>
            <span class="text-lg leading-none" aria-hidden="true">🇮🇷</span>
            <span class="text-sm font-medium">98+</span>
          </template>
        </GlassInput>
      </div>

      <Transition name="fade-down">
        <div v-if="isBlocked" class="mb-5 rounded-xl overflow-hidden border border-red-200">
          <div class="bg-red-500 px-4 py-2.5"><span class="text-white text-sm font-bold">حساب کاربری مسدود شده</span></div>
          <div class="bg-red-50 px-4 py-3"><p class="text-red-700 text-xs leading-6">دسترسی به حساب کاربری شما محدود شده است. با پشتیبانی تماس بگیرید.</p></div>
        </div>
      </Transition>

      <GlassButton variant="primary" size="lg" block :loading="authStore.loading" :disabled="authStore.loading || !phone || isBlocked" @click="submit">
        {{ authStore.loading ? 'در حال ارسال...' : 'دریافت کد تأیید' }}
      </GlassButton>

      <p class="text-center text-glass-text-secondary text-xs mt-5 leading-6">
        با ورود به {{ settingsStore.siteName }}،
        <NuxtLink to="/pages/terms" class="underline hover:text-glass-brand transition-colors">قوانین و مقررات</NuxtLink>
        را می‌پذیرم
      </p>
    </GlassCard>
  </div>
</template>

<script setup>
import GlassCard   from '~/components/glass/GlassCard.vue'
import GlassButton from '~/components/glass/GlassButton.vue'
import GlassInput  from '~/components/glass/GlassInput.vue'

definePageMeta({ layout: 'auth', middleware: ['guest'] })

const router        = useRouter()
const route         = useRoute()
const authStore     = useAuthStore()
const ui            = useUiStore()
const settingsStore = useSettingsStore()

const phone          = ref('')
const phoneError     = ref('')
const phoneInputWrap = ref(null)
const isBlocked    = ref(false)

useSeoMeta({ title: 'ورود یا ثبت‌نام', robots: 'noindex' })

onMounted(() => {
  if (authStore.pendingPhone) phone.value = authStore.pendingPhone
  // GlassInput doesn't expose a focus() method, so a component ref can't
  // reach the underlying <input> reliably — use a plain DOM ref on the
  // wrapping element instead and query into it.
  phoneInputWrap.value?.querySelector('input')?.focus()
})

function validatePhone() {
  const raw = phone.value.replace(/\D/g, '')
  if (!raw) { phoneError.value = 'شماره موبایل را وارد کنید'; return false }
  if (!/^0?9[0-9]{9}$/.test(raw)) { phoneError.value = 'شماره موبایل معتبر نیست (مثال: 09123456789)'; return false }
  phoneError.value = ''
  return true
}

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('9') && digits.length === 10) return '0' + digits
  return digits
}

async function submit() {
  if (authStore.loading) return
  if (!validatePhone()) return
  const normalized = normalizePhone(phone.value)
  isBlocked.value = false
  try {
    await authStore.sendOtp(normalized)
    router.push({ path: '/auth/otp', query: route.query.redirect ? { redirect: route.query.redirect } : undefined })
  } catch (err) {
    const status = err.response?.status
    if (status === 403) isBlocked.value = true
    else if (status === 429) phoneError.value = 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً ۱۰ دقیقه صبر کنید.'
    else if (status === 400) phoneError.value = 'شماره موبایل وارد شده معتبر نیست'
    else ui.addToast(err.response?.data?.message || 'خطا در ارسال کد. دوباره تلاش کنید', 'error')
  }
}
</script>

<style scoped>
.fade-down-enter-active, .fade-down-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-down-enter-from, .fade-down-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
