<template>
  <div class="space-y-6">

    <!-- ── Page header ─────────────────────────────────────────── -->
    <div>
      <h1 class="page-title">تغییر رمز عبور</h1>
      <p class="text-text-secondary text-sm mt-0.5">فقط ادمین اصلی می‌تواند رمز عبور را تغییر دهد</p>
    </div>

    <!-- ── Access denied ───────────────────────────────────────── -->
    <div v-if="!auth.isAdmin"
      class="admin-card p-10 flex flex-col items-center gap-4 text-center max-w-sm mx-auto">
      <div class="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-3xl">🚫</div>
      <div>
        <p class="font-semibold text-text-primary">دسترسی غیرمجاز</p>
        <p class="text-text-secondary text-sm mt-1">فقط ادمین اصلی می‌تواند رمز عبور را تغییر دهد</p>
      </div>
    </div>

    <!-- ── Main layout ─────────────────────────────────────────── -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-5 gap-5 max-w-4xl">

      <!-- Form card ──────────────────────────────────────────── -->
      <div class="lg:col-span-3 admin-card p-6 space-y-5">

        <!-- Card header -->
        <div class="flex items-center gap-3 pb-4 border-b border-border">
          <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">🔐</div>
          <div>
            <h3 class="font-semibold text-text-primary">
              {{ noPasswordSet ? 'تنظیم رمز عبور' : 'تغییر رمز عبور' }}
            </h3>
            <p class="text-text-disabled text-xs mt-0.5">
              {{ noPasswordSet ? 'اولین بار است که رمز عبور تنظیم می‌کنید' : 'رمز جدید باید از رمز قبلی متفاوت باشد' }}
            </p>
          </div>
        </div>

        <!-- Alerts -->
        <Transition name="slide-fade">
          <div v-if="noPasswordSet"
            class="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3">
            <span class="text-amber-500 flex-shrink-0 mt-0.5">⚠️</span>
            <p class="text-amber-700 dark:text-amber-400 text-sm leading-relaxed">
              رمز عبور برای این حساب هنوز تنظیم نشده است. رمز جدید را وارد کنید.
            </p>
          </div>
        </Transition>

        <Transition name="slide-fade">
          <div v-if="successMsg"
            class="flex items-start gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-4 py-3">
            <span class="text-green-500 text-xl flex-shrink-0">✓</span>
            <p class="text-green-700 dark:text-green-400 text-sm font-medium leading-relaxed">{{ successMsg }}</p>
          </div>
        </Transition>

        <Transition name="slide-fade">
          <div v-if="errorMsg"
            class="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-4 py-3">
            <span class="text-error flex-shrink-0 mt-0.5">✕</span>
            <p class="text-error text-sm leading-relaxed">{{ errorMsg }}</p>
          </div>
        </Transition>

        <!-- Current password -->
        <div v-if="!noPasswordSet" class="relative">
          <AdminInput
            v-model="form.currentPassword"
            label="رمز عبور فعلی"
            :type="show.current ? 'text' : 'password'"
            placeholder="رمز عبور فعلی خود را وارد کنید"
            dir="ltr"
            autocomplete="current-password"
            :error="errors.currentPassword"
          />
          <button type="button" tabindex="-1"
            class="absolute left-3 top-8 text-text-secondary hover:text-primary transition-colors"
            @click="show.current = !show.current">
            <EyeOffIcon v-if="show.current" />
            <EyeIcon v-else />
          </button>
        </div>

        <!-- New password + strength -->
        <div>
          <div class="relative">
            <AdminInput
              v-model="form.newPassword"
              label="رمز عبور جدید"
              :type="show.new ? 'text' : 'password'"
              placeholder="حداقل ۸ کاراکتر"
              dir="ltr"
              autocomplete="new-password"
              :error="errors.newPassword"
            />
            <button type="button" tabindex="-1"
              class="absolute left-3 top-8 text-text-secondary hover:text-primary transition-colors"
              @click="show.new = !show.new">
              <EyeOffIcon v-if="show.new" />
              <EyeIcon v-else />
            </button>
          </div>

          <!-- Strength bar -->
          <div v-if="form.newPassword.length > 0" class="mt-2 space-y-1.5">
            <div class="flex gap-1">
              <div v-for="i in 4" :key="i"
                class="h-1 flex-1 rounded-full transition-all duration-300"
                :class="i <= strength.score ? strength.barColor : 'bg-border'" />
            </div>
            <p class="text-xs font-medium" :class="strength.textColor">{{ strength.label }}</p>
          </div>
        </div>

        <!-- Confirm new password -->
        <div class="relative">
          <AdminInput
            v-model="form.confirmPassword"
            label="تکرار رمز عبور جدید"
            :type="show.new ? 'text' : 'password'"
            placeholder="رمز عبور جدید را دوباره وارد کنید"
            dir="ltr"
            autocomplete="new-password"
            :error="errors.confirmPassword"
          />
          <!-- Match indicator -->
          <span v-if="form.confirmPassword.length > 0 && !errors.confirmPassword"
            class="absolute left-3 top-8 text-green-500 text-sm">✓</span>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3 pt-2">
          <AdminButton :loading="loading" class="flex-1" @click="handleSubmit">
            {{ noPasswordSet ? 'تنظیم رمز عبور' : 'تغییر رمز عبور' }}
          </AdminButton>
          <button type="button"
            class="px-4 py-2 rounded-xl text-sm text-text-secondary border border-border hover:border-primary/40 hover:text-text-primary transition-colors"
            @click="resetForm">
            پاک کردن
          </button>
        </div>
      </div>

      <!-- Tips sidebar ──────────────────────────────────────── -->
      <div class="lg:col-span-2 space-y-4">

        <!-- Security tips -->
        <div class="admin-card p-5">
          <h4 class="font-medium text-text-primary text-sm mb-4 flex items-center gap-2">
            <span class="text-primary">🛡️</span> راهنمای امنیتی
          </h4>
          <ul class="space-y-3">
            <li v-for="tip in securityTips" :key="tip.text"
              class="flex items-start gap-2.5">
              <span class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                :class="tip.done(form.newPassword)
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-border text-text-disabled'">
                {{ tip.done(form.newPassword) ? '✓' : '·' }}
              </span>
              <span class="text-xs leading-relaxed"
                :class="tip.done(form.newPassword) ? 'text-text-primary' : 'text-text-secondary'">
                {{ tip.text }}
              </span>
            </li>
          </ul>
        </div>

        <!-- What happens after change -->
        <div class="admin-card p-5 bg-primary/5 border-primary/20">
          <h4 class="font-medium text-text-primary text-sm mb-3 flex items-center gap-2">
            <span class="text-primary">ℹ️</span> پس از تغییر رمز
          </h4>
          <ul class="space-y-2 text-text-secondary text-xs leading-relaxed">
            <li class="flex gap-2">
              <span class="text-warning flex-shrink-0 mt-0.5">•</span>
              از تمام دستگاه‌های دیگر خارج می‌شوید
            </li>
            <li class="flex gap-2">
              <span class="text-warning flex-shrink-0 mt-0.5">•</span>
              توکن‌های refresh منقضی می‌شوند
            </li>
            <li class="flex gap-2">
              <span class="text-warning flex-shrink-0 mt-0.5">•</span>
              باید با رمز جدید وارد شوید
            </li>
          </ul>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { logger } from '@/utils/logger'
