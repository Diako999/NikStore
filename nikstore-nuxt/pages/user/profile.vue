<template>
  <div class="container-main py-8">
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">

      <!-- Sidebar -->
      <aside class="lg:col-span-1">
        <GlassCard padding="lg" class="flex flex-col items-center gap-3 mb-4">
          <div class="w-20 h-20 rounded-full bg-brand flex items-center justify-center text-white text-2xl font-bold select-none">{{ initials }}</div>
          <div class="text-center">
            <p class="font-bold text-glass-text-primary text-base">{{ fullName || 'کاربر عزیز' }}</p>
            <p class="text-glass-text-secondary text-sm font-fanum mt-0.5 text-center" dir="ltr">{{ authStore.user?.phone }}</p>
          </div>
          <span v-if="authStore.user?.isAdmin" class="text-xs bg-brand/10 text-brand px-3 py-1 rounded-full font-medium">ادمین</span>
        </GlassCard>

        <GlassCard padding="sm" as="nav" aria-label="منوی حساب کاربری" class="overflow-hidden !p-0">
          <NuxtLink
            v-for="link in navLinks" :key="link.path"
            :to="link.path"
            class="flex items-center gap-3 px-4 py-3.5 text-sm border-b border-glass-border last:border-0 transition-colors"
            :class="$route.path === link.path ? 'text-brand bg-brand/5 font-medium' : 'text-glass-text-secondary hover:text-glass-text-primary hover:bg-glass'"
          >
            <component :is="link.icon" class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            {{ link.label }}
          </NuxtLink>
          <button @click="handleLogout" class="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-error hover:bg-error/5 transition-colors">
            <svg class="w-4 h-4 flex-shrink-0" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            خروج از حساب
          </button>
        </GlassCard>
      </aside>

      <!-- Main -->
      <div class="lg:col-span-3 flex flex-col gap-6">
        <GlassCard padding="lg" as="section">
          <h2 class="text-base font-bold text-glass-text-primary mb-5 pb-4 border-b border-glass-border">ویرایش اطلاعات شخصی</h2>
          <form @submit.prevent="handleSave" class="flex flex-col gap-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GlassInput v-model="form.firstName" label="نام" placeholder="نام خود را وارد کنید" maxlength="50" :disabled="saving" />
              <GlassInput v-model="form.lastName" label="نام خانوادگی" placeholder="نام خانوادگی" maxlength="50" :disabled="saving" />
            </div>
            <GlassInput v-model="form.email" label="ایمیل" type="email" placeholder="example@email.com" dir="ltr" :error="emailError" :disabled="saving" @blur="validateEmail" />
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-glass-text-primary">شماره موبایل</label>
              <div class="rounded-2xl border border-glass-border bg-glass px-4 py-3 text-sm text-glass-text-disabled cursor-not-allowed font-fanum" dir="ltr" style="text-align: left;">{{ authStore.user?.phone }}</div>
            </div>
            <div class="flex items-center gap-3 pt-2">
              <GlassButton variant="primary" size="md" :loading="saving" :disabled="saving || !isDirty" @click="handleSave">
                {{ saving ? 'در حال ذخیره...' : 'ذخیره تغییرات' }}
              </GlassButton>
              <button v-if="isDirty" type="button" @click="resetForm" class="text-sm text-glass-text-secondary hover:text-glass-text-primary transition-colors">انصراف</button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { userService } from '~/services/user.service'
import GlassCard   from '~/components/glass/GlassCard.vue'
import GlassButton from '~/components/glass/GlassButton.vue'
import GlassInput  from '~/components/glass/GlassInput.vue'

definePageMeta({ layout: 'default', middleware: ['auth'] })

useSeoMeta({ title: 'پروفایل', robots: 'noindex' })

const authStore = useAuthStore()
const ui        = useUiStore()

const form = ref({ firstName: '', lastName: '', email: '' })
const saving     = ref(false)
const emailError = ref('')

function fillForm(u) { form.value = { firstName: u?.firstName || '', lastName: u?.lastName || '', email: u?.email || '' } }
watch(() => authStore.user, (u) => fillForm(u), { immediate: true })

const isDirty = computed(() => {
  const u = authStore.user
  return form.value.firstName !== (u?.firstName || '') || form.value.lastName !== (u?.lastName || '') || form.value.email !== (u?.email || '')
})

function resetForm() { fillForm(authStore.user); emailError.value = '' }

function validateEmail() {
  const v = form.value.email
  emailError.value = (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) ? 'ایمیل معتبر نیست' : ''
}

async function handleSave() {
  validateEmail()
  if (emailError.value) return
  saving.value = true
  try {
    const payload = {}
    if (form.value.firstName !== (authStore.user?.firstName || '')) payload.firstName = form.value.firstName
    if (form.value.lastName  !== (authStore.user?.lastName  || '')) payload.lastName  = form.value.lastName
    if (form.value.email     !== (authStore.user?.email     || '')) payload.email      = form.value.email
    const { data } = await userService.updateProfile(payload)
    authStore.user = data
    ui.addToast('اطلاعات با موفقیت ذخیره شد', 'success')
  } catch (err) {
    const msg = err?.response?.data?.message
    ui.addToast(Array.isArray(msg) ? msg[0] : (msg || 'خطا در ذخیره اطلاعات'), 'error')
  } finally { saving.value = false }
}

async function handleLogout() { await authStore.logout(); navigateTo('/') }

const fullName = computed(() => [authStore.user?.firstName, authStore.user?.lastName].filter(Boolean).join(' '))
const initials = computed(() => {
  if (authStore.user?.firstName) return authStore.user.firstName[0]
  if (authStore.user?.phone)     return authStore.user.phone.slice(-2)
  return '؟'
})

// SVG icon components for nav links (replaces emoji for cross-platform consistency)
const IconUser = { template: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>` }
const IconBox  = { template: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>` }
const IconHeart = { template: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>` }
const IconHome  = { template: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>` }
const IconBell  = { template: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>` }

const navLinks = [
  { path: '/user/profile',       icon: IconUser,  label: 'اطلاعات شخصی' },
  { path: '/user/orders',        icon: IconBox,   label: 'سفارش‌های من' },
  { path: '/user/favorites',     icon: IconHeart, label: 'علاقه‌مندی‌ها' },
  { path: '/user/addresses',     icon: IconHome,  label: 'آدرس‌های من' },
  { path: '/user/notifications', icon: IconBell,  label: 'اعلان‌ها' },
]

onMounted(() => authStore.fetchProfile())
</script>