import AdminInput  from '@/components/common/AdminInput.vue'
import AdminButton from '@/components/common/AdminButton.vue'

// ── Icon components (inline SVG) ──────────────────────────────
const EyeIcon = {
  template: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
  </svg>`,
}
const EyeOffIcon = {
  template: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
  </svg>`,
}

// ── State ─────────────────────────────────────────────────────
const auth          = useAuthStore()
const loading       = ref(false)
const noPasswordSet = ref(false)

const form   = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const show   = reactive({ current: false, new: false })
const errors = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const errorMsg   = ref('')
const successMsg = ref('')

// ── Password strength ─────────────────────────────────────────
const securityTips = [
  { text: 'حداقل ۸ کاراکتر',                done: (p) => p.length >= 8 },
  { text: 'حداقل یک حرف بزرگ (A–Z)',         done: (p) => /[A-Z]/.test(p) },
  { text: 'حداقل یک عدد (0–9)',               done: (p) => /[0-9]/.test(p) },
  { text: 'حداقل یک کاراکتر خاص (!@#$…)',    done: (p) => /[^A-Za-z0-9]/.test(p) },
]

const strength = computed(() => {
  const p = form.newPassword
  const score = securityTips.filter(t => t.done(p)).length
  if (score <= 1) return { score: 1, barColor: 'bg-error',   textColor: 'text-error',   label: 'خیلی ضعیف' }
  if (score === 2) return { score: 2, barColor: 'bg-warning', textColor: 'text-warning', label: 'ضعیف' }
  if (score === 3) return { score: 3, barColor: 'bg-blue-500', textColor: 'text-blue-500', label: 'متوسط' }
  return { score: 4, barColor: 'bg-success', textColor: 'text-success', label: 'قوی' }
})

// ── Logic ──────────────────────────────────────────────────────
function resetForm() {
  form.currentPassword   = ''
  form.newPassword       = ''
  form.confirmPassword   = ''
  errors.currentPassword = ''
  errors.newPassword     = ''
  errors.confirmPassword = ''
  errorMsg.value   = ''
  successMsg.value = ''
}

function validate() {
  let ok = true
  errors.currentPassword = ''
  errors.newPassword     = ''
  errors.confirmPassword = ''

  if (!noPasswordSet.value) {
    if (!form.currentPassword || form.currentPassword.length < 6) {
      errors.currentPassword = 'رمز عبور فعلی حداقل ۶ کاراکتر است'
      ok = false
    }
  }
  if (!form.newPassword || form.newPassword.length < 8) {
    errors.newPassword = 'رمز عبور جدید حداقل ۸ کاراکتر است'
    ok = false
  }
  if (!noPasswordSet.value && form.newPassword && form.newPassword === form.currentPassword) {
    errors.newPassword = 'رمز عبور جدید نباید با رمز فعلی یکسان باشد'
    ok = false
  }
  if (form.newPassword !== form.confirmPassword) {
    errors.confirmPassword = 'تکرار رمز عبور مطابقت ندارد'
    ok = false
  }
  return ok
}

async function handleSubmit() {
  errorMsg.value   = ''
  successMsg.value = ''
  if (!validate()) return

  loading.value = true
  try {
    const currentPw = noPasswordSet.value ? undefined : form.currentPassword
    await authService.changePassword(currentPw, form.newPassword)
    logger.info('Admin password set/changed successfully', { initial: noPasswordSet.value }, 'ChangePasswordView')
    noPasswordSet.value = false
    resetForm()
    successMsg.value = 'رمز عبور با موفقیت تنظیم شد. برای امنیت بیشتر از سایر دستگاه‌ها خارج شدید.'
  } catch (e) {
    logger.error('Admin change password failed', e, {}, 'ChangePasswordView')
    const msg = e.response?.data?.message
    const text = Array.isArray(msg) ? msg[0] : (msg ?? 'خطا در تغییر رمز عبور')
    if (text.includes('تنظیم نشده') || text.includes('الزامی')) {
      noPasswordSet.value = true
      errorMsg.value = ''
    } else {
      errorMsg.value = text
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.slide-fade-enter-active { transition: all 0.25s ease; }
.slide-fade-leave-active { transition: all 0.2s ease; }
.slide-fade-enter-from   { opacity: 0; transform: translateY(-6px); }
.slide-fade-leave-to     { opacity: 0; transform: translateY(-4px); }
</style>
